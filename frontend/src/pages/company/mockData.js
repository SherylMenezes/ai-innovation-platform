// mockData.js - Complete dataset for Company Panel and all sub-views

export const mockCompany = {
  id: 1,
  name: "Acme Innovations Corp",
  type: "incubator",
  logo_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Acme",
  invite_code: "ACME-CORP-2026",
  is_verified: true,
  settings: { reminder_days: 7, tier: "enterprise" }
};

export const mockStats = {
  totalEmployees: 268,
  activeAssignments: 8,
  completionRate: 67.4,
  avgAiScore: 74.2
};

export const mockDepartments = [
  {
    id: 101,
    name: "Engineering & R&D",
    kind: "department",
    academic_tier: "Senior",
    invite_code: "ENG-DEV-2026",
    completion: 82,
    avgAiScore: 84,
    avgXp: 1450,
    statusTag: "Top"
  },
  {
    id: 102,
    name: "Product Design & UX",
    kind: "department",
    academic_tier: "Mid-Level",
    invite_code: "PDX-DES-2026",
    completion: 76,
    avgAiScore: 78,
    avgXp: 1280,
    statusTag: null
  },
  {
    id: 103,
    name: "Growth & Marketing",
    kind: "department",
    academic_tier: "Associate",
    invite_code: "MKT-GRO-2026",
    completion: 58,
    avgAiScore: 68,
    avgXp: 980,
    statusTag: null
  },
  {
    id: 104,
    name: "Customer Operations",
    kind: "department",
    academic_tier: "Junior / Intern",
    invite_code: "OPS-SUP-2026",
    completion: 44,
    avgAiScore: 59,
    avgXp: 740,
    statusTag: "Needs help"
  }
];

export const mockGroupsData = mockDepartments;

export const mockEmployeesData = [
  { 
    id: "usr_101", 
    name: "Devansh Mehta", 
    email: "devansh@acme.com", 
    department: "Engineering & R&D", 
    academic_tier: "Senior", 
    is_active: true, 
    last_active_at: "10 mins ago", 
    enrolled_count: 5, 
    completed_count: 4, 
    avg_overall_score: 92, 
    total_xp: 2450, 
    badge_count: 6 
  },
  { 
    id: "usr_102", 
    name: "Sarah Al-Mansoor", 
    email: "sarah.m@acme.com", 
    department: "Product Design & UX", 
    academic_tier: "Senior", 
    is_active: true, 
    last_active_at: "2 hours ago", 
    enrolled_count: 4, 
    completed_count: 3, 
    avg_overall_score: 89, 
    total_xp: 2190, 
    badge_count: 5 
  },
  { 
    id: "usr_103", 
    name: "Ananya Sharma", 
    email: "ananya@acme.com", 
    department: "Engineering & R&D", 
    academic_tier: "Mid-Level", 
    is_active: true, 
    last_active_at: "Yesterday", 
    enrolled_count: 4, 
    completed_count: 3, 
    avg_overall_score: 86, 
    total_xp: 1980, 
    badge_count: 4 
  },
  { 
    id: "usr_104", 
    name: "Marcus Vance", 
    email: "marcus@acme.com", 
    department: "Product Design & UX", 
    academic_tier: "Mid-Level", 
    is_active: true, 
    last_active_at: "3 days ago", 
    enrolled_count: 3, 
    completed_count: 2, 
    avg_overall_score: 83, 
    total_xp: 1840, 
    badge_count: 3 
  },
  { 
    id: "usr_105", 
    name: "Rohan Kulkarni", 
    email: "rohan@acme.com", 
    department: "Engineering & R&D", 
    academic_tier: "Associate", 
    is_active: true, 
    last_active_at: "4 hours ago", 
    enrolled_count: 4, 
    completed_count: 2, 
    avg_overall_score: 82, 
    total_xp: 1790, 
    badge_count: 3 
  },
  { 
    id: "usr_106", 
    name: "Priya Nair", 
    email: "priya@acme.com", 
    department: "Customer Operations", 
    academic_tier: "Junior / Intern", 
    is_active: false, 
    last_active_at: "8 days ago", 
    enrolled_count: 3, 
    completed_count: 0, 
    avg_overall_score: 52, 
    total_xp: 410, 
    badge_count: 1 
  },
  { 
    id: "usr_107", 
    name: "David Kim", 
    email: "david.k@acme.com", 
    department: "Customer Operations", 
    academic_tier: "Junior / Intern", 
    is_active: false, 
    last_active_at: "11 days ago", 
    enrolled_count: 2, 
    completed_count: 0, 
    avg_overall_score: null, 
    total_xp: 250, 
    badge_count: 0 
  }
];

export const mockTeamsData = [
  { id: 201, name: "Alpha Squad (AI/ML)", department: "Engineering & R&D", leader: "Devansh Mehta", membersCount: 14, status: "active", challengeName: "Autonomous Agents in Supply Chain" },
  { id: 202, name: "Core Infrastructure", department: "Engineering & R&D", leader: "Ananya Sharma", membersCount: 18, status: "active", challengeName: "Serverless Edge Caching" },
  { id: 203, name: "Design System Squad", department: "Product Design & UX", leader: "Sarah Al-Mansoor", membersCount: 10, status: "active", challengeName: "Multi-Modal Generative UI" },
  { id: 204, name: "User Research Lab", department: "Product Design & UX", leader: "Marcus Vance", membersCount: 8, status: "active", challengeName: "Voice Persona Usability" },
  { id: 205, name: "Performance & Ops", department: "Growth & Marketing", leader: "Liam Chen", membersCount: 12, status: "active", challengeName: "Automated Campaign Routing" },
  { id: 206, name: "Customer Escalations", department: "Customer Operations", leader: "Elena Rostov", membersCount: 15, status: "active", challengeName: "Zero-Shot Support Triage" }
];

