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
    ProblemCanvasScoreResponse,
    HMWGenerateResponse,
    ProblemScoreResponse,
    ScamperPromptResponse,
    MindMapResponse,
    IdeaEvaluationResponse,
    GenerateIdeasResponse,
    RemixIdeasResponse,
    IdeaScoreResponse,
    SwotScoreResponse,
    RankIdeasResponse,
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
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
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


class AIServiceUnavailableError(Exception):
    """Every Gemini model was overloaded, out of quota, or timed out.
    main.py turns this into a 503 with a readable message instead of a
    bare 500 Internal Server Error."""


def _unavailable_message(errors: list) -> str:
    if any(getattr(e, "code", None) == 429 for e in errors):
        return (
            "The AI service has used up its free daily quota for this API key. "
            "It resets once a day - try again later, or enable billing on the Gemini API key."
        )
    return (
        "The AI service is overloaded right now (Google's Gemini servers are busy). "
        "Please wait a minute and try again."
    )


async def _generate_with_fallback(prompt: str, response_schema=None, system_instruction: str = ""):
    """Helper that retries across supported models if API deprecations, server errors, or timeouts occur."""
    client = _get_client()
    last_exception = None
    availability_errors = []  # overload / quota / timeout, one per model tried
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
            availability_errors.append(last_exception)
            continue
        except (ServerError, APIError, ClientError) as e:
            logger.warning(
                f"Model '{model_name}' failed with error ({type(e).__name__}: {e}). "
                f"Attempting fallback to next model..."
            )
            last_exception = e
            if isinstance(e, ServerError) or getattr(e, "code", None) == 429:
                availability_errors.append(e)
            await asyncio.sleep(0.5)
            continue
        except Exception as e:
            logger.error(f"Unexpected exception while invoking {model_name}: {e}")
            last_exception = e
            continue

    # Only a pure availability failure becomes the friendly 503 — anything
    # else (bad request, schema problem, bug) is re-raised as-is so it
    # still shows up clearly in the server logs.
    if last_exception is None or last_exception in availability_errors:
        raise AIServiceUnavailableError(_unavailable_message(availability_errors)) from last_exception
    raise last_exception


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
    previous_answers: list[str] | None = None,
    current_step: int = 0,
    current_answer: str = "",
    help_me_answer: bool = False,
    previous_questions: list[str] | None = None,
    current_question: str = "",
) -> ProblemRefineResponse:
    """
    Sequential AI-assisted 5-Whys coaching. Exactly one of four modes runs
    per call, chosen from the inputs:

    1. ASK        — no answer yet: generate the Why question for current_step
                    (Why 1 comes from the primary problem) + thinking prompts.
    2. ANALYSE    — the student answered current_step (Why 1-4): give feedback
                    on that answer, then generate the NEXT Why from the whole
                    chain so far + thinking prompts for that next Why.
    3. HELP       — the student clicked "Help me answer": generate a possible
                    answer to the current question from the problem, every
                    previous question + answer, and the current question.
    4. FINAL      — Why 5 answered: analyse the whole chain (not just answer
                    5) into the root cause, a suggested HMW and insight cards.
    """
    previous_answers = [
        answer.strip()
        for answer in (previous_answers or [])
        if answer and answer.strip()
    ]
    previous_questions = [(q or "").strip() for q in (previous_questions or [])]
    current_answer = (current_answer or "").strip()
    current_question = (current_question or "").strip()
    current_step = max(0, min(current_step, 4))

    if help_me_answer:
        mode = "HELP"
    elif current_answer and current_step == 4:
        mode = "FINAL"
    elif current_answer:
        mode = "ANALYSE"
    else:
        mode = "ASK"

    # The full chain the AI reasons over: every question with its answer.
    chain_parts = []
    for index, answer in enumerate(previous_answers):
        question = previous_questions[index] if index < len(previous_questions) else ""
        chain_parts.append(
            f"WHY {index + 1}\n"
            f"Question: {question or '(question not recorded)'}\n"
            f"Answer: {answer}"
        )
    chain_context = "\n\n".join(chain_parts) if chain_parts else "No completed Whys yet."

    current_block = (
        f"WHY {current_step + 1}\n"
        f"Question: {current_question or '(not generated yet)'}\n"
        f"Answer: {current_answer or '(the student has not answered yet)'}"
    )

    next_why_number = current_step + 2  # only meaningful in ANALYSE mode

    mode_rules = {
        "ASK": f"""
TASK (ASK): Generate the question for Why {current_step + 1}.
- next_question: one specific, contextual Why question. For Why 1, ask why
  the primary problem happens. Otherwise ask about the cause behind the most
  recent answer in the chain. Never use generic filler like "Why does this
  problem exist?".
- thinking_prompts: exactly 3 short brainstorming angles for answering that
  question (people, processes, systems, incentives, resources, environment,
  behaviour...). They are possible directions, NOT facts.
- answer_feedback, generated_answer and all final-analysis fields: empty.""",
        "ANALYSE": f"""
TASK (ANALYSE): The student has just answered Why {current_step + 1}.
- answer_feedback: 1-2 sentences analysing that answer in the context of the
  whole chain — is it a genuine cause (not a restatement of the question or
  the previous answer)? Is it specific enough to dig deeper? If it is vague,
  say what to clarify. Be encouraging and concrete.
- next_question: the Why {next_why_number} question. It must investigate the
  cause behind the Why {current_step + 1} answer, informed by the entire
  chain (Why {next_why_number} builds on answers 1 to {current_step + 1}).
- thinking_prompts: exactly 3 short brainstorming angles for answering the
  NEW Why {next_why_number} question. Possible directions, NOT facts.
- generated_answer and all final-analysis fields: empty.""",
        "HELP": f"""
TASK (HELP): The student is stuck on Why {current_step + 1} and explicitly
asked for a possible answer.
- generated_answer: one concise, plausible answer to the CURRENT question,
  based only on the primary problem and every previous question and answer.
  Word it as a possibility ("may", "might", "could"), not a confirmed fact,
  and keep it short enough to edit in a text box.
- thinking_prompts: exactly 3 short angles for this same question.
- next_question: empty (the question does not change).
- answer_feedback and all final-analysis fields: empty.""",
        "FINAL": """
TASK (FINAL): All five Whys are answered. Analyse the COMPLETE chain, not
just answer 5.
- answer_feedback: 1-2 sentences on the Why 5 answer.
- synthesized_root_cause: one concise, fundamental root cause supported by
  the whole chain.
- suggested_hmw: one "How might we ...?" question that turns that root cause
  into an open-ended opportunity (no solution baked in).
- refined_problem_statement: a specific, actionable restatement.
- hidden_variables: exactly 3 plausible factors that may also matter.
- stakeholders: 3 to 5 relevant people/groups and their stake.
- market_gaps: 2 to 3 relevant gaps in existing approaches.
- trend_insights: 2 to 3 relevant technology, policy or behaviour trends.
- next_question, thinking_prompts and generated_answer: empty.
Do not invent facts; phrase uncertain insights as possibilities.""",
    }[mode]

    system_instruction = (
        "You are an expert Socratic product-design mentor helping a student "
        "perform a rigorous 5-Whys analysis. You generate the Why questions, "
        "offer thinking prompts that are possibilities rather than facts, and "
        "only write an answer for the student when they explicitly ask for help."
    )

    prompt = f"""
You are guiding a student through a sequential 5-Whys root-cause analysis.
Each Why investigates the cause behind the previous answer.

PRIMARY PROBLEM:
{problem_statement}

COMPLETED WHYS (question + student answer):
{chain_context}

CURRENT WHY:
{current_block}
{mode_rules}

Support the student's reasoning rather than doing the exercise for them.
Return only the structured response.
"""

    try:
        response = await _generate_with_fallback(
            prompt=prompt,
            response_schema=ProblemRefineResponse,
            system_instruction=system_instruction,
        )
        parsed = ProblemRefineResponse.model_validate_json(response.text)

        # Blank out anything that doesn't belong to this mode, so the
        # frontend can rely on exactly which fields each call fills.
        # five_whys stays empty (legacy field) so AI questions never
        # replace the student's answers.
        cleared = {"five_whys": []}
        if mode != "FINAL":
            cleared.update(
                synthesized_root_cause="",
                suggested_hmw="",
                refined_problem_statement="",
                hidden_variables=[],
                stakeholders=[],
                market_gaps=[],
                trend_insights=[],
            )
        if mode in ("HELP", "FINAL"):
            cleared["next_question"] = ""
        if mode != "HELP":
            cleared["generated_answer"] = ""
        if mode in ("ASK", "HELP"):
            cleared["answer_feedback"] = ""
        if mode == "FINAL":
            cleared["thinking_prompts"] = []
        return parsed.model_copy(update=cleared)
    except Exception as e:
        logger.error(
            f"Gemini API Error in refine_problem_statement: {e}",
            exc_info=True,
        )
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


