import { useEffect, useState } from "react";
import "./GamificationPanel.css";
import { getUserStats, checkIn } from "../../api/gamificationClient";
import { useAuth } from "../../context/AuthContext";

// Purely derived from real xp/streak numbers returned by the backend —
// there is no badge model or endpoint yet, so nothing here is fabricated
// or stored; it just labels thresholds already crossed.
const XP_BADGES = [
  { threshold: 10, label: "First Steps", icon: "🌱" },
  { threshold: 50, label: "Rising Star", icon: "⭐" },
  { threshold: 100, label: "Century Club", icon: "💯" },
  { threshold: 500, label: "XP Master", icon: "🏆" },
];

const STREAK_BADGES = [
  { threshold: 3, label: "3-Day Streak", icon: "🔥" },
  { threshold: 7, label: "Week Warrior", icon: "🔥" },
  { threshold: 14, label: "Two-Week Titan", icon: "⚡" },
  { threshold: 30, label: "Monthly Marathoner", icon: "👑" },
];

function earnedBadges(xp, longestStreak) {
  const earned = [
    ...XP_BADGES.filter((b) => xp >= b.threshold),
    ...STREAK_BADGES.filter((b) => longestStreak >= b.threshold),
  ];
  // Keep only the highest badge earned within each family so the panel
  // doesn't list "First Steps" once someone's already hit "XP Master".
  const highestXp = XP_BADGES.filter((b) => xp >= b.threshold).at(-1);
  const highestStreak = STREAK_BADGES.filter((b) => longestStreak >= b.threshold).at(-1);
  return [highestXp, highestStreak].filter(Boolean);
}

function GamificationPanel() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState("");

  const loadStats = () => {
    setIsLoading(true);
    setError("");
    getUserStats(accessToken)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (accessToken) loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

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

  const badges = earnedBadges(stats.xp, stats.longest_streak);

  return (
    <div className="gami-panel">
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
        {badges.length === 0 ? (
          <p className="gami-empty">No badges yet — check in daily and complete tasks to earn XP.</p>
        ) : (
          <div className="gami-badge-list">
            {badges.map((b) => (
              <span className="gami-badge" key={b.label}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <button type="button" className="gami-checkin-button" onClick={handleCheckIn} disabled={isCheckingIn}>
        {isCheckingIn ? "Checking in..." : "Check in today"}
      </button>

      {checkInMessage && <p className="gami-info">{checkInMessage}</p>}
      {error && <p className="gami-error">{error}</p>}
    </div>
  );
}

export default GamificationPanel;
