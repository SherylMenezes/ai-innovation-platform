import json
import asyncio
from typing import List, AsyncGenerator
from app.schemas.ai import (
    ProblemRefineResponse,
    HMWGenerateResponse,
    HMWCard,
    ProblemScoreResponse,
    ScoringDimension,
    ScamperPromptResponse,
    ScamperSuggestion,
    MindMapNode,
    MindMapResponse,
    MindMapRequest,
    IdeaItem,
    EvaluatedIdea,
    IdeaEvaluationResponse,
    GeneratedIdea,
    GenerateIdeasResponse,
    RemixIdeasResponse,
    IdeaScoreResponse,
    IdeaScoreBreakdown,
    RiskItem,
    RiskAnalysisResponse,
    SWOTAnalysisResponse,
    MentorCoachResponse,
)

async def refine_problem_statement(problem_statement: str) -> ProblemRefineResponse:
    return ProblemRefineResponse(
        synthesized_root_cause="Absence of a unified, guided platform directly bridging user intent with structured execution frameworks.",
        five_whys=[
            "W1: Users lack access to integrated tooling and real-time guidance.",
            "W2: Current workflows rely on disconnected resources and ad-hoc practices.",
            "W3: There is no centralized platform bridging structured frameworks with active tasks.",
            "W4: Project execution stalls without structured iterative milestones.",
            "W5: Students cannot easily map academic projects to real-world industrial needs."
        ]
    )

async def generate_hmw_statements(root_cause: str) -> HMWGenerateResponse:
    cards = [
        HMWCard(
            id="hmw-1",
            category="Ecosystem & Mentorship",
            statement="How might we connect students directly with industry mentors through real-world problem sets?"
        ),
        HMWCard(
            id="hmw-2",
            category="Curriculum Alignment",
            statement="How might we embed active industry project challenges directly into university course credit?"
        ),
        HMWCard(
            id="hmw-3",
            category="Gamification & Motivation",
            statement="How might we gamify project milestones to encourage consistent team execution?"
        ),
        HMWCard(
            id="hmw-4",
            category="Career & Proof-of-Work",
            statement="How might we turn student project deliverables into verified competency profiles for recruiters?"
        )
    ]
    return HMWGenerateResponse(cards=cards)

async def score_problem_statement(problem_statement: str) -> ProblemScoreResponse:
    words = problem_statement.strip().split()
    word_count = len(words)

    clarity_score = min(100, max(45, word_count * 5))
    has_cause = any(k in problem_statement.lower() for k in ["because", "struggle", "lack", "unable", "due to", "fail"])
    specificity_score = 85 if has_cause else 55
    actionability_score = 80 if word_count >= 8 else 45

    overall = int((clarity_score + specificity_score + actionability_score) / 3)
    grade = "Excellent" if overall >= 80 else ("Good" if overall >= 65 else "Needs Refinement")

    return ProblemScoreResponse(
        overall_score=overall,
        grade=grade,
        dimensions=[
            ScoringDimension(name="Clarity", score=clarity_score, feedback="Clarity of core user struggle."),
            ScoringDimension(name="Specificity", score=specificity_score, feedback="Identifies concrete pain points."),
            ScoringDimension(name="Actionability", score=actionability_score, feedback="Actionable for design-thinking steps.")
        ],
        strengths=["Clear persona context", "Identifiable problem domain"],
        improvements=["Include quantifiable metrics or operational constraints"]
    )

SCAMPER_PROMPTS = {
    "Substitute": "What components, manual procedures, or traditional learning materials can be substituted with automated or modern equivalents?",
    "Combine": "How can we merge this problem solving process with external tools, gamified mechanics, or team collaborations?",
    "Adapt": "What proven solutions from other industries (like open-source development or gaming) can we adapt here?",
    "Modify": "What features can be magnified, minimized, or made dynamic to speed up student progress?",
    "Put to another use": "How could this workspace or its outputs be repurposed for recruiter verification or peer mentoring?",
    "Eliminate": "What administrative friction, unnecessary steps, or paperwork can be completely eliminated?",
    "Reverse": "What happens if we reverse the flow—having companies pitch challenges directly to students rather than students applying?"
}

