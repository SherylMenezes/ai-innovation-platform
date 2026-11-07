"""Database migration runner.

Run from the backend folder with the venv active:

    python database/migrate.py              apply every new migration
    python database/migrate.py --status     show applied / pending migrations
    python database/migrate.py --seed demo_institution.sql
                                            run one file from database/seeds/

Migrations are the .sql files in database/migrations/, applied in name order
(001_..., 002_..., ...). Each one runs inside its own transaction and is
recorded in the schema_migrations table, so it is never applied twice.
If a migration fails, it is rolled back and the runner stops.
"""

import argparse
import os
import re
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    sys.exit("psycopg2 is missing. Run: pip install psycopg2-binary")

DATABASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = DATABASE_DIR.parent
MIGRATIONS_DIR = DATABASE_DIR / "migrations"
SEEDS_DIR = DATABASE_DIR / "seeds"


def load_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    env_file = BACKEND_DIR / ".env"
    if not url and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL") and "=" in line:
                url = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    if not url:
        sys.exit("DATABASE_URL not found in the environment or backend/.env")
    # SQLAlchemy style (postgresql+psycopg2://) -> plain postgresql://
    return re.sub(r"^postgres(ql)?\+\w+://", "postgresql://", url)


def ensure_tracking_table(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version     VARCHAR(255) PRIMARY KEY,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )


def applied_versions(cur) -> set[str]:
    cur.execute("SELECT version FROM schema_migrations")
    return {row[0] for row in cur.fetchall()}


def migration_files() -> list[Path]:
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


EXPECTED_ID_TYPES = {
    "users": "character varying",
    "challenges": "integer",
    "enrollments": "integer",
}


def check_id_types(cur) -> None:
    """Migration 001 is written for these id types; stop early if the database differs."""
    cur.execute(
        """
        SELECT table_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'id'
          AND table_name IN ('users', 'challenges', 'enrollments')
        """
    )
    found = dict(cur.fetchall())
    wrong = {t: found.get(t) for t, expected in EXPECTED_ID_TYPES.items() if found.get(t) != expected}
    if wrong:
        sys.exit(
            f"Unexpected id types: {wrong}. Expected {EXPECTED_ID_TYPES}. "
            "Update the migration to match before running it."
        )


def show_status(cur) -> None:
    done = applied_versions(cur)
    files = migration_files()
    if not files:
        print("No migration files in database/migrations/.")
    for path in files:
        mark = "applied " if path.name in done else "PENDING "
        print(f"  {mark} {path.name}")


def run_migrations(conn) -> None:
    with conn.cursor() as cur:
        ensure_tracking_table(cur)
        conn.commit()
        done = applied_versions(cur)

    pending = [p for p in migration_files() if p.name not in done]
    if not pending:
        print("Database is up to date. Nothing to apply.")
        return

    for path in pending:
        try:
            with conn.cursor() as cur:
                if path.name.startswith("001_"):
                    check_id_types(cur)
                print(f"Applying {path.name} ...", end=" ", flush=True)
                cur.execute(path.read_text(encoding="utf-8"))
                cur.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.name,))
            conn.commit()
            print("done")
        except psycopg2.Error as exc:
            conn.rollback()
            sys.exit(f"FAILED, rolled back. Nothing from {path.name} was saved.\n{exc}")

    print(f"\nApplied {len(pending)} migration(s).")


def run_seed(conn, name: str) -> None:
    path = SEEDS_DIR / name
    if not path.exists():
        sys.exit(f"Seed file not found: {path}")
    print(f"Running seed {name} ...", end=" ", flush=True)
    try:
        with conn.cursor() as cur:
            cur.execute(path.read_text(encoding="utf-8"))
        conn.commit()
        print("done")
    except psycopg2.Error as exc:
        conn.rollback()
        sys.exit(f"FAILED, rolled back.\n{exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply database migrations.")
    parser.add_argument("--status", action="store_true", help="list applied and pending migrations")
    parser.add_argument("--seed", metavar="FILE", help="run a file from database/seeds/")
    args = parser.parse_args()

    conn = psycopg2.connect(load_database_url())
    try:
        if args.status:
            with conn.cursor() as cur:
                ensure_tracking_table(cur)
                conn.commit()
                show_status(cur)
        elif args.seed:
            run_seed(conn, args.seed)
        else:
            run_migrations(conn)
    finally:
        conn.close()


if __name__ == "__main__":
    main()