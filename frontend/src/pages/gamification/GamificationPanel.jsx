import { useEffect, useState } from "react";
import "./GamificationPanel.css";
import { getUserStats, checkIn, getBadges, getLeaderboard, getXpHistory } from "../../api/gamificationClient";
import { useAuth } from "../../context/AuthContext";
import { BADGES, badgeIcon, describeXpEvent } from "../../utils/progression";

function GamificationPanel({ onReward }) {
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
      .then((data) => setXpHistory(data.items || []))
      .catch(() => {});
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

      if (onReward && result.reward) {
        onReward(result.reward);
      } else if (onReward && result.xp_awarded) {
        onReward({
          xp_awarded: result.xp_awarded,
          label: result.message || "Daily check-in completed",
          badges: result.badges || [],
        });
      }

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

  const defaultBadgeDefs = [
    {
      slug: "challenge-completer",
      name: "Challenge Completer",
      description: "Submitted and completed a full project challenge.",
      icon: "🎯",
    },
    {
      slug: "high-achiever",
      name: "High Achiever",
      description: "Scored 16/20 or higher on an AI-evaluated submission.",
      icon: "⚡",
    },
    {
      slug: "perfectionist",
      name: "Perfectionist",
      description: "Scored 19/20 or higher on an AI-evaluated submission.",
      icon: "💎",
    },
  ];

  const badgeList =
    allBadges.length > 0
      ? allBadges.map((b) => ({
          ...b,
          unlocked: Boolean(b.unlocked),
          icon: badgeIcon(b.slug) || "🏅",
          description: b.description || (BADGES[b.slug] ? BADGES[b.slug].hint : "Complete tasks to unlock"),
        }))
      : defaultBadgeDefs.map((def) => ({
          ...def,
          unlocked: false,
          icon: badgeIcon(def.slug) || def.icon,
        }));

  const userLevel = stats?.level || stats?.rank || {
    level: 1,
    title: "Explorer",
    xp_into_level: 0,
    xp_for_next_level: 100,
    progress_percent: 0,
  };

  const levelNum = userLevel.level || userLevel.rank || 1;
  const levelTitle = userLevel.title || "Explorer";
  const xpInto = userLevel.xp_into_level ?? userLevel.xp_into_rank ?? 0;
  const xpForNext = userLevel.xp_for_next_level ?? userLevel.xp_for_next_rank ?? 100;
  const progressPercent = userLevel.progress_percent ?? 0;

  return (
    <div className="gami-panel">
      {/* Hero Level Banner with Integrated Check-in */}
      <div className="gami-level-card">
        <div className="gami-level-header">
          <div>
            <span className="gami-level-title">
              Level {levelNum} · {levelTitle}
            </span>
            <div className="gami-level-sub">Keep solving challenges to climb the ranks</div>
          </div>
          <div className="gami-header-actions">
            <span className="gami-level-next">
              {xpInto} / {xpForNext} XP to Level {levelNum + 1}
            </span>
            <button
              type="button"
              className="gami-checkin-btn"
              onClick={handleCheckIn}
              disabled={isCheckingIn}
            >
              {isCheckingIn ? "Checking in..." : "⚡ Daily Check-In"}
            </button>
          </div>
        </div>

        <div className="gami-level-track">
          <div className="gami-level-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {(checkInMessage || error) && (
          <div className="gami-status-msg">
            {checkInMessage && <span className="gami-info">{checkInMessage}</span>}
            {error && <span className="gami-error">{error}</span>}
          </div>
        )}
      </div>

      {/* Stats Summary Cards */}
      <div className="gami-stat-row">
        <div className="gami-stat-card">
          <span className="gami-stat-icon">✨</span>
          <span className="gami-stat-value">{stats?.xp ?? 0}</span>
          <span className="gami-stat-label">Total XP</span>
        </div>
        <div className="gami-stat-card">
          <span className="gami-stat-icon">🔥</span>
          <span className="gami-stat-value">{stats?.current_streak ?? 0}</span>
          <span className="gami-stat-label">Current Streak</span>
        </div>
        <div className="gami-stat-card">
          <span className="gami-stat-icon">🏆</span>
          <span className="gami-stat-value">{stats?.longest_streak ?? 0}</span>
          <span className="gami-stat-label">Best Streak</span>
        </div>
      </div>

      {/* Achievements & Badges */}
      <div className="gami-card gami-badges-section">
        <div className="gami-card-header">
          <div>
            <h3 className="gami-card-title">Achievements & Badges</h3>
            <p className="gami-card-subtitle">Unlock milestones by completing challenge phases and tasks</p>
          </div>
          <span className="gami-count-chip">
            {badgeList.filter((b) => b.unlocked).length} / {badgeList.length} Unlocked
          </span>
        </div>

        {badgesError ? (
          <p className="gami-error">{badgesError}</p>
        ) : (
          <div className="gami-badges-grid">
            {badgeList.map((badge) => {
              const isUnlocked = Boolean(badge.unlocked);
              return (
                <div
                  key={badge.slug || badge.name}
                  className={`gami-badge-item-card ${isUnlocked ? "unlocked" : "locked"}`}
                >
                  <div className="gami-badge-shield">
                    <span className="gami-badge-symbol">{isUnlocked ? badge.icon : "🔒"}</span>
                  </div>
                  <div className="gami-badge-body">
                    <span className="gami-badge-name">{badge.name}</span>
                    <span className="gami-badge-description">{badge.description}</span>
                  </div>
                  <div className="gami-badge-status-tag">
                    {isUnlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column Split: Leaderboard & Recent Activity */}
      <div className="gami-split-grid">
        {/* Left: Leaderboard */}
        <div className="gami-card gami-leaderboard-card">
          <div className="gami-card-header">
            <div>
              <h3 className="gami-card-title">Leaderboard</h3>
              <p className="gami-card-subtitle">Top learners and teammates</p>
            </div>
            <div className="gami-leaderboard-scopes">
              {["global", "institution", "class"].map((scope) => (
                <button
                  key={scope}
                  type="button"
                  className={`gami-scope-chip${leaderboardScope === scope ? " active" : ""}`}
                  onClick={() => setLeaderboardScope(scope)}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          {leaderboardError ? (
            <p className="gami-error">{leaderboardError}</p>
          ) : !leaderboard ? (
            <p className="gami-empty">Loading leaderboard...</p>
          ) : leaderboard.entries.length === 0 ? (
            <p className="gami-empty">No ranked users yet for this scope.</p>
          ) : (
            <div className="gami-table-wrapper">
              <table className="gami-leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Level</th>
                    <th style={{ textAlign: "right" }}>XP</th>
                    <th style={{ textAlign: "right" }}>Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className={entry.is_current_user ? "gami-leaderboard-you" : ""}
                    >
                      <td>
                        <span className={`rank-badge rank-${entry.rank}`}>
                          {entry.rank === 1 ? "🥇 1" : entry.rank === 2 ? "🥈 2" : entry.rank === 3 ? "🥉 3" : entry.rank}
                        </span>
                      </td>
                      <td className="user-name-cell">{entry.name}</td>
                      <td>{entry.rank_title || `Level ${entry.level || 1}`}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{entry.xp}</td>
                      <td style={{ textAlign: "right" }}>{entry.current_streak} 🔥</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Recent XP Activity */}
        <div className="gami-card gami-history-card">
          <div className="gami-card-header">
            <div>
              <h3 className="gami-card-title">Recent XP</h3>
              <p className="gami-card-subtitle">Latest earned milestones</p>
            </div>
          </div>

          {xpHistory.length === 0 ? (
            <p className="gami-empty">No XP yet — complete a phase in any challenge to start earning.</p>
          ) : (
            <ul className="gami-history-list">
              {xpHistory.slice(0, 7).map((item) => (
                <li key={item.id}>
                  <div className="gami-history-item-left">
                    <span className="gami-history-bullet">●</span>
                    <span className="gami-history-label">{describeXpEvent(item)}</span>
                  </div>
                  <span className="gami-history-points">+{item.points} XP</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default GamificationPanel;