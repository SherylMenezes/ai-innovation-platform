import os
import logging
import asyncio
import time
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

# Supported models for the google-genai SDK. Ordered newest-first; a 503
# ("high demand") on one falls through to the next instead of failing the
# request outright. Confirmed available on this API key via
# client.models.list() — keep this list in sync with that if it changes.
MODEL_CANDIDATES = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]

# No function/tool calling happens anywhere in this module (no `tools=`
# is ever passed to GenerateContentConfig) — this just silences the SDK's
# "AFC in AsyncModels.generate_content is not recommended" warning, which
# fires regardless of whether tools are in use. Purely cosmetic.
_AFC_DISABLED = types.AutomaticFunctionCallingConfig(disable=True)

def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is missing or empty. "
            "Ensure load_dotenv() is called in main.py and .env contains GEMINI_API_KEY."
        )
    return genai.Client(api_key=api_key)


# The 503 fallback below only triggers when a model *errors*. A model that
# accepts the request and then never answers would hang the whole call (and
# the UI's "Asking AI..." spinner) forever, so every attempt gets its own
# cap, and the whole call gets a total budget so several slow models can't
# add up to minutes. Raise these if healthy responses are being cut off.
MODEL_TIMEOUT_SECONDS = 25
TOTAL_TIMEOUT_SECONDS = 75


async def _generate_with_fallback(prompt: str, response_schema=None, system_instruction: str = ""):
    """Helper that retries across supported models if API deprecations, server errors, or timeouts occur."""
    client = _get_client()
    last_exception = None
    deadline = time.monotonic() + TOTAL_TIMEOUT_SECONDS

    for model_name in MODEL_CANDIDATES:
        time_left = deadline - time.monotonic()
        if time_left <= 0:
            logger.warning("Gemini time budget used up; giving up.")
            break

        try:
            logger.info(f"Trying model '{model_name}'...")
            config = types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type="application/json" if response_schema else None,
                response_schema=response_schema if response_schema else None,
                system_instruction=system_instruction if system_instruction else None,
                automatic_function_calling=_AFC_DISABLED,
            )
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                ),
                timeout=min(MODEL_TIMEOUT_SECONDS, time_left),
            )
            return response
        except asyncio.TimeoutError:
            logger.warning(
                f"Model '{model_name}' did not respond in time. "
                f"Attempting fallback to next model..."
            )
            last_exception = TimeoutError(f"Model '{model_name}' did not respond in time.")
            continue
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
    raise TimeoutError("The AI service did not respond in time.")


# Shared by all three modes below, so the insight cards are always built
# from the same instructions no matter how much of the chain the student
# wrote themselves.
_REFINE_EXTRAS = """
Also fill in these fields. Keep every list item to one concise sentence, and be specific to THIS problem rather than generic:
- "synthesized_root_cause": the underlying cause the line of questioning arrives at, in one precise sentence.
- "refined_problem_statement": one or two sentences restating the problem so it is specific and actionable — who is affected, what goes wrong, and why it persists — ready to inspire solution ideas.
- "hidden_variables": exactly 3 factors the questions have not explicitly covered that may be driving or worsening the problem (for example incentives, regulation, infrastructure, culture, cost, timing).
- "stakeholders": 3 to 5 people or groups affected by, or able to influence, the problem — each written as "Who — their stake".
- "market_gaps": 2 or 3 gaps in how existing solutions or players address this narrowed-down problem.
- "trend_insights": 2 or 3 current technology, policy, or behavior trends that create an opening to address it.
"""


