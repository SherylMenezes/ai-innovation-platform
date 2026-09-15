from typing import Optional

from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    text: str = ""
    color: str = "sunshine"
    x: float = 0
    y: float = 0
    technique: Optional[str] = None


class NoteUpdate(BaseModel):
    text: Optional[str] = None
    color: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    technique: Optional[str] = None
    # Explicit flag: `technique: None` in NoteUpdate is ambiguous between
    # "leave it alone" (the PATCH default) and "clear it back to Unsorted"
    # (dragging a note out of a SCAMPER column) — this disambiguates it.
    clear_technique: bool = False


class NoteResponse(BaseModel):
    id: str
    text: str
    color: str
    x: float
    y: float
    technique: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
