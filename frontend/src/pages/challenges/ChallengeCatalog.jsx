import { useEffect, useState } from "react";
import "./ChallengeCatalog.css";
import {
  listChallenges,
  enrollInChallenge,
  getEnrolledChallenges,
  createChallenge,
} from "../../api/challengesClient";
import { useAuth } from "../../context/AuthContext";
import AddChallengeModal from "../../components/AddChallengeModal";

const DOMAINS = ["Healthcare", "Sustainability", "Agriculture", "Finance"];

function ChallengeCatalog({ onOpenChallenge }) {
  const { accessToken } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollError, setEnrollError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // challenge_id -> { status, current_stage }
  const [enrollments, setEnrollments] = useState({});

  const loadChallenges = () => {
    setIsLoading(true);
    setError("");
    listChallenges({ domain: domain || undefined, search: search || undefined })
      .then(setChallenges)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  const loadEnrollments = () => {
    if (!accessToken) return;
    getEnrolledChallenges(accessToken)
      .then((data) => {
        const map = {};
        for (const item of data.items) {
          map[item.challenge.id] = { status: item.status, current_stage: item.current_stage };
        }
        setEnrollments(map);
      })
      .catch(() => {
        // Non-fatal — cards just fall back to "Start".
      });
  };

  useEffect(() => {
    loadChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  useEffect(() => {
    loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadChallenges();
  };

  const handleCreateChallenge = async (payload) => {
    const created = await createChallenge(accessToken, payload);
    setChallenges((prev) => [created, ...prev]);
  };

  const handleSelect = async (challenge) => {
    const enrollment = enrollments[challenge.id];

    if (enrollment?.status === "completed") {
      onOpenChallenge(challenge.id, { status: "completed" });
      return;
    }

    if (enrollment) {
      onOpenChallenge(challenge.id, { status: enrollment.status, currentStage: enrollment.current_stage });
      return;
    }

    if (!accessToken) {
      setEnrollError("Log in to start a challenge.");
      return;
    }

    setEnrollingId(challenge.id);
    setEnrollError("");
    try {
      await enrollInChallenge(accessToken, challenge.id);
      setEnrollments((prev) => ({ ...prev, [challenge.id]: { status: "active", current_stage: "canvas" } }));
      onOpenChallenge(challenge.id, { status: "active", currentStage: "canvas" });
    } catch (err) {
      setEnrollError(err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="catalog-panel">
      <form className="catalog-toolbar" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          className="catalog-search"
          placeholder="Search challenges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          type="button"
          className={`catalog-chip${domain === "" ? " catalog-chip-active" : ""}`}
          onClick={() => setDomain("")}
        >
          All
        </button>

        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            className={`catalog-chip${domain === d ? " catalog-chip-active" : ""}`}
            onClick={() => setDomain(d)}
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          className="catalog-chip catalog-chip-add"
          onClick={() => {
            if (!accessToken) {
              setEnrollError("Log in to add a challenge.");
              return;
            }
            setIsModalOpen(true);
          }}
        >
          + Add Challenge
        </button>
      </form>

      {enrollError && <p className="catalog-error">{enrollError}</p>}

      {isLoading ? (
        <div className="catalog-loading">Loading challenges...</div>
      ) : error ? (
        <p className="catalog-error">{error}</p>
      ) : challenges.length === 0 ? (
        <div className="catalog-empty">No challenges match your filters.</div>
      ) : (
        <div className="catalog-grid">
          {challenges.map((c) => {
            const enrollment = enrollments[c.id];
            const isCompleted = enrollment?.status === "completed";
            const label = isCompleted
              ? "View Summary"
              : enrollment
              ? "Continue"
              : enrollingId === c.id
              ? "Starting..."
              : "Start";

            return (
              <div className={`catalog-card${isCompleted ? " catalog-card-completed" : ""}`} key={c.id}>
                <span className="catalog-card-domain">{c.domain}</span>
                {isCompleted && <span className="catalog-card-badge">Completed</span>}
                <h3>{c.title}</h3>
                <p className="catalog-card-desc">{c.description}</p>
                <span className="catalog-card-meta">Difficulty: {c.difficulty}</span>
                <button
                  type="button"
                  className="catalog-enroll-button"
                  disabled={enrollingId === c.id}
                  onClick={() => handleSelect(c)}
                >
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreateChallenge}
      />
    </div>
  );
}

export default ChallengeCatalog;