async def refine_problem_statement(
    problem_statement: str,
    existing_whys: list[str] | None = None,
) -> ProblemRefineResponse:
    """
    Generates the "Why" QUESTIONS of a 5 Whys analysis — the questions that
    narrow a broad problem down to a specific one — plus a refined problem
    statement and insight cards (hidden variables, stakeholders, market
    gaps, trends). Never the answers to the Whys. Three modes, chosen by
    how much of the chain the student has already written themselves:

    1. Nothing typed yet (existing_whys empty/None) — generate all 5
       questions from scratch.
    2. Some typed, some remaining — continue the student's own line of
       inquiry with only the remaining questions. five_whys is spliced
       together in Python (existing_whys + only the new ones) so the
       student's own wording is never swapped for the model's paraphrase.
    3. All 5 already typed — nothing left to generate; only the refined
       problem statement and insights are produced.
    """
    existing_whys = [w.strip() for w in (existing_whys or []) if w and w.strip()]
    remaining = max(0, 5 - len(existing_whys))

    system_instruction = (
        "You are an elite product strategy mentor. Help students narrow a broad "
        "problem down to a specific, addressable one by asking sharp, well-aimed "
        "'Why' questions. You write questions, never answers."
    )

    # --- Mode 1: blank start ---
    if not existing_whys:
        prompt = f"""
You are an expert product design and engineering coach specializing in rigorous root cause analysis.

Problem statement:
"{problem_statement}"

Generate the five 'Why' questions of a 5 Whys analysis for this problem. Do NOT answer them — the student will investigate the answers themselves.

Instructions:
1. Write exactly 5 sequential 'Why' questions in five_whys. The first asks why the problem happens at all; each next question digs one level deeper into the most likely underlying cause implied by the question before it.
2. Every question must be specific and must narrow the focus toward a particular, addressable problem — not a broad restatement of the one before.
3. Write each as a single question sentence: no answers, explanations, or numbering.
{_REFINE_EXTRAS}
"""
        try:
            response = await _generate_with_fallback(
                prompt=prompt,
                response_schema=ProblemRefineResponse,
                system_instruction=system_instruction,
            )
            return ProblemRefineResponse.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini API Error in refine_problem_statement: {e}", exc_info=True)
            raise e

    numbered_existing = "\n".join(f"{i + 1}. {w}" for i, w in enumerate(existing_whys))

    # --- Mode 3: all five already written — insights only ---
    if remaining == 0:
        prompt = f"""
You are an expert product design and engineering coach specializing in rigorous root cause analysis.

Problem statement:
"{problem_statement}"

The student has written all five 'Why' questions of their 5 Whys analysis:
{numbered_existing}

Do not add, remove, or rephrase any of them. Return the same {len(existing_whys)} questions in five_whys, unchanged.
{_REFINE_EXTRAS}
Base every field on the student's line of questioning above.
"""
        try:
            response = await _generate_with_fallback(
                prompt=prompt,
                response_schema=ProblemRefineResponse,
                system_instruction=system_instruction,
            )
            parsed = ProblemRefineResponse.model_validate_json(response.text)
            # existing_whys, not parsed.five_whys, is authoritative — the
            # student's own words are never replaced by the model's echo.
            return parsed.model_copy(update={"five_whys": existing_whys})
        except Exception as e:
            logger.error(f"Gemini API Error in refine_problem_statement (insights-only): {e}", exc_info=True)
            raise e

    # --- Mode 2: continue the student's line of questioning ---
    prompt = f"""
You are an expert product design and engineering coach specializing in rigorous root cause analysis.

Problem statement:
"{problem_statement}"

The student has already written the first {len(existing_whys)} 'Why' question(s) of a 5 Whys analysis themselves:
{numbered_existing}

Continue this exact line of inquiry. Do not restate or rephrase what the student wrote, and do NOT answer any question. In five_whys, write exactly {remaining} more sequential 'Why' question(s). Each one digs a level deeper into the most likely underlying cause implied by the question before it, narrowing toward a specific, addressable problem. Do not include the student's own questions in five_whys.

Write each as a single question sentence: no answers, explanations, or numbering.
{_REFINE_EXTRAS}
Base every field on the full line of questioning — the student's questions plus yours.
"""
    try:
        response = await _generate_with_fallback(
            prompt=prompt,
            response_schema=ProblemRefineResponse,
            system_instruction=system_instruction,
        )
        parsed = ProblemRefineResponse.model_validate_json(response.text)
        continuation = list(parsed.five_whys)[:remaining]
        return parsed.model_copy(update={"five_whys": existing_whys + continuation})
    except Exception as e:
        logger.error(f"Gemini API Error in refine_problem_statement (continuation): {e}", exc_info=True)
        raise e


async def generate_hmw_statements(root_cause: str) -> HMWGenerateResponse:
    prompt = f"""
Based on the following rigorous root cause analysis, generate structured and creative 'How Might We' (HMW) statements:
"{root_cause}"

Instructions:
1. Frame 4 diverse, imaginative, and non-overlapping HMW statements.
2. Approach the problem from different strategic angles (e.g., automation, behavioral change, architectural redesign, ecosystem shift).
3. Ensure each statement unlocks fertile ground for innovative software solutions.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=HMWGenerateResponse,
        system_instruction="You are a seasoned innovation strategist. Generate powerful, high-impact 'How Might We' statements that spark out-of-the-box thinking."
    )
    return HMWGenerateResponse.model_validate_json(response.text)


async def score_problem_statement(problem_statement: str) -> ProblemScoreResponse:
    prompt = f"""
Rigorously evaluate and score the quality of this user-submitted problem statement:
"{problem_statement}"

Evaluation Criteria (0 to 100 scale):
- Clarity: Is the wording transparent, precise, and easily understandable?
- Specificity: Does it target a distinct user group, domain, or environment instead of vague generalities?
- Actionability: Does it contain enough analytical depth to directly trigger software architectural design or feature planning?