async def generate_scamper_prompts(hmw_statement: str) -> ScamperPromptResponse:
    seeds = [
        ScamperSuggestion(
            technique="Substitute",
            prompt_question=SCAMPER_PROMPTS["Substitute"],
            idea_seed="Replace static problem PDFs with interactive challenge canvases linked to live GitHub templates."
        ),
        ScamperSuggestion(
            technique="Combine",
            prompt_question=SCAMPER_PROMPTS["Combine"],
            idea_seed="Combine automated peer code reviews with real-time mentor office hours."
        ),
        ScamperSuggestion(
            technique="Adapt",
            prompt_question=SCAMPER_PROMPTS["Adapt"],
            idea_seed="Adapt RPG quest progression loops to represent project development milestones."
        ),
        ScamperSuggestion(
            technique="Modify",
            prompt_question=SCAMPER_PROMPTS["Modify"],
            idea_seed="Convert semester-long final projects into weekly verifiable micro-sprints."
        ),
        ScamperSuggestion(
            technique="Put to another use",
            prompt_question=SCAMPER_PROMPTS["Put to another use"],
            idea_seed="Repurpose finished milestone artifacts directly as interactive portfolio proof-of-work cards."
        ),
        ScamperSuggestion(
            technique="Eliminate",
            prompt_question=SCAMPER_PROMPTS["Eliminate"],
            idea_seed="Eliminate generic resume screening by letting project test-suite pass rates prove competence."
        ),
        ScamperSuggestion(
            technique="Reverse",
            prompt_question=SCAMPER_PROMPTS["Reverse"],
            idea_seed="Flip the discovery flow: let verified student project squads receive bounty invitations from startups."
        )
    ]
    return ScamperPromptResponse(hmw_statement=hmw_statement, suggestions=seeds)

async def generate_mind_map_nodes(concept: str) -> MindMapResponse:
    nodes = [
        MindMapNode(id="root", label=concept[:40] + "...", parent_id=None, category="core"),
        MindMapNode(id="branch-1", label="Curriculum Integration", parent_id="root", category="education"),
        MindMapNode(id="sub-1-1", label="Capstone Project Matching", parent_id="branch-1", category="education"),
        MindMapNode(id="sub-1-2", label="Course Credit Accreditation", parent_id="branch-1", category="education"),
        MindMapNode(id="branch-2", label="Industry Mentorship", parent_id="root", category="industry"),
        MindMapNode(id="sub-2-1", label="Weekly Tech Office Hours", parent_id="branch-2", category="industry"),
        MindMapNode(id="sub-2-2", label="Code Review Bounty Program", parent_id="branch-2", category="industry"),
        MindMapNode(id="branch-3", label="Proof of Competency", parent_id="root", category="career"),
        MindMapNode(id="sub-3-1", label="Automated Test-Suite Badging", parent_id="branch-3", category="career"),
        MindMapNode(id="sub-3-2", label="Live Project Portfolio Cards", parent_id="branch-3", category="career"),
    ]
    return MindMapResponse(root_concept=concept, nodes=nodes)

async def evaluate_ideation_list(ideas: list) -> IdeaEvaluationResponse:
    results = []
    for item in ideas:
        feasibility = 8 if any(k in item.title.lower() for k in ["canvas", "card", "tree"]) else 6
        impact = 9 if any(k in item.title.lower() for k in ["industry", "recruiter", "bounty"]) else 7

        quadrant = "Quick Win" if feasibility >= 7 and impact >= 7 else "Major Project"
        if feasibility < 7 and impact < 7:
            quadrant = "Fill-in"

        results.append(
            EvaluatedIdea(
                id=item.id,
                title=item.title,
                feasibility_score=feasibility,
                impact_score=impact,
                quadrant=quadrant,
                rationale=f"Evaluated against practical implementation complexity ({feasibility}/10) and user value ({impact}/10)."
            )
        )
    return IdeaEvaluationResponse(evaluated_ideas=results)