async def score_problem_canvas(
    problem_statement: str,
    why_answers: list[str],
    root_cause: str = "",
    refined_problem_statement: str = "",
) -> ProblemCanvasScoreResponse:
    """Score the complete problem + 5-Whys chain for the Problem Canvas."""
    chain = "\n".join(
        f"Why {index}: {answer}"
        for index, answer in enumerate(why_answers, start=1)
    )

    prompt = f"""
Evaluate the student's complete Problem Framing Canvas.

ORIGINAL PROBLEM:
{problem_statement}

5-WHYS ANSWERS:
{chain}

ROOT CAUSE:
{root_cause or "Not separately provided."}

REFINED PROBLEM STATEMENT:
{refined_problem_statement or "Not separately provided."}

Score the complete causal chain from 0 to 100 for:

1. problem_clarity
How clearly and specifically does the complete chain explain the problem?

2. impact
How significant is the identified problem/root cause if the student's
reasoning is correct?

3. feasibility
How realistically can the identified problem be explored or addressed by
potential solutions?

Also provide 2 to 4 concise improvement suggestions.

IMPORTANT:
- Base the evaluation on the entire chain, not just the original sentence.
- Do not invent statistics or external facts.
- Distinguish reasonable hypotheses from confirmed facts.
- Evaluate the quality of the problem framing, not the student's grammar.

Return only the structured response.
"""

    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=ProblemCanvasScoreResponse,
        system_instruction=(
            "You are a rigorous but constructive design-thinking evaluator. "
            "Score the complete causal reasoning objectively."
        ),
    )
    return ProblemCanvasScoreResponse.model_validate_json(response.text)


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