Provide constructive, specific justification for your scoring along with actionable improvement tips.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=ProblemScoreResponse,
        system_instruction="You are a strict technical evaluator. Assess problem statements with high precision and unbiased metrics."
    )
    return ProblemScoreResponse.model_validate_json(response.text)


async def generate_scamper_prompts(hmw_statement: str) -> ScamperPromptResponse:
    prompt = f"""
Apply all 7 SCAMPER ideation techniques comprehensively to the following HMW statement:
"{hmw_statement}"

Techniques to cover:
1. Substitute (What materials, steps, or features can be swapped?)
2. Combine (What services or data streams can be merged?)
3. Adapt (What elements can be borrowed from a completely different industry?)
4. Modify / Magnify (What can be scaled up, exaggerated, or redesigned?)
5. Put to another use (How could this solve an entirely different secondary problem?)
6. Eliminate (What core friction or redundant step can be completely removed?)
7. Reverse (What if the workflow or user incentives were completely inverted?)

Generate creative, disruptive prompts and seed ideas for each category.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=ScamperPromptResponse,
        system_instruction="You are a master of design thinking and rapid prototyping. Provide distinct, highly imaginative insights for every SCAMPER dimension."
    )
    return ScamperPromptResponse.model_validate_json(response.text)


async def generate_mind_map_nodes(concept: str) -> MindMapResponse:
    prompt = f"""
Construct a structured, hierarchical mind map layout for the core project concept:
"{concept}"

Instructions:
- Establish a clear root node representing the central project premise.
- Generate logical primary branch nodes (e.g., Core Features, Target Users, Tech Stack Requirements, Potential Bottlenecks).
- Subdivide branches cleanly to provide a thorough structural map of the concept.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=MindMapResponse,
        system_instruction="You are a system architect. Organize conceptual data into an intuitive, hierarchical tree structure."
    )
    return MindMapResponse.model_validate_json(response.text)


async def evaluate_ideation_list(ideas: list) -> IdeaEvaluationResponse:
    ideas_text = "\n".join([
        f"- ID: {getattr(i, 'id', idx)}, Title: {getattr(i, 'title', str(i))}, Description: {getattr(i, 'description', '')}"
        for idx, i in enumerate(ideas)
    ])
    prompt = f"""
Evaluate the following list of software project ideas across Feasibility and Impact to map them into a 2x2 matrix:
{ideas_text}

Quadrants mapping rules:
- 'Quick Win': High impact, low implementation complexity.
- 'Major Project': High impact, high implementation complexity.
- 'Fill-in': Low impact, low complexity.
- 'Thankless Task': Low impact, high complexity.

Provide objective rationale for each categorization.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=IdeaEvaluationResponse,
        system_instruction="You are a technical product manager. Evaluate project trade-offs objectively based on developer effort versus user value."
    )
    return IdeaEvaluationResponse.model_validate_json(response.text)


async def generate_divergent_ideas(context: str, count: int = 5) -> GenerateIdeasResponse:
    prompt = f"""
You are an elite software architect and startup accelerator mentor.
Based on the following context, generate {count} unique, highly creative, and non-overlapping project feature directions:
"{context}"

Instructions:
1. Avoid generic, cliché solutions (e.g., standard basic to-do lists or generic login boards).
2. Propose clever integrations, unique workflows, or smart automations leveraging modern full-stack or AI technologies.
3. Provide a compelling title, a precise 2-sentence description, and an innovative edge for each suggestion.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=GenerateIdeasResponse,
        system_instruction="You are a visionary startup technical advisor. Formulate breakthrough project feature ideas with high creative merit."
    )
    return GenerateIdeasResponse.model_validate_json(response.text)


async def remix_ideas(descriptions: list) -> RemixIdeasResponse:
    # Fixed: descriptions previously weren't actually interpolated into
    # the prompt (the join() call sat outside the f-string's {} braces
    # and was sent to Gemini as literal text) — the remix endpoint was
    # unknowingly asking Gemini to merge ideas without ever telling it
    # what they were.
    joined_descriptions = "\n".join(descriptions)
    prompt = f"""
Synthesize and cross-pollinate the following distinct project ideas into a single, cohesive, hybrid solution:
{joined_descriptions}

Instructions:
1. Extract the strongest unique value propositions from each individual concept.
2. Merge them intelligently into a unified, synergistic product blueprint that is greater than the sum of its parts.
3. Outline the core hybrid title, combined description, and the unique advantage of the merger.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=RemixIdeasResponse,
        system_instruction="You are an expert product innovator. Combine disparate product features into seamless, high-value hybrid concepts."
    )
    return RemixIdeasResponse.model_validate_json(response.text)


async def calculate_idea_score(title: str, description: str) -> IdeaScoreResponse:
    prompt = f"""