async def generate_divergent_ideas(context: str, count: int = 5) -> GenerateIdeasResponse:
    base_ideas = [
        GeneratedIdea(id="idea-d1", title="AI Project Matching Canvas", description="Matches student profiles with live company problem backlogs.", category="Platform"),
        GeneratedIdea(id="idea-d2", title="Automated Peer Review Sprints", description="Micro-milestones evaluated by automated test runners and peers.", category="Workflow"),
        GeneratedIdea(id="idea-d3", title="Proof-of-Work Credentialing", description="Converts passing unit tests into verified portfolio tokens.", category="Verification"),
        GeneratedIdea(id="idea-d4", title="Industry Mentor Office-Hours Bounty", description="Engineers earn open-source credits for hosting weekly office hours.", category="Mentorship"),
        GeneratedIdea(id="idea-d5", title="Gamified Project Skill Trees", description="Visual branch progression mapping code commits to resume skills.", category="Gamification"),
    ]

    seen_titles = set()
    deduped = []
    for idea in base_ideas[:count]:
        if idea.title.lower() not in seen_titles:
            seen_titles.add(idea.title.lower())
            deduped.append(idea)

    return GenerateIdeasResponse(ideas=deduped)

async def remix_ideas(descriptions: list) -> RemixIdeasResponse:
    combined_title = "Gamified Project Sprints with Verified Skill Badges"
    combined_concept = f"A blended approach combining: '{descriptions[0]}' and '{descriptions[1]}' into an integrated execution loop."
    return RemixIdeasResponse(
        remixed_title=combined_title,
        remixed_concept=combined_concept,
        combined_elements=[descriptions[0][:40], descriptions[1][:40]]
    )

# --- Week 3 Implementations ---

async def calculate_idea_score(title: str, description: str) -> IdeaScoreResponse:
    text = f"{title} {description}".lower()

    feasibility = 8 if any(k in text for k in ["api", "template", "workflow", "canvas", "dashboard"]) else 6
    if "hardware" in text or "blockchain" in text:
        feasibility = 4

    impact = 9 if any(k in text for k in ["recruiter", "mentor", "industry", "career", "grade", "portfolio"]) else 7
    complexity = 4 if ("simple" in text or "template" in text) else (8 if any(k in text for k in ["ai", "ml", "real-time", "distributed"]) else 6)

    if feasibility >= 7 and impact >= 7:
        quadrant = "Quick Win"
    elif feasibility < 7 and impact >= 7:
        quadrant = "Major Project"
    elif feasibility >= 7 and impact < 7:
        quadrant = "Fill-in"
    else:
        quadrant = "Thankless Task"

    return IdeaScoreResponse(
        title=title,
        feasibility=feasibility,
        impact=impact,
        complexity=complexity,
        quadrant=quadrant,
        breakdown=IdeaScoreBreakdown(
            feasibility_notes=f"Estimated technical feasibility: {feasibility}/10 based on standard architecture requirements.",
            impact_notes=f"Anticipated value delivery: {impact}/10 for targeted student/industry stakeholders.",
            complexity_notes=f"Execution complexity: {complexity}/10 considering implementation surface area."
        )
    )

async def analyze_idea_risks(title: str, description: str = "") -> RiskAnalysisResponse:
    combined = f"{title} {description}".lower()

    risks = [
        RiskItem(
            category="Technical",
            severity="Medium" if ("ai" in combined or "ml" in combined) else "Low",
            description="Latency and model variance when handling real-time unstructured inputs.",
            mitigation="Implement deterministic heuristic fallbacks and local cache layers."
        ),
        RiskItem(
            category="Adoption",
            severity="High" if ("mentor" in combined or "recruiter" in combined) else "Medium",
            description="Friction in engaging external professional participants consistently.",
            mitigation="Incentivize participation using asynchronous review queues and gamified points."
        ),
        RiskItem(
            category="Execution",
            severity="Medium",
            description="Complex scope across multi-disciplinary user roles delaying initial MVP test.",
            mitigation="Focus current release slice strictly on the core automated evaluation loops."
        )
    ]

    has_high = any(r.severity == "High" for r in risks)
    overall_level = "Elevated" if has_high else "Moderate"

    return RiskAnalysisResponse(
        idea_title=title,
        overall_risk_level=overall_level,
        risks=risks
    )