export const mockChallengesData = [
  { id: 1, title: "Autonomous Agents in Supply Chain", challenge_type: "company", visibility: "institution", submissions_count: 12, avg_score: 88, created_at: "Nov 1, 2026", description: "Design an LLM agent workflow with tool calling to auto-reconcile freight discrepancies." },
  { id: 2, title: "Zero-Shot Support Triage Engine", challenge_type: "company", visibility: "institution", submissions_count: 8, avg_score: 79, created_at: "Oct 25, 2026", description: "Route customer escalation tickets using Gemini Flash with dynamic sentiment classification." },
  { id: 3, title: "Multi-Modal Generative UI Components", challenge_type: "industry", visibility: "institution", submissions_count: 15, avg_score: 84, created_at: "Oct 18, 2026", description: "Build adaptive component renderers based on user cognitive preferences." },
  { id: 4, title: "48-Hour Green Innovation Hackathon", challenge_type: "micro", visibility: "public", submissions_count: 24, avg_score: 72, created_at: "Nov 5, 2026", description: "Rapid prototyping sprint for carbon footprint auditing APIs." }
];

export const mockAssignmentsData = [
  { id: 501, challengeTitle: "Autonomous Agents in Supply Chain", target_type: "department", target_name: "Engineering & R&D", due_at: "2026-11-20", note: "Stage 3 SCAMPER ideation required before evaluation.", status: "active", enrolled_count: 32, completed_count: 26 },
  { id: 502, challengeTitle: "Zero-Shot Support Triage Engine", target_type: "department", target_name: "Customer Operations", due_at: "2026-11-14", note: "Priority sprint for onboarding interns.", status: "active", enrolled_count: 37, completed_count: 14 },
  { id: 503, challengeTitle: "Multi-Modal Generative UI Components", target_type: "team", target_name: "Design System Squad", due_at: "2026-11-30", note: "Complete with high-fidelity React prototype.", status: "active", enrolled_count: 10, completed_count: 7 }
];

export const mockAiLogsData = [
  { id: 9812, userName: "Devansh Mehta", feature: "scamper", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "10 mins ago" },
  { id: 9811, userName: "Sarah Al-Mansoor", feature: "evaluation", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "18 mins ago" },
  { id: 9810, userName: "Marcus Vance", feature: "five_whys", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "35 mins ago" },
  { id: 9809, userName: "Ananya Sharma", feature: "mentor", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "1 hour ago" },
  { id: 9808, userName: "Rohan Kulkarni", feature: "swot", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "2 hours ago" },
  { id: 9807, userName: "David Kim", feature: "mentor", model: "gemini-2.5-flash-lite", succeeded: false, created_at: "Yesterday" }
];

export const mockAwardsData = [
  { id: 701, title: "Q3 Breakthrough Innovation Champion", award_type: "innovation_award", recipientName: "Alpha Squad (AI/ML)", certificate_code: "CERT-INNOV-8491", issued_at: "Oct 15, 2026" },
  { id: 702, title: "Excellence in Human-Centric AI", award_type: "top_student", recipientName: "Sarah Al-Mansoor", certificate_code: "CERT-TOP-9210", issued_at: "Oct 28, 2026" },
  { id: 703, title: "Prompt Engineering & Evaluation Mastery", award_type: "certificate", recipientName: "Devansh Mehta", certificate_code: "CERT-MAST-3382", issued_at: "Nov 2, 2026" }
];

export const mockFunnelStages = [
  { stage: "Started", count: 268, percentage: 100, drop: 0 },
  { stage: "Problem Canvas", count: 242, percentage: 90.2, drop: 9.8 },
  { stage: "Ideation (SCAMPER)", count: 184, percentage: 68.6, drop: 21.6, isBiggestDrop: true },
  { stage: "AI Evaluation", count: 172, percentage: 64.1, drop: 4.5 },
  { stage: "Submitted", count: 161, percentage: 60.1, drop: 4.0 }
];

export const mockNeedsAttention = [
  { id: 1, priority: "high", title: "14 Onboarding Interns Inactive 7+ Days", description: "Customer Operations Cohort has not submitted Step 2 milestones.", actionLabel: "Send Reminder" },
  { id: 2, priority: "medium", title: "2 Challenges Expiring in 48 Hours", description: "Q4 Green Innovation Challenge due on Friday 11:59 PM.", actionLabel: "Extend Due Date" },
  { id: 3, priority: "info", title: "Bulk CSV Upload Completed with 3 Errors", description: "File 'incubator_intake_nov.csv' had duplicate invite emails.", actionLabel: "View Import Log" }
];

export const mockTopPerformers = [
  { id: "usr_101", name: "Devansh Mehta", team: "Alpha Squad (AI/ML)", xp: 2450, avgScore: 92 },
  { id: "usr_102", name: "Sarah Al-Mansoor", team: "Design System Squad", xp: 2190, avgScore: 89 },
  { id: "usr_103", name: "Ananya Sharma", team: "Core Infrastructure", xp: 1980, avgScore: 86 },
  { id: "usr_104", name: "Marcus Vance", team: "User Research Lab", xp: 1840, avgScore: 83 },
  { id: "usr_105", name: "Rohan Kulkarni", team: "Alpha Squad (AI/ML)", xp: 1790, avgScore: 82 }
];