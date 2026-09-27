import { useEffect, useState } from "react";
import "./ProjectSummary.css";
import { getWorkspace } from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import { badgeIcon, describeXpEvent } from "../../utils/progression";

function ProjectSummary({ challengeId }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!challengeId || !accessToken) return;
    setIsLoading(true);
    setError("");
    getWorkspace(accessToken, challengeId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [challengeId, accessToken]);

  if (isLoading) {
    return <div className="summary-panel"><p className="summary-loading">Loading your project...</p></div>;
  }

  if (error) {
    return <div className="summary-panel"><p className="summary-loading">{error}</p></div>;
  }

  if (!data) return null;

  const canvas = data.canvas_state || {};
  const evaluation = data.evaluation_state || {};
  const submission = data.submission;
  const scorecard = submission?.scorecard;
  const rewards = data.rewards || [];
  const totalXp = rewards.reduce((sum, reward) => sum + reward.points, 0);

  return (
    <div className="summary-panel">
      <div className="summary-header">
        {data.status === "completed" && <span className="summary-badge">Completed</span>}
        <h1>{data.challenge.title}</h1>
      </div>

      <div className="summary-section">
        <h3>Problem Statement</h3>
        <p>{data.challenge.description}</p>
      </div>

      {canvas.root_cause && (
        <div className="summary-section">
          <h3>Root Cause & Approach</h3>
          <span className="summary-label">Root cause</span>
          <p>{canvas.root_cause}</p>
          {canvas.hmw && (
            <>
              <span className="summary-label">How Might We</span>
              <p>{canvas.hmw}</p>
            </>
          )}
          {canvas.selected_idea && (
            <>
              <span className="summary-label">Selected idea</span>
              <p><strong>{canvas.selected_idea.title}</strong> — {canvas.selected_idea.description}</p>
            </>
          )}
        </div>
      )}

      {(evaluation.swot || evaluation.scores) && (
        <div className="summary-section">
          <h3>Idea Evaluation</h3>
          {evaluation.swot && (
            <div className="summary-swot-grid">
              <div>
                <span className="summary-label">Strengths</span>
                <p>{evaluation.swot.strengths || "—"}</p>
              </div>
              <div>
                <span className="summary-label">Weaknesses</span>
                <p>{evaluation.swot.weaknesses || "—"}</p>
              </div>
              <div>
                <span className="summary-label">Opportunities</span>
                <p>{evaluation.swot.opportunities || "—"}</p>
              </div>
              <div>
                <span className="summary-label">Threats</span>
                <p>{evaluation.swot.threats || "—"}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="summary-section">
        <h3>Submission</h3>
        {submission ? (
          <>
            {submission.repository_url && (
              <p><a href={submission.repository_url} target="_blank" rel="noreferrer">{submission.repository_url}</a></p>
            )}
            {submission.file_url && <p><a href={submission.file_url} target="_blank" rel="noreferrer">View deliverable</a></p>}

            {scorecard ? (
              <>
                <div className="summary-scorecard-grid">
                  <div className="summary-stat">
                    <span className="summary-stat-value">{scorecard.innovation_score}</span>
                    <span className="summary-stat-label">Innovation</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-value">{scorecard.feasibility_score}</span>
                    <span className="summary-stat-label">Feasibility</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-value">{scorecard.impact_score}</span>
                    <span className="summary-stat-label">Impact</span>
                  </div>
                </div>
                <span className="summary-overall-score">{scorecard.overall_score} / 20</span>
                {scorecard.feedback && <p style={{ marginTop: 10 }}>{scorecard.feedback}</p>}
              </>
            ) : (
              <p>Evaluation still in progress.</p>
            )}
          </>
        ) : (
          <p>No submission recorded yet.</p>
        )}
      </div>

      <div className="summary-section">
        <h3>Rewards</h3>
        <p className="summary-rewards-total">
          <strong>{totalXp} XP</strong> earned from this challenge
          {" · "}
          {data.progress.levels_completed} of {data.progress.total_levels} levels cleared
        </p>

        {data.badges_earned.length > 0 && (
          <div className="summary-badge-list">
            {data.badges_earned.map((badge) => (
              <span key={badge.slug} className="summary-earned-badge" title={badge.description}>
                {badgeIcon(badge.slug)} {badge.name}
              </span>
            ))}
          </div>
        )}

        {rewards.length > 0 && (
          <ul className="summary-reward-list">
            {rewards.map((reward, index) => (
              <li key={index}>
                <span>{describeXpEvent(reward)}</span>
                <span className="summary-reward-points">+{reward.points} XP</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ProjectSummary;
