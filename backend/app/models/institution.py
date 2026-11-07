"""Institution panel models. They match sql/institution_panel_schema.sql.

Run that SQL in Supabase first: create_all() makes missing tables but never
adds columns, indexes or check constraints to tables that already exist.
users.id is text (VARCHAR) in this database; challenges.id is an integer.
"""

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Column, DateTime, ForeignKey,
    Integer, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship

from app.database import Base

USER_ID = String       # users.id is VARCHAR
CHALLENGE_ID = Integer  # challenges.id is INTEGER

# The view gets its own metadata so create_all() never tries to create it as a table.
ViewBase = declarative_base()


def _now():
    return Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    normalized_name = Column(String(200), nullable=False, unique=True)
    type = Column(String(20), nullable=False, default="school")
    logo_url = Column(Text)
    address = Column(Text)
    contact_email = Column(String(255))
    contact_phone = Column(String(30))
    invite_code = Column(String(20), nullable=False, unique=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    settings = Column(JSONB, nullable=False, default=dict)
    created_at = _now()
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    groups = relationship("Group", back_populates="institution", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="institution", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("type IN ('school','college','university','incubator')", name="ck_institutions_type"),
    )


class Group(Base):
    """Grade -> Section, or Department -> Year -> Division, via parent_id."""

    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    kind = Column(String(20), nullable=False)
    academic_tier = Column(String(30))
    invite_code = Column(String(20), unique=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = _now()

    institution = relationship("Institution", back_populates="groups")
    parent = relationship("Group", remote_side=[id], back_populates="children")
    children = relationship("Group", back_populates="parent", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("kind IN ('grade','section','department','year','division')", name="ck_groups_kind"),
    )


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"))
    challenge_id = Column(CHALLENGE_ID, ForeignKey("challenges.id", ondelete="SET NULL"))
    name = Column(String(100), nullable=False)
    created_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    status = Column(String(20), nullable=False, default="active")  # active | archived
    created_at = _now()

    institution = relationship("Institution", back_populates="teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(20), nullable=False, default="member")     # leader | member
    status = Column(String(20), nullable=False, default="invited")  # invited | active | left
    joined_at = _now()

    team = relationship("Team", back_populates="members")


class MentorAssignment(Base):
    """A mentor linked to exactly one of: student, group, team."""

    __tablename__ = "mentor_assignments"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    mentor_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"))
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    is_primary = Column(Boolean, nullable=False, default=True)
    assigned_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = _now()


class ChallengeAssignment(Base):
    """Challenge given to the institution, a group, a team or one student.

    Progress is read from enrollments (assignment_id) and submissions.
    """

    __tablename__ = "challenge_assignments"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(CHALLENGE_ID, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    target_type = Column(String(20), nullable=False)  # institution | group | team | student
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    student_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"))
    starts_at = _now()
    due_at = Column(DateTime(timezone=True), nullable=False)
    note = Column(Text)
    status = Column(String(20), nullable=False, default="active")  # active | closed
    assigned_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = _now()
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class StudentImport(Base):
    """One CSV / Excel bulk upload and its result."""

    __tablename__ = "student_imports"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    file_name = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="processing")  # processing | completed | failed
    total_rows = Column(Integer, nullable=False, default=0)
    created_count = Column(Integer, nullable=False, default=0)
    skipped_count = Column(Integer, nullable=False, default=0)
    failed_count = Column(Integer, nullable=False, default=0)
    errors = Column(JSONB, nullable=False, default=list)  # [{"row": 7, "error": "invalid email"}]
    created_at = _now()
    completed_at = Column(DateTime(timezone=True))


class StudentInvite(Base):
    """Email invite for a student added by hand or by bulk upload."""

    __tablename__ = "student_invites"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"))
    import_id = Column(Integer, ForeignKey("student_imports.id", ondelete="SET NULL"))
    email = Column(String(255), nullable=False)
    name = Column(String(200))
    phone = Column(String(30))
    academic_tier = Column(String(30))
    roll_number = Column(String(50))
    token_hash = Column(String(128), nullable=False, unique=True)  # never store the raw token
    status = Column(String(20), nullable=False, default="pending")  # pending | accepted | expired | revoked
    invited_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    accepted_user_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = _now()


class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    award_type = Column(String(30), nullable=False)  # certificate | innovation_award | top_student | team_recognition
    title = Column(String(200), nullable=False)
    description = Column(Text)
    recipient_user_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"))
    recipient_team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"))
    challenge_id = Column(CHALLENGE_ID, ForeignKey("challenges.id", ondelete="SET NULL"))
    certificate_code = Column(String(30), unique=True)
    certificate_url = Column(Text)
    issued_by_id = Column(USER_ID, ForeignKey("users.id", ondelete="SET NULL"))
    issued_at = _now()


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(USER_ID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"))
    feature = Column(String(50), nullable=False)
    challenge_id = Column(CHALLENGE_ID, ForeignKey("challenges.id", ondelete="SET NULL"))
    model = Column(String(60))
    succeeded = Column(Boolean, nullable=False, default=True)
    created_at = _now()


class InstitutionStudentStats(ViewBase):
    """Read-only mapping of the institution_student_stats VIEW. Never write to it."""

    __tablename__ = "institution_student_stats"

    user_id = Column(USER_ID, primary_key=True)
    institution_id = Column(Integer)
    group_id = Column(Integer)
    name = Column(String)
    email = Column(String)
    roll_number = Column(String)
    academic_tier = Column(String)
    is_active = Column(Boolean)
    last_active_at = Column(DateTime(timezone=True))
    joined_at = Column(DateTime(timezone=True))
    total_xp = Column(Integer)
    current_streak = Column(Integer)
    enrolled_count = Column(Integer)
    completed_count = Column(Integer)
    submission_count = Column(Integer)
    avg_overall_score = Column(Numeric)
    badge_count = Column(Integer)


# ---------------------------------------------------------------------------
# Add these columns to your EXISTING models too:
#
# models/user.py  (User)
#     institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"))
#     group_id       = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"))
#     is_active      = Column(Boolean, nullable=False, default=True)
#     last_active_at = Column(DateTime(timezone=True))
#     roll_number    = Column(String(50))
#
# models/challenge.py  (Challenge)
#     owner_institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"))
#     visibility     = Column(String(20), nullable=False, default="public")  # public | institution
#     challenge_type = Column(String(20), nullable=False, default="theme")   # micro | theme | industry | company | own_idea
#
# models/challenge.py  (Enrollment)
#     assignment_id = Column(Integer, ForeignKey("challenge_assignments.id", ondelete="SET NULL"))
#     team_id       = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"))
#     updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
#     completed_at  = Column(DateTime(timezone=True))
#
# models/submission.py  (Submission)
#     team_id = Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"))
# ---------------------------------------------------------------------------