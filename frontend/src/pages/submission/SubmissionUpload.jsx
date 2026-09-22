import { useEffect, useRef, useState } from "react";
import "./SubmissionUpload.css";
import { getWorkspace } from "../../api/challengesClient";
import {
  createSubmission,
  evaluateSubmission,
  getSubmissionScorecard,
  getSubmissionStatus,
} from "../../api/submissionsClient";
import { useAuth } from "../../context/AuthContext";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20;

function SubmissionUpload({ challengeId, onCompleted }) {
  const { accessToken } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [file, setFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [submission, setSubmission] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState("");

  const pollRef = useRef(null);

  useEffect(() => {
    if (!challengeId || !accessToken) return;
    setIsLoadingWorkspace(true);
    setWorkspaceError("");
    getWorkspace(accessToken, challengeId)
      .then((data) => {
        setChallenge(data.challenge);
        if (data.submission) setSubmission(data.submission);
        if (data.submission?.scorecard) setScorecard(data.submission.scorecard);
      })
      .catch((err) => setWorkspaceError(err.message))
      .finally(() => setIsLoadingWorkspace(false));
    return () => clearTimeout(pollRef.current);
  }, [challengeId, accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!challengeId || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    setScorecard(null);
    try {
      const result = await createSubmission(accessToken, {
        challengeId,
        file,
        repositoryUrl: repositoryUrl.trim() || undefined,
      });
      setSubmission(result);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollForScorecard = (submissionId, attemptsLeft) => {
    if (attemptsLeft <= 0) {
      setEvaluateError("Evaluation is taking longer than expected — check back shortly.");
      setIsEvaluating(false);
      return;
    }
    pollRef.current = setTimeout(async () => {
      try {
        const card = await getSubmissionScorecard(accessToken, submissionId);
        setScorecard(card);
        setIsEvaluating(false);
        const status = await getSubmissionStatus(accessToken, submissionId);
        setSubmission(status);
        onCompleted?.();
      } catch {
        // Not ready yet — keep polling.
        pollForScorecard(submissionId, attemptsLeft - 1);
      }
    }, POLL_INTERVAL_MS);
  };

  const handleEvaluate = async () => {
    if (!submission || isEvaluating) return;
    setIsEvaluating(true);
    setEvaluateError("");
    try {
      await evaluateSubmission(accessToken, submission.id);
      const status = await getSubmissionStatus(accessToken, submission.id);
      setSubmission(status);
      pollForScorecard(submission.id, MAX_POLL_ATTEMPTS);
    } catch (err) {
      setEvaluateError(err.message);
      setIsEvaluating(false);
    }
  };

  if (isLoadingWorkspace) {
    return <div className="submission-panel"><p className="submission-loading">Loading...</p></div>;
  }

  if (workspaceError) {
    return <div className="submission-panel"><p className="submission-error">{workspaceError}</p></div>;
  }

  return (
    <div className="submission-panel">
      {challenge && <h2 className="submission-challenge-title">{challenge.title}</h2>}

      {!scorecard && (
        <form className="submission-card" onSubmit={handleSubmit}>
          <label htmlFor="submission-file">Deliverable file (PDF, PPT, video)</label>
          <input
            id="submission-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <label htmlFor="submission-repo">Or a repository / prototype URL</label>
          <input
            id="submission-repo"
            type="text"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            placeholder="https://github.com/..."
          />

          <button type="submit" className="submission-submit-button" disabled={isSubmitting || Boolean(submission)}>
            {isSubmitting ? "Submitting..." : submission ? "Submitted" : "Submit deliverable"}
          </button>

          {submitError && <p className="submission-error">{submitError}</p>}
        </form>
      )}

      {submission && (
        <div className="submission-status-card">
          <h4>Submission #{submission.id}</h4>
          <span className={`submission-status-badge submission-status-${submission.status}`}>
            {submission.status}
          </span>

          {!scorecard && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="submission-submit-button"
                onClick={handleEvaluate}
                disabled={isEvaluating}
              >
                {isEvaluating ? "Evaluating..." : "Run AI evaluation"}
              </button>
            </div>
          )}

          {evaluateError && <p className="submission-error">{evaluateError}</p>}

          {scorecard && (
            <>
              <div className="scorecard-grid">
                <div className="scorecard-stat">
                  <span className="scorecard-stat-value">{scorecard.innovation_score}</span>
                  <span className="scorecard-stat-label">Innovation</span>
                </div>
                <div className="scorecard-stat">
                  <span className="scorecard-stat-value">{scorecard.feasibility_score}</span>
                  <span className="scorecard-stat-label">Feasibility</span>
                </div>
                <div className="scorecard-stat">
                  <span className="scorecard-stat-value">{scorecard.impact_score}</span>
                  <span className="scorecard-stat-label">Impact</span>
                </div>
              </div>
              <span className="scorecard-overall">{scorecard.overall_score} / 20</span>
              {scorecard.feedback && <p>{scorecard.feedback}</p>}
              <p className="submission-complete-note">
                This challenge is now complete — find it under My Progress or the Challenges tab any time.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SubmissionUpload;
