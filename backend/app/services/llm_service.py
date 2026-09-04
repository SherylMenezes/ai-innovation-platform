import os
import json
from dotenv import load_dotenv

load_dotenv()

def generate_5whys_analysis(problem_statement: str) -> dict:
    """
    Task 1 & 2: 5-Whys root-cause prompt scaffolding.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    if not api_key.startswith("sk-"):
        return {
            "whys": [
                {
                    "level": 1,
                    "question": f"Why is this happening: '{problem_statement}'?",
                    "answer": "Users lack access to integrated tooling and real-time guidance."
                },
                {
                    "level": 2,
                    "question": "Why do users lack access to guidance?",
                    "answer": "Current workflows rely on disconnected resources and ad-hoc practices."
                },
                {
                    "level": 3,
                    "question": "Why do workflows rely on disconnected resources?",
                    "answer": "There is no centralized platform bridging structured frameworks with active tasks."
                },
                {
                    "level": 4,
                    "question": "Why is there no centralized platform?",
                    "answer": "Solutions rarely combine gamified learning paths with industry-standard frameworks."
                },
                {
                    "level": 5,
                    "question": "Why are those combined solutions missing?",
                    "answer": "Platform architectures typically isolate educational curriculum from live project iteration."
                }
            ],
            "root_cause": "Absence of a unified, guided platform directly bridging user intent with structured execution frameworks."
        }

    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")

    prompt = f"""
Analyze the following user-submitted problem statement using the '5-Whys' root cause analysis technique.

Problem Statement:
"{problem_statement}"

Requirements:
1. Drill down sequentially through exactly 5 levels of "Why?".
2. Provide a crisp, synthesized Root Cause summary statement.
3. Return the response strictly as valid JSON matching this structure:
{{
  "whys": [
    {{"level": 1, "question": "...", "answer": "..."}},
    {{"level": 2, "question": "...", "answer": "..."}},
    {{"level": 3, "question": "...", "answer": "..."}},
    {{"level": 4, "question": "...", "answer": "..."}},
    {{"level": 5, "question": "...", "answer": "..."}}
  ],
  "root_cause": "..."
}}
"""

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are an expert design thinking coach. Return valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    return json.loads(response.choices[0].message.content)


def generate_hmw_statements(problem_statement: str, root_cause: str) -> dict:
    """
    Task 3: Prompt-tuned generation of 'How Might We' (HMW) statements.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")

    if not api_key.startswith("sk-"):
        return {
            "root_cause": root_cause,
            "hmw_statements": [
                {
                    "id": "hmw-1",
                    "focus_area": "Ecosystem & Mentorship",
                    "statement": "How might we connect students directly with industry mentors through real-world problem sets?"
                },
                {
                    "id": "hmw-2",
                    "focus_area": "Curriculum Alignment",
                    "statement": "How might we embed active industry project challenges directly into university course credit?"
                },
                {
                    "id": "hmw-3",
                    "focus_area": "Gamification & Motivation",
                    "statement": "How might we gamify project milestones to encourage consistent team execution?"
                },
                {
                    "id": "hmw-4",
                    "focus_area": "Career & Proof-of-Work",
                    "statement": "How might we turn student project deliverables into verified competency profiles for recruiters?"
                }
            ]
        }

    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")

    prompt = f"""
Given the initial problem and its synthesized root cause, generate 4 distinct, high-impact 'How Might We' (HMW) statements.

Problem Statement:
"{problem_statement}"

Root Cause:
"{root_cause}"

Return strictly valid JSON matching this schema:
{{
  "root_cause": "{root_cause}",
  "hmw_statements": [
    {{
      "id": "hmw-1",
      "focus_area": "Category Name",
      "statement": "How might we...?"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are an expert design thinking coach. Return raw JSON only."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.75,
    )
    return json.loads(response.choices[0].message.content)