async def score_idea_from_swot(
    title: str,
    description: str,
    strengths: str,
    weaknesses: str,
    opportunities: str,
    threats: str,
) -> SwotScoreResponse:
    prompt = f"""
Score the following innovation idea using the student's own SWOT analysis as evidence:
Title: {title}
Description: {description}

SWOT analysis written by the student:
Strengths:
{strengths or "(none given)"}
Weaknesses:
{weaknesses or "(none given)"}
Opportunities:
{opportunities or "(none given)"}
Threats:
{threats or "(none given)"}

Scoring Guidelines:
- Score each criterion as an integer from 1 (very poor) to 5 (excellent). Use the full range; do not default everything to 3 or 4.
- Feasibility: How realistic and practical is the idea to implement? Weigh the weaknesses and threats.
- Impact: How much value or positive change could the idea create? Weigh the strengths and opportunities.
- Innovation: How original or novel is the proposed solution compared to existing alternatives?
- Scalability: How easily could the idea grow to support more users or use cases?
- For each criterion, give a one-sentence reason that refers to specific points from the SWOT.
- A thin or empty SWOT is weak evidence; do not reward it with high scores.
- Finish with a two-sentence summary of the idea's overall standing.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=SwotScoreResponse,
        system_instruction=(
            "You are an impartial innovation-programme judge. Score ideas objectively "
            "on a 1-5 scale, grounding every score in the SWOT evidence provided."
        )
    )
    return SwotScoreResponse.model_validate_json(response.text)


async def rank_alternative_ideas(
    context: str,
    current_title: str,
    current_description: str,
    current_scores: dict,
    ideas: list,
) -> RankIdeasResponse:
    anchor = ", ".join(f"{key}: {value}/5" for key, value in current_scores.items()) or "not scored"
    ideas_text = "\n".join(
        f"- ID: {idea.id} | Title: {idea.title} | Description: {idea.description or ''}"
        for idea in ideas
    )
    prompt = f"""
A student is evaluating solution ideas for this challenge:
"{context}"

Their current idea has already been scored in depth using a SWOT analysis:
Title: {current_title}
Description: {current_description}
Scores: {anchor}

Score each of the following alternative ideas on the SAME 1-5 scale and criteria, using the
current idea's scores as a calibration anchor (an alternative that is clearly more feasible
than the current idea should score higher on feasibility, and so on):
{ideas_text}

Criteria:
- Feasibility: How realistic and practical is the idea to implement?
- Impact: How much value or positive change could the idea create?
- Innovation: How original or novel is the solution?
- Scalability: How easily could the idea grow to more users or use cases?

Rules:
- Return exactly one entry per alternative, reusing its ID unchanged.
- Integers 1-5 only. Be honest: alternatives should not all beat or all lose to the current idea.
- Give a one-sentence reason comparing each alternative to the current idea.
"""
    response = await _generate_with_fallback(
        prompt=prompt,
        response_schema=RankIdeasResponse,
        system_instruction=(
            "You are an impartial innovation-programme judge comparing alternative "
            "solution ideas on a consistent 1-5 scale."
        )
    )
    return RankIdeasResponse.model_validate_json(response.text)


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