Rigorously score the following software project idea across technical feasibility, user impact, and execution complexity:
Title: {title}
Description: {description}

Scoring Guidelines:
- Use a full 0-100 scale (0 = worst/impossible, 100 = best/trivial complexity or maximum value). Do not cluster everything around a narrow band.
- Technical Feasibility: Assess dependency on modern APIs, architecture difficulty, and data requirements.
- User Impact: Assess how significantly this solves the underlying pain point.
- Execution Complexity: Evaluate how difficult it is for a student dev team to build an MVP.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=IdeaScoreResponse,
        system_instruction=(
            "Evaluate technical feasibility, user impact, and execution complexity objectively. "
            "Score each dimension on a 0-100 scale using the full distribution range."
        )
    )
    return IdeaScoreResponse.model_validate_json(response.text)


async def analyze_idea_risks(title: str, description: str = "") -> RiskAnalysisResponse:
    prompt = f"""
Conduct a comprehensive risk analysis for the following innovation project:
Title: {title}
Description: {description}

Identify critical risks across:
1. Technical Risks (e.g., scalability, API limits, performance bottlenecks, complex state management)
2. Adoption Risks (e.g., user friction, onboarding complexity, lack of clear incentive)
3. Execution Risks (e.g., scope creep, timeline constraints, skill gaps)

Provide concrete, actionable mitigation strategies for each identified risk.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=RiskAnalysisResponse,
        system_instruction="You are a senior risk management consultant. Identify hidden technical and product risks with realistic mitigation paths."
    )
    return RiskAnalysisResponse.model_validate_json(response.text)


async def generate_swot_analysis(title: str, description: str) -> SWOTAnalysisResponse:
    prompt = f"""
Perform a rigorous SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis for:
Title: {title}
Description: {description}

Provide sharp, realistic insights tailored to a student-led software development lifecycle, concluding with a strategic execution recommendation.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=SWOTAnalysisResponse,
        system_instruction="You are a startup business strategist. Deliver a precise, objective, and actionable SWOT assessment."
    )
    return SWOTAnalysisResponse.model_validate_json(response.text)


async def run_mentor_coach(workspace_context: str, user_query: str, stage: str) -> MentorCoachResponse:
    prompt = f"""
Current Project Stage: {stage}
Workspace Context: {workspace_context}
Student Query: {user_query}

Act as a Socratic engineering coach. Guide the student using insightful questions and hints rather than feeding them direct code or answers.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=MentorCoachResponse,
        system_instruction="You are a Socratic mentor guiding student developers through guided discovery and reasoning."
    )
    return MentorCoachResponse.model_validate_json(response.text)


async def stream_socratic_mentor(
    workspace_context: str,
    user_query: str,
    current_stage: str
) -> AsyncGenerator[str, None]:
    """
    Stream context-aware Socratic mentoring feedback.
    """

    client = _get_client()

    system_instruction = """
You are an elite AI Mentor for a project-based learning and innovation platform.
Your objective is to help students independently build their solutions through critical thinking.

CORE BEHAVIORAL MANDATES:
1. Always apply the Socratic method—lead with targeted guiding questions.
2. NEVER immediately output complete source code solutions or final answers unless requested as a conceptual last resort.
3. Break down challenging blockers into small, manageable cognitive steps.
4. Reference the student's active workspace context and current project stage seamlessly.
5. Maintain an encouraging, constructive, and rigorous coaching tone.

STAGE-SPECIFIC COACHING RULES:
- Problem Framing: Challenge assumptions, check user evidence, and push for sharp metrics.
- Ideation: Prompt consideration of edge cases, user friction, and technical novelty.
- Evaluation: Guide students to weigh technical feasibility against impact criteria.
- Implementation: Ask what debugging steps or logs they have checked before offering architecture hints.
- Submission: Review completeness, testing coverage, and documentation standards.
"""

    prompt = f"""
Current Project Stage: {current_stage}
Current Workspace Context: {workspace_context}
Student's Message: {user_query}

Provide a concise, context-aware mentoring response that unblocks the student's thinking via targeted Socratic inquiry.
"""

    last_exception = None

    for model_name in MODEL_CANDIDATES:
        try:
            response_stream = await client.aio.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    system_instruction=system_instruction,
                    automatic_function_calling=_AFC_DISABLED,
                ),
            )

            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text

            return

        except Exception as e:
            logger.warning(
                f"Streaming failed on {model_name}: {e}. "
                "Retrying with next model..."
            )
            last_exception = e
            await asyncio.sleep(0.5)

    if last_exception:
        raise last_exception