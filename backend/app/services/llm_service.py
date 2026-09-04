import os
import json
from dotenv import load_dotenv

load_dotenv()

def generate_5whys_analysis(problem_statement: str) -> dict:
    """
    Day 1 Task: 5-Whys root-cause prompt scaffolding.
    Provides automatic fallback to structured mock data if an OpenAI key is missing or invalid.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    
    # Fallback mock for local development and testing without an active paid key
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
                    "question": "Why do users lack access to integrated tooling and real-time guidance?",
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
    {{"level": 1, "question": "Why is this happening?", "answer": "..."}},
    {{"level": 2, "question": "Why?", "answer": "..."}},
    {{"level": 3, "question": "Why?", "answer": "..."}},
    {{"level": 4, "question": "Why?", "answer": "..."}},
    {{"level": 5, "question": "Why?", "answer": "..."}}
  ],
  "root_cause": "..."
}}
"""

    response = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You are an expert design thinking coach. Always return valid, unformatted raw JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    raw_content = response.choices[0].message.content
    return json.loads(raw_content)