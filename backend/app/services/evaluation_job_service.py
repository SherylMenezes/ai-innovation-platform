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
from app.services.llm_service import (
    analyze_idea_risks,
    calculate_idea_score,
    generate_swot_analysis,
)

logger = logging.getLogger(__name__)


class EvaluationJobNotFoundError(Exception):
    pass


def create_evaluation_job(db: Session, requested_by: str, title: str, description: str) -> EvaluationJob:
    job = EvaluationJob(
        requested_by=requested_by,
        title=title,
        description=description,
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
            db.commit()
            logger.exception("Evaluation job %s failed.", job_id)
            return

        job.result = result
        job.status = EvaluationJobStatus.completed.value
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info("Evaluation job %s completed.", job_id)
    finally:
        db.close()
