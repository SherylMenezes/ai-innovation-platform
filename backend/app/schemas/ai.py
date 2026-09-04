from pydantic import BaseModel, Field
from typing import List

# 5-Whys Models (Tasks 1 & 2)
class ProblemRefineRequest(BaseModel):
    problem_statement: str = Field(..., min_length=10, description="Raw student problem statement")

class WhyStep(BaseModel):
    level: int
    question: str
    answer: str

class ProblemRefineResponse(BaseModel):
    whys: List[WhyStep]
    root_cause: str

# How-Might-We Models (Task 3)
class HmwGenerateRequest(BaseModel):
    problem_statement: str = Field(..., min_length=10, description="Original problem statement")
    root_cause: str = Field(..., min_length=5, description="Root cause identified by 5-Whys")

class HmwItem(BaseModel):
    id: str
    focus_area: str
    statement: str

class HmwGenerateResponse(BaseModel):
    root_cause: str
    hmw_statements: List[HmwItem]