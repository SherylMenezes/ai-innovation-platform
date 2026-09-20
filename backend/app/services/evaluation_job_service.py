"""
Day 4 (Epic 4.2 groundwork): async evaluation job trigger. A job bundles
the three existing synchronous evaluation calls (score, risk, SWOT) into
one scorecard, run in the background via FastAPI's BackgroundTasks so the
triggering request returns immediately instead of blocking on all three.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.evaluation import EvaluationJob, EvaluationJobStatus
from app.models.submission import Scorecard, Submission
from app.services.llm_service import (
    analyze_idea_risks,
    calculate_idea_score,
    generate_swot_analysis,
)

logger = logging.getLogger(__name__)


class EvaluationJobNotFoundError(Exception):
    pass


def create_evaluation_job(
    db: Session,
    requested_by: str,
    title: str,
    description: str,
    submission_id: int | None = None,
) -> EvaluationJob:
    job = EvaluationJob(
        requested_by=requested_by,
        title=title,
        description=description,
        submission_id=submission_id,
        status=EvaluationJobStatus.pending.value,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_evaluation_job(db: Session, job_id: str) -> EvaluationJob:
    job = db.get(EvaluationJob, job_id)
    if job is None:
        raise EvaluationJobNotFoundError(f"No evaluation job found with id {job_id!r}.")
    return job


async def run_evaluation_job(job_id: str) -> None:
    """Runs outside request scope, invoked via FastAPI BackgroundTasks
    after the triggering response has already been sent — opens its own
    DB session rather than depending on FastAPI's get_db()."""
    db = SessionLocal()
    try:
        job = db.get(EvaluationJob, job_id)
        if job is None:
            logger.warning("run_evaluation_job: job %s not found — skipping.", job_id)
            return

        job.status = EvaluationJobStatus.running.value
        job.started_at = datetime.now(timezone.utc)
        if job.submission_id is not None:
            submission = db.get(Submission, job.submission_id)
            if submission is not None:
                submission.status = "evaluating"
        db.commit()

        try:
            score = await calculate_idea_score(job.title, job.description)
            risks = await analyze_idea_risks(job.title, job.description)
            swot = await generate_swot_analysis(job.title, job.description)
            result = {
                "score": score.model_dump(),
                "risk_analysis": risks.model_dump(),
                "swot_analysis": swot.model_dump(),
            }
        except Exception as exc:
            job.status = EvaluationJobStatus.failed.value
            job.error_message = str(exc)[:1024]
            job.completed_at = datetime.now(timezone.utc)
            if job.submission_id is not None:
                submission = db.get(Submission, job.submission_id)
                if submission is not None:
                    submission.status = "submitted"
            db.commit()
            logger.exception("Evaluation job %s failed.", job_id)
            return

        job.result = result
        job.status = EvaluationJobStatus.completed.value
        job.completed_at = datetime.now(timezone.utc)

        if job.submission_id is not None:
            _write_scorecard(db, job.submission_id, score)

        db.commit()
        logger.info("Evaluation job %s completed.", job_id)
    finally:
        db.close()


def _write_scorecard(db: Session, submission_id: int, score) -> None:
    """Bridges the generic idea-scoring result onto a submission's
    Scorecard row. There's no dedicated "innovation" dimension in
    calculate_idea_score yet, so it's approximated as the feasibility/
    impact composite until a real innovation-scoring signal exists —
    documented here rather than presented as a distinct measurement."""
    innovation_score = round((score.feasibility_score + score.impact_score) / 2, 1)
    overall_score = round((innovation_score + score.feasibility_score + score.impact_score) / 3, 1)

    scorecard = db.query(Scorecard).filter(Scorecard.submission_id == submission_id).first()
    if scorecard is None:
        scorecard = Scorecard(submission_id=submission_id)
        db.add(scorecard)

    scorecard.innovation_score = innovation_score
    scorecard.feasibility_score = score.feasibility_score
    scorecard.impact_score = score.impact_score
    scorecard.overall_score = overall_score
    scorecard.feedback = score.summary

    submission = db.get(Submission, submission_id)
    if submission is not None:
        submission.status = "evaluated"
