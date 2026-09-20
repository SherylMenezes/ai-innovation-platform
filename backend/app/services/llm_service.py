import os
import logging
import asyncio
from typing import AsyncGenerator
from google import genai
from google.genai import types
from google.genai.errors import ServerError, APIError, ClientError

from app.schemas.ai import (
    ProblemRefineResponse,
    HMWGenerateResponse,
    ProblemScoreResponse,
    ScamperPromptResponse,
    MindMapResponse,
    IdeaEvaluationResponse,
    GenerateIdeasResponse,
    RemixIdeasResponse,
    IdeaScoreResponse,
    RiskAnalysisResponse,
    SWOTAnalysisResponse,
    MentorCoachResponse,
)

logger = logging.getLogger("uvicorn.error")

# Supported models for the google-genai SDK
# Supported models for the google-genai SDK
MODEL_CANDIDATES = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-1.5-flash",
]

def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is missing or empty. "
            "Ensure load_dotenv() is called in main.py and .env contains GEMINI_API_KEY."
        )
    return genai.Client(api_key=api_key)


async def _generate_with_fallback(prompt: str, response_schema=None, system_instruction: str = ""):
    """Helper that retries across supported models if API deprecations or server errors occur."""
    client = _get_client()
    last_exception = None

    for model_name in MODEL_CANDIDATES:
        try:
            config = types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json" if response_schema else None,
                response_schema=response_schema if response_schema else None,
                system_instruction=system_instruction if system_instruction else None,
            )
            response = await client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            return response
        except (ServerError, APIError, ClientError) as e:
            logger.warning(
                f"Model '{model_name}' failed with error ({type(e).__name__}: {e}). "
                f"Attempting fallback to next model..."
            )
            last_exception = e
            await asyncio.sleep(0.5)
            continue
        except Exception as e:
            logger.error(f"Unexpected exception while invoking {model_name}: {e}")
            last_exception = e
            continue

    if last_exception:
        raise last_exception


async def refine_problem_statement(problem_statement: str) -> ProblemRefineResponse:
    prompt = f"""
Perform a '5 Whys' root cause analysis for the following problem statement:
"{problem_statement}"

Provide:
1. "five_whys": A list of exactly 5 strings representing the sequential 'Why' questions and answers leading to the root cause.
2. "synthesized_root_cause": A clear, single-sentence summary of the core underlying issue.
"""
    try:
        response = await _generate_with_fallback(
            prompt=prompt,
            response_schema=ProblemRefineResponse,
            system_instruction="You are an expert product design and engineering coach."
        )
        return ProblemRefineResponse.model_validate_json(response.text)
    except Exception as e:
        logger.error(f"Gemini API Error in refine_problem_statement: {e}", exc_info=True)
        raise e


async def generate_hmw_statements(root_cause: str) -> HMWGenerateResponse:
    prompt = f"Based on this root cause analysis, generate structured 'How Might We' (HMW) statements:\n\"{root_cause}\""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=HMWGenerateResponse,
        system_instruction="Generate 4 diverse 'How Might We' cards categorized appropriately."
    )
    return HMWGenerateResponse.model_validate_json(response.text)


async def score_problem_statement(problem_statement: str) -> ProblemScoreResponse:
    prompt = f"Evaluate and score the clarity, specificity, and actionability of this problem statement:\n\"{problem_statement}\""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=ProblemScoreResponse,
        system_instruction="Score the problem statement on a scale of 0-100 across Clarity, Specificity, and Actionability."
    )
    return ProblemScoreResponse.model_validate_json(response.text)


async def generate_scamper_prompts(hmw_statement: str) -> ScamperPromptResponse:
    prompt = f"Apply all 7 SCAMPER techniques to this HMW statement:\n\"{hmw_statement}\""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=ScamperPromptResponse,
        system_instruction="Provide innovative SCAMPER ideation prompts and idea seeds."
    )
    return ScamperPromptResponse.model_validate_json(response.text)


