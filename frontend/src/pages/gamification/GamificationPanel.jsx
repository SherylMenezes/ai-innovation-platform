import { useEffect, useState } from "react";
import "./GamificationPanel.css";
import { getUserStats, checkIn, getBadges, getLeaderboard, getXpHistory } from "../../api/gamificationClient";
import { useAuth } from "../../context/AuthContext";
import { BADGES, badgeIcon, describeXpEvent } from "../../utils/progression";

function GamificationPanel() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");

  const [badges, setBadges] = useState(null);
  const [badgesError, setBadgesError] = useState("");

  const [leaderboardScope, setLeaderboardScope] = useState("global");
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardError, setLeaderboardError] = useState("");

  const [xpHistory, setXpHistory] = useState([]);

  const loadStats = () => {
    setIsLoading(true);
    setError("");
    getUserStats(accessToken)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
    getXpHistory(accessToken)
      .then((data) => setXpHistory(data.items))
      .catch(() => {
        // Non-fatal — the history list just stays empty.
      });
  };

  useEffect(() => {
    if (accessToken) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    getBadges(accessToken)
      .then(setBadges)
      .catch((err) => setBadgesError(err.message));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    getLeaderboard(accessToken, leaderboardScope)
      .then(setLeaderboard)
      .catch((err) => setLeaderboardError(err.message));
  }, [accessToken, leaderboardScope]);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setCheckInMessage("");
    setError("");
    try {
      const result = await checkIn(accessToken);
      setCheckInMessage(result.message);
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return <div className="gami-panel gami-loading">Loading your progress...</div>;
  }

  if (error && !stats) {
    return (
      <div className="gami-panel">
        <p className="gami-error">{error}</p>
      </div>
    );
  }

  const allBadges = badges?.badges || [];

  return (
    <div className="gami-panel">
      <div className="gami-rank-card">
        <div className="gami-rank-header">
          <span className="gami-rank-title">
            Rank {stats.rank.rank} · {stats.rank.title}
          </span>
          <span className="gami-rank-next">
            {stats.rank.xp_into_rank} / {stats.rank.xp_for_next_rank} XP to Rank {stats.rank.rank + 1}
          </span>
        </div>
        <div className="gami-rank-track">
          <div className="gami-rank-fill" style={{ width: `${stats.rank.progress_percent}%` }} />
        </div>
      </div>

      <div className="gami-stat-row">
        <div className="gami-stat-card">
          <span className="gami-stat-value">{stats.xp}</span>
          <span className="gami-stat-label">XP</span>
        </div>
        <div className="gami-stat-card">
          <span className="gami-stat-value">{stats.current_streak}</span>
          <span className="gami-stat-label">Current streak</span>
        </div>
        <div className="gami-stat-card">
          <span className="gami-stat-value">{stats.longest_streak}</span>
          <span className="gami-stat-label">Longest streak</span>
        </div>
      </div>

      <div className="gami-badges">
        <h4>Badges</h4>
        {badgesError ? (
          <p className="gami-error">{badgesError}</p>
        ) : allBadges.length === 0 ? (
          <p className="gami-empty">No badges available yet.</p>
        ) : (
          <div className="gami-badge-list">
            {allBadges.map((b) => (
              <span
                className={`gami-badge${b.unlocked ? "" : " gami-badge-locked"}`}
                key={b.id}
                title={b.description}
              >
                {b.unlocked ? badgeIcon(b.slug) : "🔒"} {b.name}
                {!b.unlocked && BADGES[b.slug] && <small> — {BADGES[b.slug].hint}</small>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="gami-history">
        <h4>Recent XP</h4>
        {xpHistory.length === 0 ? (
          <p className="gami-empty">No XP yet — clear a Level in any challenge to start earning.</p>
        ) : (
          <ul className="gami-history-list">
            {xpHistory.map((item) => (
              <li key={item.id}>
                <span>{describeXpEvent(item)}</span>
                <span className="gami-history-points">+{item.points} XP</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" className="gami-checkin-button" onClick={handleCheckIn} disabled={isCheckingIn}>
        {isCheckingIn ? "Checking in..." : "Check in today"}
      </button>

      {checkInMessage && <p className="gami-info">{checkInMessage}</p>}
      {error && <p className="gami-error">{error}</p>}

      <div className="gami-leaderboard">
        <h4>Leaderboard</h4>
        <div className="gami-leaderboard-scopes">
          {["global", "institution", "class"].map((scope) => (
            <button
              key={scope}
              type="button"
              className={`gami-scope-chip${leaderboardScope === scope ? " gami-scope-chip-active" : ""}`}
              onClick={() => setLeaderboardScope(scope)}
            >
              {scope}
            </button>
          ))}
        </div>

        {leaderboardError ? (
          <p className="gami-error">{leaderboardError}</p>
        ) : !leaderboard ? (
          <p className="gami-empty">Loading leaderboard...</p>
        ) : leaderboard.entries.length === 0 ? (
          <p className="gami-empty">No ranked users yet for this scope.</p>
        ) : (
          <table className="gami-leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Title</th>
                <th>XP</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.entries.map((entry) => (
                <tr key={entry.user_id} className={entry.is_current_user ? "gami-leaderboard-you" : ""}>
                  <td>{entry.rank}</td>
                  <td>{entry.name}</td>
                  <td>{entry.rank_title}</td>
                  <td>{entry.xp}</td>
                  <td>{entry.current_streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GamificationPanel;
