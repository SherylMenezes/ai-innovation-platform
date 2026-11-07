-- =====================================================================
-- Migration 001: institution panel (PostgreSQL / Supabase)
-- Built on top of your current 16 tables.
--
-- ID TYPES (matched to your Supabase database)
--   users.id        -> VARCHAR  (text ids)
--   challenges.id   -> INTEGER
--   enrollments.id  -> INTEGER
--   New tables get SERIAL integer ids of their own.
--
-- HOW TO RUN
--   python database/migrate.py
--   The runner wraps this file in a transaction and records it in
--   schema_migrations, so it only ever runs once. Nothing existing is
--   deleted; the two unused tables are only dropped if you uncomment
--   section 13.
-- =====================================================================

-- =====================================================================
-- PART A. NEW TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. institutions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institutions (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(200) NOT NULL,
    normalized_name  VARCHAR(200) NOT NULL UNIQUE,          -- lower(trim(name))
    type             VARCHAR(20)  NOT NULL DEFAULT 'school'
                     CHECK (type IN ('school', 'college', 'university', 'incubator')),
    logo_url         TEXT,
    address          TEXT,
    contact_email    VARCHAR(255),
    contact_phone    VARCHAR(30),
    invite_code      VARCHAR(20)  NOT NULL UNIQUE,          -- institution-wide join code
    is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,   -- set by platform admin
    settings         JSONB        NOT NULL DEFAULT '{}'::jsonb,  -- e.g. reminder days, labels
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. groups  (grades / sections, or departments / years / divisions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id              SERIAL PRIMARY KEY,
    institution_id  INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    kind            VARCHAR(20)  NOT NULL
                    CHECK (kind IN ('grade', 'section', 'department', 'year', 'division')),
    academic_tier   VARCHAR(30),
    invite_code     VARCHAR(20) UNIQUE,                     -- per-section join code
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_groups_parent_name
    ON groups (institution_id, (COALESCE(parent_id, 0)), (lower(name)));
CREATE INDEX IF NOT EXISTS ix_groups_institution_parent ON groups (institution_id, parent_id);

-- ---------------------------------------------------------------------
-- 3. teams + team_members
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id              SERIAL PRIMARY KEY,
    institution_id  INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    group_id        INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    challenge_id    INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
    name            VARCHAR(100) NOT NULL,
    created_by_id   VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_teams_institution ON teams (institution_id, status);

CREATE TABLE IF NOT EXISTS team_members (
    team_id    INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    status     VARCHAR(20) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'left')),
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_team_members_user ON team_members (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_one_leader ON team_members (team_id) WHERE role = 'leader';

-- ---------------------------------------------------------------------
-- 4. mentor_assignments  (mentor -> exactly one student, group or team)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_assignments (
    id              SERIAL PRIMARY KEY,
    institution_id  INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    mentor_id       VARCHAR NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    student_id      VARCHAR REFERENCES users(id)  ON DELETE CASCADE,
    group_id        INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    team_id         INTEGER REFERENCES teams(id)  ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by_id  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentor_one_target CHECK (
        (student_id IS NOT NULL)::int + (group_id IS NOT NULL)::int + (team_id IS NOT NULL)::int = 1
    )
);
CREATE INDEX IF NOT EXISTS ix_mentor_assignments_mentor ON mentor_assignments (mentor_id);
CREATE INDEX IF NOT EXISTS ix_mentor_assignments_group  ON mentor_assignments (group_id) WHERE group_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 5. challenge_assignments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_assignments (
    id              SERIAL PRIMARY KEY,
    institution_id  INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    challenge_id    INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    target_type     VARCHAR(20) NOT NULL
                    CHECK (target_type IN ('institution', 'group', 'team', 'student')),
    group_id        INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    team_id         INTEGER REFERENCES teams(id)  ON DELETE CASCADE,
    student_id      VARCHAR REFERENCES users(id)  ON DELETE CASCADE,
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at          TIMESTAMPTZ NOT NULL,
    note            TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    assigned_by_id  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_assignment_target CHECK (
        (target_type = 'institution' AND group_id IS NULL AND team_id IS NULL AND student_id IS NULL) OR
        (target_type = 'group'   AND group_id   IS NOT NULL AND team_id IS NULL AND student_id IS NULL) OR
        (target_type = 'team'    AND team_id    IS NOT NULL AND group_id IS NULL AND student_id IS NULL) OR
        (target_type = 'student' AND student_id IS NOT NULL AND group_id IS NULL AND team_id IS NULL)
    ),
    CONSTRAINT ck_assignment_dates CHECK (due_at > starts_at)
);
CREATE INDEX IF NOT EXISTS ix_assignments_institution_due ON challenge_assignments (institution_id, status, due_at);
CREATE INDEX IF NOT EXISTS ix_assignments_challenge       ON challenge_assignments (challenge_id);

-- ---------------------------------------------------------------------
-- 6. student_imports  (one row per CSV / Excel bulk upload)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_imports (
    id              SERIAL PRIMARY KEY,
    institution_id  INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    uploaded_by_id  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    file_name       VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing', 'completed', 'failed')),
    total_rows      INTEGER NOT NULL DEFAULT 0,
    created_count   INTEGER NOT NULL DEFAULT 0,
    skipped_count   INTEGER NOT NULL DEFAULT 0,             -- duplicates / already invited
    failed_count    INTEGER NOT NULL DEFAULT 0,
    errors          JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{ "row": 7, "error": "invalid email" }]
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_student_imports_institution ON student_imports (institution_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 7. student_invites  (email invites for added / bulk-uploaded students)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_invites (
    id                SERIAL PRIMARY KEY,
    institution_id    INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    group_id          INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    import_id         INTEGER REFERENCES student_imports(id) ON DELETE SET NULL,
    email             VARCHAR(255) NOT NULL,
    name              VARCHAR(200),
    phone             VARCHAR(30),
    academic_tier     VARCHAR(30),
    roll_number       VARCHAR(50),
    token_hash        VARCHAR(128) NOT NULL UNIQUE,         -- store a hash, never the raw token
    status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_by_id     VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    accepted_user_id  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    expires_at        TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Only one open invite per email per institution.
CREATE UNIQUE INDEX IF NOT EXISTS uq_invites_pending_email
    ON student_invites (institution_id, (lower(email))) WHERE status = 'pending';

-- ---------------------------------------------------------------------
-- 8. awards
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
    id                 SERIAL PRIMARY KEY,
    institution_id     INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    award_type         VARCHAR(30) NOT NULL
                       CHECK (award_type IN ('certificate', 'innovation_award', 'top_student', 'team_recognition')),
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    recipient_user_id  VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    recipient_team_id  INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    challenge_id       INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
    certificate_code   VARCHAR(30) UNIQUE,                  -- printed on the PDF, for verification
    certificate_url    TEXT,                                -- PDF in Supabase Storage
    issued_by_id       VARCHAR REFERENCES users(id) ON DELETE SET NULL,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_award_one_recipient CHECK (
        (recipient_user_id IS NOT NULL)::int + (recipient_team_id IS NOT NULL)::int = 1
    )
);
CREATE INDEX IF NOT EXISTS ix_awards_institution ON awards (institution_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS ix_awards_user ON awards (recipient_user_id) WHERE recipient_user_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 9. ai_usage_logs  (one row per Gemini call, for the AI usage report)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id  INTEGER REFERENCES institutions(id) ON DELETE SET NULL,
    feature         VARCHAR(50) NOT NULL,       -- 'mentor', 'five_whys', 'scamper', 'swot', 'evaluation' ...
    challenge_id    INTEGER REFERENCES challenges(id) ON DELETE SET NULL,
    model           VARCHAR(60),
    succeeded       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ai_usage_institution_time ON ai_usage_logs (institution_id, created_at);

-- =====================================================================
-- PART B. NEW COLUMNS ON EXISTING TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 10. users
-- ---------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id INTEGER REFERENCES institutions(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_id       INTEGER REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active      BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;   -- "active now" / "inactive 7+ days"
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number    VARCHAR(50);   -- school's own student ID

CREATE INDEX IF NOT EXISTS ix_users_institution_role ON users (institution_id, role);
CREATE INDEX IF NOT EXISTS ix_users_group            ON users (group_id);
CREATE INDEX IF NOT EXISTS ix_users_last_active      ON users (institution_id, last_active_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_roll_number
    ON users (institution_id, roll_number) WHERE roll_number IS NOT NULL;

-- ---------------------------------------------------------------------
-- 11. challenges
-- ---------------------------------------------------------------------
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS owner_institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS visibility     VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(20) NOT NULL DEFAULT 'theme';
DO $$ BEGIN
    ALTER TABLE challenges ADD CONSTRAINT ck_challenges_visibility
        CHECK (visibility IN ('public', 'institution'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE challenges ADD CONSTRAINT ck_challenges_type
        CHECK (challenge_type IN ('micro', 'theme', 'industry', 'company', 'own_idea'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS ix_challenges_owner ON challenges (owner_institution_id) WHERE owner_institution_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 12. enrollments and submissions
--     Link work to the assignment and team it belongs to, and record
--     when it finished, so participation reports are simple queries.
-- ---------------------------------------------------------------------
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS assignment_id INTEGER REFERENCES challenge_assignments(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS team_id       INTEGER REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ;   -- last time the stage changed
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ;

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes the panel's queries rely on (Postgres does not index foreign keys automatically).
CREATE INDEX IF NOT EXISTS ix_enrollments_user          ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS ix_enrollments_challenge     ON enrollments (challenge_id, current_stage);
CREATE INDEX IF NOT EXISTS ix_enrollments_assignment    ON enrollments (assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_submissions_user_chal     ON submissions (user_id, challenge_id);
CREATE INDEX IF NOT EXISTS ix_scorecards_submission     ON scorecards (submission_id);
CREATE INDEX IF NOT EXISTS ix_user_badges_user          ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS ix_xp_transactions_user_time ON xp_transactions (user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_mentor_messages_user_time ON mentor_messages (user_id, created_at);

-- =====================================================================
-- PART C. CLEAN-UP AND DATA MOVE
-- =====================================================================

-- ---------------------------------------------------------------------
-- 13. Unused duplicate tables (both have 0 rows).
--     Uncomment once you've confirmed no code imports their models.
-- ---------------------------------------------------------------------
-- DROP TABLE IF EXISTS user_gamification;
-- DROP TABLE IF EXISTS xp_history;

-- ---------------------------------------------------------------------
-- 14. Turn existing institution_name text into institution rows
--     and link users to them. users.institution_name is kept for now.
-- ---------------------------------------------------------------------
INSERT INTO institutions (name, normalized_name, invite_code)
SELECT DISTINCT ON (lower(trim(institution_name)))
       trim(institution_name),
       lower(trim(institution_name)),
       upper(substr(md5(random()::text), 1, 8))
FROM users
WHERE institution_name IS NOT NULL AND trim(institution_name) <> ''
ON CONFLICT (normalized_name) DO NOTHING;

UPDATE users u
SET institution_id = i.id
FROM institutions i
WHERE u.institution_id IS NULL
  AND lower(trim(u.institution_name)) = i.normalized_name;

-- =====================================================================
-- PART D. READ VIEW FOR THE STUDENTS PAGE AND DASHBOARD
-- One row per student with everything the panel lists, so the backend
-- reads one view instead of joining six tables in every endpoint.
-- =====================================================================
CREATE OR REPLACE VIEW institution_student_stats AS
SELECT
    u.id                                   AS user_id,
    u.institution_id,
    u.group_id,
    u.name,
    u.email,
    u.roll_number,
    u.academic_tier,
    u.is_active,
    u.last_active_at,
    u.created_at                           AS joined_at,
    COALESCE(gp.total_xp, 0)               AS total_xp,
    COALESCE(gp.current_streak, 0)         AS current_streak,
    COALESCE(e.enrolled_count, 0)          AS enrolled_count,
    COALESCE(e.completed_count, 0)         AS completed_count,
    COALESCE(s.submission_count, 0)        AS submission_count,
    s.avg_overall_score,
    COALESCE(b.badge_count, 0)             AS badge_count
FROM users u
LEFT JOIN user_gamification_profiles gp ON gp.user_id = u.id
LEFT JOIN (
    SELECT user_id,
           COUNT(*)                                          AS enrolled_count,
           COUNT(*) FILTER (WHERE current_stage = 'completed') AS completed_count
    FROM enrollments
    GROUP BY user_id
) e ON e.user_id = u.id
LEFT JOIN (
    SELECT sub.user_id,
           COUNT(DISTINCT sub.id)       AS submission_count,
           ROUND(AVG(sc.overall_score)::numeric, 1) AS avg_overall_score
    FROM submissions sub
    LEFT JOIN scorecards sc ON sc.submission_id = sub.id
    GROUP BY sub.user_id
) s ON s.user_id = u.id
LEFT JOIN (
    SELECT user_id, COUNT(*) AS badge_count
    FROM user_badges
    GROUP BY user_id
) b ON b.user_id = u.id
WHERE u.role = 'student';