async def generate_mind_map_nodes(concept: str) -> MindMapResponse:
    prompt = f"Create a hierarchical mind map structure for the concept:\n\"{concept}\""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=MindMapResponse,
        system_instruction="Return a root node and key branch nodes forming a clean hierarchy."
    )
    return MindMapResponse.model_validate_json(response.text)


async def evaluate_ideation_list(ideas: list) -> IdeaEvaluationResponse:
    ideas_text = "\n".join([
        f"- ID: {getattr(i, 'id', idx)}, Title: {getattr(i, 'title', str(i))}, Description: {getattr(i, 'description', '')}"
        for idx, i in enumerate(ideas)
    ])
    prompt = f"Evaluate these ideas on Feasibility and Impact into 2x2 quadrants:\n{ideas_text}"
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=IdeaEvaluationResponse,
        system_instruction="Quadrants must be assigned as 'Quick Win', 'Major Project', 'Fill-in', or 'Thankless Task'."
    )
    return IdeaEvaluationResponse.model_validate_json(response.text)


async def generate_divergent_ideas(context: str, count: int = 5) -> GenerateIdeasResponse:
    prompt = f"Generate {count} creative, divergent project ideas based on context:\n\"{context}\""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=GenerateIdeasResponse,
        system_instruction="Provide unique, non-overlapping product/feature concepts."
    )
    return GenerateIdeasResponse.model_validate_json(response.text)


async def remix_ideas(descriptions: list) -> RemixIdeasResponse:
    prompt = f"Remix and combine the following idea concepts into a cohesive hybrid solution:\n" + "\n".join(descriptions)
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=RemixIdeasResponse,
        system_instruction="Synthesize key elements into an innovative, single hybrid concept."
    )
    return RemixIdeasResponse.model_validate_json(response.text)


async def calculate_idea_score(title: str, description: str) -> IdeaScoreResponse:
    prompt = f"Score this idea concept:\nTitle: {title}\nDescription: {description}"
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=IdeaScoreResponse,
        system_instruction="Evaluate technical feasibility, user impact, and execution complexity."
    )
    return IdeaScoreResponse.model_validate_json(response.text)


async def analyze_idea_risks(title: str, description: str = "") -> RiskAnalysisResponse:
    prompt = f"Perform a comprehensive risk analysis for:\nTitle: {title}\nDescription: {description}"
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=RiskAnalysisResponse,
        system_instruction="Identify Technical, Adoption, and Execution risks with actionable mitigations."
    )
    return RiskAnalysisResponse.model_validate_json(response.text)


async def generate_swot_analysis(title: str, description: str) -> SWOTAnalysisResponse:
    prompt = f"Perform a SWOT analysis for:\nTitle: {title}\nDescription: {description}"
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=SWOTAnalysisResponse,
        system_instruction="Provide actionable SWOT factors and a strategic recommendation."
    )
    return SWOTAnalysisResponse.model_validate_json(response.text)


async def run_mentor_coach(workspace_context: str, user_query: str, stage: str) -> MentorCoachResponse:
    prompt = f"Stage: {stage}\nWorkspace Context: {workspace_context}\nUser Query: {user_query}"
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=MentorCoachResponse,
        system_instruction="Act as a Socratic engineering coach. Guide the user with questions rather than giving direct answers."
    )
    return MentorCoachResponse.model_validate_json(response.text)


async def stream_socratic_mentor(workspace_context: str, user_query: str, current_stage: str) -> AsyncGenerator[str, None]:
    client = _get_client()
    prompt = (
        f"You are a Socratic AI Engineering Coach.\n"
        f"Current Stage: {current_stage}\n"
        f"Workspace Context: {workspace_context}\n"
        f"User Query: {user_query}\n\n"
        f"Guide the user through Socratic questioning and critical evaluation."
    )
    
    last_exception = None
    for model_name in MODEL_CANDIDATES:
        try:
            response_stream = await client.aio.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.7),
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            logger.warning(f"Streaming failed on {model_name}: {e}. Retrying with next model...")
            last_exception = e
            await asyncio.sleep(0.5)
            continue

    if last_exception:
        raise last_exception