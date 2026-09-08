// frontend/src/utils/scoreProblem.js

const VAGUE_WORDS = ["something", "stuff", "things", "issue", "problem", "bad"];

export function scoreProblemStatement(text = "") {
  const trimmed = text.trim();
  if (!trimmed) return { score: 0, tips: ["Start by describing the problem."] };

  let score = 30;
  const tips = [];
  const lower = trimmed.toLowerCase();

  // 1. Length check
  if (trimmed.length > 30) score += 25;
  else tips.push("Add more detail about what is happening.");

  // 2. Vague word penalty
  const foundVague = VAGUE_WORDS.filter(w => lower.includes(w));
  if (foundVague.length > 0) {
    score = Math.max(10, score - 20);
    tips.push(`Replace vague words (${foundVague.join(", ")}) with specific details.`);
  }

  // 3. Concrete actor check (simple heuristic)
  const actorWords = ["user", "customer", "student", "client", "team", "person", "people"];
  const hasActor = actorWords.some(w => lower.includes(w));
  if (hasActor) {
    score += 25;
  } else {
    tips.push("Mention who is experiencing this problem (e.g., users, students).");
  }

  return {
    score: Math.min(100, score),
    tips: tips.length ? tips : ["Looks clear and specific!"]
  };
}

export function scoreWhyAnswers(whys = []) {
  if (!whys.length) return { score: 0, tips: ["Fill in your 5 Whys."] };

  let filledCount = 0;
  let score = 0;
  const tips = [];

  whys.forEach((why, idx) => {
    const trimmed = (why || "").trim();
    if (trimmed.length > 10) filledCount += 1;
    
    // Check if duplicate of previous
    if (idx > 0 && trimmed.toLowerCase() === (whys[idx - 1] || "").trim().toLowerCase() && trimmed) {
      tips.push(`Why #${idx + 1} repeats the previous answer. Dig deeper!`);
    }
  });

  score = Math.round((filledCount / 5) * 80);
  if (filledCount < 5) {
    tips.push(`Answer all 5 Whys to find the root cause (${filledCount}/5 completed).`);
  }

  return {
    score: Math.min(100, score + (tips.length === 0 ? 20 : 0)),
    tips: tips.length ? tips : ["Solid chain of causes!"]
  };
}

export function scoreHMW(hmwText = "") {
  const trimmed = hmwText.trim();
  if (!trimmed) return { score: 0, tips: ["Write your 'How Might We' question."] };

  let score = 20;
  const tips = [];
  const lower = trimmed.toLowerCase();

  // Check standard prefix
  if (lower.startsWith("how might we") || lower.startsWith("hmw")) {
    score += 30;
  } else {
    tips.push("Start with 'How might we...'");
  }

  // Check for constraints or contrast words
  const constraintWords = ["without", "despite", "while", "even if", "although"];
  if (constraintWords.some(w => lower.includes(w))) {
    score += 30;
  } else {
    tips.push("Include a constraint or tension (e.g., '...without increasing cost').");
  }

  // Penalize yes/no questions
  if (lower.startsWith("can we") || lower.startsWith("should we") || lower.startsWith("is it")) {
    score = Math.max(10, score - 30);
    tips.push("Avoid closed yes/no questions like 'Can we...'");
  }

  return {
    score: Math.min(100, score + 20),
    tips: tips.length ? tips : ["Great actionable framing!"]
  };
}