async def generate_swot_analysis(title: str, description: str) -> SWOTAnalysisResponse:
    text = f"{title} {description}".lower()

    strengths = [
        "Strong direct alignment with user pain points in student-industry coordination.",
        "Modular microservice structure allowing independent evaluation and scoring."
    ]
    weaknesses = [
        "Initial dependency on consistent input quality for high-accuracy scoring.",
        "Requires active participant engagement to fully realize network effects."
    ]
    opportunities = [
        "Integration into accredited university curriculum capstone programs.",
        "Monetizable candidate discovery funnel for engineering recruiting partners."
    ]
    threats = [
        "Generic LLM wrapper saturation in the edtech productivity market.",
        "Mentor time constraints causing latency in collaborative feedback loops."
    ]

    recommendation = (
        "Focus first on standardizing the automated rubric scoring before expanding to multi-party mentor syncs."
        if "mentor" in text else
        "Ship the core scoring matrix as a self-serve student workspace widget to drive immediate adoption."
    )

    return SWOTAnalysisResponse(
        title=title,
        strengths=strengths,
        weaknesses=weaknesses,
        opportunities=opportunities,
        threats=threats,
        strategic_recommendation=recommendation
    )

async def run_mentor_coach(workspace_context: str, user_query: str, stage: str) -> MentorCoachResponse:
    q_lower = user_query.lower()

    if "how do i" in q_lower or "how to" in q_lower:
        coach_response = (
            f"You're currently exploring solutions in the '{stage}' stage. "
            f"Rather than jumping straight to implementation, let's dissect the operational bottleneck in: '{workspace_context[:60]}...'."
        )
        questions = [
            "What is the single highest-risk assumption in your current architecture?",
            "How could we validate this concept with mock data before writing full persistence models?",
            "What telemetry will prove that users are succeeding with this flow?"
        ]
        action = "Define a minimal acceptance criteria checklist for this feature."
    else:
        coach_response = (
            f"In the context of '{workspace_context[:50]}...', your thought highlights an important design trade-off. "
            "A solid engineering solution balances feasibility with immediate user utility."
        )
        questions = [
            "Does this feature belong in the 'Quick Win' quadrant or is it an ambitious 'Major Project'?",
            "What can be eliminated from this specification without reducing value?"
        ]
        action = "Run this concept through the /api/ai/score-idea endpoint to evaluate its quadrant."

    return MentorCoachResponse(
        coach_response=coach_response,
        socratic_questions=questions,
        recommended_action=action
    )

# --- Week 4 Day 1 Implementation ---

async def stream_socratic_mentor(workspace_context: str, user_query: str, current_stage: str) -> AsyncGenerator[str, None]:
    """Week 4 Day 1: Streaming Socratic Mentor Coach."""
    intro = f"[AI Mentor | Stage: {current_stage}]\n\n"
    for chunk in intro.split(" "):
        yield f"{chunk} "
        await asyncio.sleep(0.04)

    q_lower = user_query.lower()
    if any(k in q_lower for k in ["give me", "write it for me", "tell me the answer", "code it"]):
        dialogue = (
            "As your engineering coach, I won't write the direct solution for you. "
            f"Let's break down your challenge in the {current_stage} stage instead:\n\n"
            f"1. What is the fundamental operational constraint in: '{workspace_context[:60]}...'?\n"
            "2. If you had to build a trivial manual prototype first, what single capability must work?\n"
            "3. What trade-offs exist between building this yourself versus leveraging existing libraries?"
        )
    else:
        dialogue = (
            f"That's a relevant design query for the {current_stage} milestone. "
            f"Looking at your active work ('{workspace_context[:50]}...'), consider these hints:\n\n"
            "• Hint 1: Focus on your core data flow before adding edge-case handling.\n"
            "• Hint 2: Check whether this belongs in the 'Quick Win' quadrant or requires high infrastructure overhead.\n"
            "• Prompt: How will your target users immediately notice if this step succeeds or fails?"
        )

    for word in dialogue.split(" "):
        yield f"{word} "
        await asyncio.sleep(0.04)