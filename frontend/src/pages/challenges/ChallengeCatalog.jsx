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


const DOMAINS = [
  { name: "Healthcare", icon: "🩺" },
  { name: "Sustainability", icon: "🌱" },
  { name: "Agriculture", icon: "🌾" },
  { name: "Finance", icon: "📈" },
];


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

  const [selectedChallenge, setSelectedChallenge] =
    useState(null);

  const [enrollments, setEnrollments] = useState({});


  // =====================================================
  // LOAD CHALLENGES
  // =====================================================

  const loadChallenges = () => {

    setIsLoading(true);
    setError("");

    listChallenges({
      domain: domain || undefined,
      search: search || undefined,
    })

      .then(setChallenges)

      .catch((err) => {
        setError(err.message);
      })

      .finally(() => {
        setIsLoading(false);
      });
  };


  // =====================================================
  // LOAD ENROLLMENTS
  // =====================================================

  const loadEnrollments = () => {

    if (!accessToken) return;

    getEnrolledChallenges(accessToken)

      .then((data) => {

        const map = {};

        for (const item of data.items) {

          map[item.challenge.id] = {
            status: item.status,
            current_stage: item.current_stage,
          };

        }

        setEnrollments(map);

      })

      .catch(() => {
        // Non-fatal
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


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearchSubmit = (event) => {

    event.preventDefault();

    loadChallenges();
  };


  // =====================================================
  // CREATE CHALLENGE
  // =====================================================

  const handleCreateChallenge = async (payload) => {

    const created = await createChallenge(
      accessToken,
      payload
    );

    setChallenges((prev) => [
      created,
      ...prev,
    ]);

    setIsModalOpen(false);
  };


  // =====================================================
  // START CHALLENGE
  // =====================================================

  const handleSelect = async (challenge) => {

    const enrollment =
      enrollments[challenge.id];


    if (enrollment?.status === "completed") {

      onOpenChallenge(
        challenge.id,
        {
          status: "completed",
        }
      );

      return;
    }


    if (enrollment) {

      onOpenChallenge(
        challenge.id,
        {
          status: enrollment.status,
          currentStage:
            enrollment.current_stage,
        }
      );

      return;
    }


    if (!accessToken) {

      setEnrollError(
        "Log in to start a challenge."
      );

      return;
    }


    setEnrollingId(challenge.id);

    setEnrollError("");


    try {

      await enrollInChallenge(
        accessToken,
        challenge.id
      );


      setEnrollments((prev) => ({
        ...prev,

        [challenge.id]: {
          status: "active",
          current_stage: "canvas",
        },
      }));


      onOpenChallenge(
        challenge.id,
        {
          status: "active",
          currentStage: "canvas",
        }
      );

    } catch (err) {

      setEnrollError(err.message);

    } finally {

      setEnrollingId(null);
    }
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="catalog-panel">

      {/* =================================================
          SEARCH
      ================================================= */}

      <form
        className="catalog-toolbar"
        onSubmit={handleSearchSubmit}
      >

        <div className="catalog-search-wrapper">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            className="catalog-search"
            placeholder="Search innovative challenges..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <div className="catalog-chips-group">

          <button
            type="button"
            className={`catalog-chip ${
              domain === ""
                ? "catalog-chip-active"
                : ""
            }`}
            onClick={() => setDomain("")}
          >
            All
          </button>


          {DOMAINS.map((d) => (

            <button
              key={d.name}
              type="button"
              className={`catalog-chip ${
                domain === d.name
                  ? "catalog-chip-active"
                  : ""
              }`}
              onClick={() =>
                setDomain(d.name)
              }
            >

              <span className="chip-icon">
                {d.icon}
              </span>

              {d.name}

            </button>

          ))}


          <button
            type="button"
            className="catalog-chip catalog-chip-add"
            onClick={() => {

              if (!accessToken) {

                setEnrollError(
                  "Log in to add a challenge."
                );

                return;
              }

              setIsModalOpen(true);
            }}
          >

            <span className="add-plus">
              +
            </span>

            Add Challenge

          </button>

        </div>

      </form>


      {enrollError && (
        <p className="catalog-error">
          {enrollError}
        </p>
      )}


      {/* =================================================
          CONTENT
      ================================================= */}

      {isLoading ? (

        <div className="catalog-loading">

          <div className="loading-spinner" />

          <span>
            Loading challenges...
          </span>

        </div>

      ) : error ? (

        <p className="catalog-error">
          {error}
        </p>

      ) : challenges.length === 0 ? (

        <div className="catalog-empty">

          <div className="empty-icon">
            📂
          </div>

          <p>
            No challenges match your filters.
          </p>

        </div>

      ) : (

        <div className="catalog-grid">

          {challenges.map((c) => {

            const enrollment =
              enrollments[c.id];

            const isCompleted =
              enrollment?.status === "completed";

            const label =
              isCompleted
                ? "View Summary"
                : enrollment
                ? "Continue"
                : enrollingId === c.id
                ? "Starting..."
                : "Start";

            const diffClass =
              (c.difficulty || "Beginner")
                .toLowerCase();


            return (

              <div
                className={`catalog-card ${
                  isCompleted
                    ? "catalog-card-completed"
                    : ""
                }`}
                key={c.id}
              >

                <div className="catalog-card-header">

                  <span className="catalog-card-domain">
                    {c.domain}
                  </span>


                  {isCompleted && (

                    <span className="catalog-card-badge">
                      Completed
                    </span>

                  )}

                </div>


                <h3>
                  {c.title}
                </h3>


                <p className="catalog-card-desc">
                  {c.description}
                </p>


                <div className="catalog-card-meta">

                  <span
                    className={`difficulty-indicator difficulty-${diffClass}`}
                  />

                  <span>
                    {c.difficulty}
                  </span>

                </div>


                {/* ACTION BUTTONS */}

                <div className="catalog-card-actions">

                  <button
                    type="button"
                    className="catalog-view-button"
                    onClick={() =>
                      setSelectedChallenge(c)
                    }
                  >
                    View More
                  </button>


                  <button
                    type="button"
                    className="catalog-enroll-button"
                    disabled={
                      enrollingId === c.id
                    }
                    onClick={() =>
                      handleSelect(c)
                    }
                  >
                    {label}
                  </button>

                </div>

              </div>
            );
          })}

        </div>
      )}


      {/* =================================================
          ADD CHALLENGE
      ================================================= */}

      <AddChallengeModal

        isOpen={isModalOpen}

        onClose={() =>
          setIsModalOpen(false)
        }

        onCreated={handleCreateChallenge}

      />


      {/* =================================================
          VIEW MORE
      ================================================= */}

      {selectedChallenge && (

        <div
          className="challenge-detail-overlay"
          onClick={() =>
            setSelectedChallenge(null)
          }
        >

          <div
            className="challenge-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="challenge-detail-header">

              <div>

                <span className="catalog-card-domain">
                  {selectedChallenge.domain}
                </span>

                <h2>
                  {selectedChallenge.title}
                </h2>

              </div>


              <button
                type="button"
                className="challenge-detail-close"
                onClick={() =>
                  setSelectedChallenge(null)
                }
              >
                ×
              </button>

            </div>


            {/* ABOUT */}

            <div className="detail-section">

              <h4>
                📝 DESCRIPTION
              </h4>

              <p>
                {selectedChallenge.description}
              </p>

            </div>


            {/* PROBLEM */}

            <div className="detail-section">

              <h4>
                🔴 PROBLEM
              </h4>

              <p>
                {selectedChallenge.problem ||
                  "Problem details have not been added yet."}
              </p>

            </div>


            {/* WHY */}

            <div className="detail-section">

              <h4>
                ❓ WHY IS THIS NEEDED?
              </h4>

              <p>
                {selectedChallenge.why_needed ||
                  "The reason this challenge is needed has not been added yet."}
              </p>

            </div>


            {/* WHO */}

            <div className="detail-section">

              <h4>
                👥 WHO IS AFFECTED?
              </h4>


              {selectedChallenge.who_affected?.length > 0 ? (

                <ul>

                  {selectedChallenge.who_affected.map(
                    (person, index) => (

                      <li key={index}>
                        {person}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p>
                  No affected groups specified.
                </p>

              )}

            </div>


            {/* GOAL */}

            <div className="detail-section">

              <h4>
                🎯 CHALLENGE GOAL
              </h4>

              <p>
                {selectedChallenge.goal ||
                  "Challenge goal has not been added yet."}
              </p>

            </div>


            {/* CONSTRAINTS */}

            {selectedChallenge.constraints?.length > 0 && (

              <div className="detail-section">

                <h4>
                  ⚙️ CONSTRAINTS
                </h4>

                <ul>

                  {selectedChallenge.constraints.map(
                    (constraint, index) => (

                      <li key={index}>
                        {constraint}
                      </li>

                    )
                  )}

                </ul>

              </div>

            )}


            {/* FOOTER */}

            <div className="challenge-detail-footer">

              <div>

                <span>
                  Difficulty:{" "}
                </span>

                <strong>
                  {selectedChallenge.difficulty}
                </strong>

              </div>


              {selectedChallenge.learning_tier && (

                <div>

                  <span>
                    Tier:{" "}
                  </span>

                  <strong>
                    {selectedChallenge.learning_tier}
                  </strong>

                </div>

              )}


              <button
                type="button"
                className="catalog-enroll-button"
                onClick={() => {

                  setSelectedChallenge(null);

                  handleSelect(
                    selectedChallenge
                  );

                }}
              >
                Start Challenge
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default ChallengeCatalog;