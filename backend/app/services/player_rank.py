"""A player's overall Rank, derived from lifetime XP. Kept separate from a
challenge's Levels (see xp_rules.CHALLENGE_LEVELS): Levels are the phases
of one project, Rank is progression across all of them.

Going from Rank n to n+1 costs 100 * n XP, so Rank 2 is at 100 XP,
Rank 3 at 300, Rank 4 at 600, Rank 5 at 1000."""
from dataclasses import asdict, dataclass

RANK_TITLES = [
    "Explorer",
    "Thinker",
    "Problem Solver",
    "Innovator",
    "Builder",
    "Visionary",
    "Trailblazer",
    "Pioneer",
]


@dataclass
class RankInfo:
    rank: int
    title: str
    total_xp: int
    xp_into_rank: int
    xp_for_next_rank: int
    progress_percent: float

    def as_dict(self) -> dict:
        return asdict(self)


def rank_threshold(rank: int) -> int:
    """Total XP needed to reach `rank`."""
    return 50 * rank * (rank - 1)


def rank_title(rank: int) -> str:
    return RANK_TITLES[min(rank, len(RANK_TITLES)) - 1]


def rank_for_xp(total_xp: int) -> RankInfo:
    total_xp = max(total_xp, 0)
    rank = 1
    while total_xp >= rank_threshold(rank + 1):
        rank += 1

    xp_into_rank = total_xp - rank_threshold(rank)
    xp_for_next_rank = rank_threshold(rank + 1) - rank_threshold(rank)
    return RankInfo(
        rank=rank,
        title=rank_title(rank),
        total_xp=total_xp,
        xp_into_rank=xp_into_rank,
        xp_for_next_rank=xp_for_next_rank,
        progress_percent=round(xp_into_rank / xp_for_next_rank * 100, 2),
    )
