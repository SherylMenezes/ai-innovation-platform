// frontend/src/pages/company/mockData.js
// Complete dataset matching 001_institution_panel.sql and Company BRD / Backlog

// ==========================================
// 1. COMPANY PROFILE & DASHBOARD METRICS
// ==========================================
export const mockCompany = {
  id: 1,
  name: "Acme Innovations Corp",
  industry: "DeepTech / Enterprise AI",
  type: "incubator", // school, college, university, incubator
  logo_url: "https://api.dicebear.com/7.x/identicon/svg?seed=Acme",
  invite_code: "ACME-CORP-2026",
  is_verified: true,
  settings: { reminder_days: 7, tier: "enterprise" }
};

export const mockDashboardMetrics = {
  totalChallenges: 8,
  activeChallenges: 4,
  totalSubmissions: 312,
  shortlistedCount: 42,
  activeParticipants: 486,
  partnerInstitutions: 14,
  avgAiQualityScore: 78.4,
  awardsIssued: 12
};

// Also exported as mockStats for backward compatibility
export const mockStats = {
  totalEmployees: 486,
  activeAssignments: 8,
  completionRate: 67.4,
  avgAiScore: 78.4
};

// ==========================================
// 2. GROUPS & DEPARTMENTS (groups table)
// ==========================================
export const mockDepartments = [
  {
    id: 101,
    name: "Engineering & R&D",
    kind: "department",
    academic_tier: "Senior Level",
    invite_code: "ENG-CORP-2026",
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
    invite_code: "PDX-CORP-2026",
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
    invite_code: "MKT-CORP-2026",
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
    invite_code: "OPS-CORP-2026",
    completion: 44,
    avgAiScore: 59,
    avgXp: 740,
    statusTag: "Needs help"
  }
];

// Alias for Groups tab compatibility
export const mockGroupsData = mockDepartments;

// ==========================================
// 3. PROJECT TEAMS, SQUADS & MEMBERS 
// (teams, team_members, mentor_assignments)
// ==========================================
export const mockTeamsData = [
  {
    id: 201,
    name: "Alpha Squad (AI/ML)",
    group_id: 101,
    department: "Engineering & R&D",
    leader: "Devansh Mehta",
    membersCount: 4,
    status: "active",
    challengeId: 101,
    challengeName: "Autonomous Agents in Cold-Chain Logistics",
    mentor: "Dr. Kimberly Reed",
    mentorRole: "Principal AI Scientist",
    members: [
      { id: "m_1", name: "Devansh Mehta", role: "leader", title: "AI Pipeline Lead", joined: "Oct 12, 2026" },
      { id: "m_2", name: "Farah Shaikh", role: "member", title: "Edge & IoT Specialist", joined: "Oct 14, 2026" },
      { id: "m_3", name: "Riya Shetgaonkar", role: "member", title: "Backend Systems", joined: "Oct 14, 2026" },
      { id: "m_4", name: "Shanallie Silva", role: "member", title: "Hardware Integration", joined: "Oct 15, 2026" }
    ]
  },
  {
    id: 202,
    name: "Core Infrastructure",
    group_id: 101,
    department: "Engineering & R&D",
    leader: "Ananya Sharma",
    membersCount: 3,
    status: "active",
    challengeId: 102,
    challengeName: "Zero-Shot Escalation Triage Engine",
    mentor: "Arjun Nair",
    mentorRole: "Staff Cloud Engineer",
    members: [
      { id: "m_5", name: "Ananya Sharma", role: "leader", title: "Distributed Systems", joined: "Oct 15, 2026" },
      { id: "m_6", name: "Aditya Verma", role: "member", title: "API Contracts & Routing", joined: "Oct 18, 2026" },
      { id: "m_7", name: "Panshobh Karekar", role: "member", title: "Redis Cache & Queues", joined: "Oct 18, 2026" }
    ]
  },
  {
    id: 203,
    name: "Design System Squad",
    group_id: 102,
    department: "Product Design & UX",
    leader: "Sarah Al-Mansoor",
    membersCount: 3,
    status: "active",
    challengeId: 103,
    challengeName: "Generative Multimodal UI Component Studio",
    mentor: "Elena Rostova",
    mentorRole: "Head of Design Systems",
    members: [
      { id: "m_8", name: "Sarah Al-Mansoor", role: "leader", title: "Design Technologist", joined: "Oct 16, 2026" },
      { id: "m_9", name: "Swayam Dessai", role: "member", title: "Interaction Architect", joined: "Oct 19, 2026" },
      { id: "m_10", name: "Mira Kapoor", role: "member", title: "Design Tokens & WCAG", joined: "Oct 20, 2026" }
    ]
  },
  {
    id: 204,
    name: "User Research Lab",
    group_id: 102,
    department: "Product Design & UX",
    leader: "Marcus Vance",
    membersCount: 2,
    status: "active",
    challengeId: 103,
    challengeName: "Generative Multimodal UI Component Studio",
    mentor: "Elena Rostova",
    mentorRole: "Head of Design Systems",
    members: [
      { id: "m_11", name: "Marcus Vance", role: "leader", title: "Cognitive Ergonomics", joined: "Oct 20, 2026" },
      { id: "m_12", name: "Kavya Hegde", role: "member", title: "Behavioral Analytics", joined: "Oct 22, 2026" }
    ]
  },
  {
    id: 205,
    name: "Growth Ops Squad",
    group_id: 103,
    department: "Growth & Marketing",
    leader: "Liam Chen",
    membersCount: 2,
    status: "active",
    challengeId: 104,
    challengeName: "Carbon Offset Telemetry Protocol",
    mentor: "Siddharth Rao",
    mentorRole: "VP of Product Growth",
    members: [
      { id: "m_13", name: "Liam Chen", role: "leader", title: "Funnel Architect", joined: "Oct 25, 2026" },
      { id: "m_14", name: "Aarav Gupta", role: "member", title: "Attribution Modeling", joined: "Oct 26, 2026" }
    ]
  },
  {
    id: 206,
    name: "Customer Escalations Squad",
    group_id: 104,
    department: "Customer Operations",
    leader: "Elena Rostov",
    membersCount: 3,
    status: "active",
    challengeId: 102,
    challengeName: "Zero-Shot Escalation Triage Engine",
    mentor: "Arjun Nair",
    mentorRole: "Staff Cloud Engineer",
    members: [
      { id: "m_15", name: "Elena Rostov", role: "leader", title: "Ops Specialist", joined: "Oct 28, 2026" },
      { id: "m_16", name: "Priya Nair", role: "member", title: "Customer Triage", joined: "Oct 29, 2026" },
      { id: "m_17", name: "David Kim", role: "member", title: "Support Automation", joined: "Oct 29, 2026" }
    ]
  }
];

// ==========================================
// 4. ENTERPRISE CHALLENGES (challenges table)
// ==========================================
export const mockCompanyChallenges = [
  {
    id: 101,
    title: "Autonomous Agents in Cold-Chain Logistics",
    category: "AI & Supply Chain",
    industry: "Logistics",
    status: "active",
    visibility: "institution",
    challenge_type: "company",
    timeline_end: "Nov 30, 2026",
    days_left: 22,
    eligibility: "Graduate / Professional",
    rewards: "₹2,50,000 + R&D Internship",
    submissions_count: 84,
    avg_score: 82.5,
    created_at: "Nov 1, 2026",
    description: "Design multi-agent LLM systems with tool calling to reconcile real-time sensory temperature anomalies."
  },
  {
    id: 102,
    title: "Zero-Shot Escalation Triage Engine",
    category: "Natural Language Processing",
    industry: "Customer Ops",
    status: "active",
    visibility: "institution",
    challenge_type: "company",
    timeline_end: "Dec 15, 2026",
    days_left: 37,
    eligibility: "All Levels",
    rewards: "₹1,50,000 Grant",
    submissions_count: 112,
    avg_score: 76.8,
    created_at: "Oct 25, 2026",
    description: "Automate tier-3 enterprise ticket triage with deterministic sentiment and root-cause routing."
  },
  {
    id: 103,
    title: "Generative Multimodal UI Component Studio",
    category: "Design Thinking & UI/UX",
    industry: "SaaS",
    status: "review",
    visibility: "institution",
    challenge_type: "industry",
    timeline_end: "Nov 05, 2026",
    days_left: 0,
    eligibility: "Grade 11-12 & Graduate",
    rewards: "Sponsored Hardware + Fast-Track Interview",
    submissions_count: 67,
    avg_score: 84.1,
    created_at: "Oct 18, 2026",
    description: "Adaptive web component synthesizer converting voice and natural language intent into responsive React UI."
  },
  {
    id: 104,
    title: "Carbon Offset Telemetry Protocol",
    category: "Sustainability",
    industry: "CleanTech",
    status: "archived",
    visibility: "public",
    challenge_type: "micro",
    timeline_end: "Oct 15, 2026",
    days_left: 0,
    eligibility: "All Levels",
    rewards: "₹1,00,000",
    submissions_count: 49,
    avg_score: 71.0,
    created_at: "Oct 1, 2026",
    description: "Auditable blockchain tracking for supplier Scope-3 emissions reduction."
  }
];

// Alias for Challenges Page compatibility
export const mockChallengesData = mockCompanyChallenges;

// ==========================================
// 5. SUBMISSIONS & AI EVALUATIONS 
// (submissions & scorecards tables)
// ==========================================
export const mockSubmissions = [
  {
    id: "sub_301",
    challengeId: 101,
    challengeTitle: "Autonomous Agents in Cold-Chain Logistics",
    teamName: "Alpha Squad (AI/ML)",
    leaderName: "Devansh Mehta",
    institution: "PCCE Verna",
    academicTier: "Graduate",
    aiRank: 1,
    aiScore: 94,
    rubric: { innovation: 96, impact: 94, feasibility: 92, technical: 95 },
    status: "shortlisted", // 'submitted', 'shortlisted', 'reviewed'
    format: "PPT + Prototype Repo",
    submittedAt: "Nov 2, 2026",
    companyNote: "High feasibility. Deterministic fallback logic prevents sensor drift hallucinations."
  },
  {
    id: "sub_302",
    challengeId: 101,
    challengeTitle: "Autonomous Agents in Cold-Chain Logistics",
    teamName: "Neural Nexus",
    leaderName: "Sarah Al-Mansoor",
    institution: "IIT Bombay",
    academicTier: "Graduate",
    aiRank: 2,
    aiScore: 91,
    rubric: { innovation: 92, impact: 90, feasibility: 89, technical: 93 },
    status: "shortlisted",
    format: "Video + A3 Report",
    submittedAt: "Nov 3, 2026",
    companyNote: "Novel SCAMPER ideation path. Strong real-world IoT test cases."
  },
  {
    id: "sub_303",
    challengeId: 102,
    challengeTitle: "Zero-Shot Escalation Triage Engine",
    teamName: "Core Infrastructure",
    leaderName: "Ananya Sharma",
    institution: "PCCE Verna",
    academicTier: "Graduate",
    aiRank: 3,
    aiScore: 88,
    rubric: { innovation: 87, impact: 89, feasibility: 88, technical: 90 },
    status: "shortlisted",
    format: "Interactive Prototype",
    submittedAt: "Nov 4, 2026",
    companyNote: "Low latency routing pipeline with Redis queue backup."
  },
  {
    id: "sub_304",
    challengeId: 102,
    challengeTitle: "Zero-Shot Escalation Triage Engine",
    teamName: "Customer Escalations",
    leaderName: "Elena Rostov",
    institution: "Don Bosco College",
    academicTier: "Professional",
    aiRank: 4,
    aiScore: 79,
    rubric: { innovation: 78, impact: 81, feasibility: 80, technical: 77 },
    status: "submitted",
    format: "PPT Report",
    submittedAt: "Nov 6, 2026",
    companyNote: ""
  },
  {
    id: "sub_305",
    challengeId: 103,
    challengeTitle: "Generative Multimodal UI Component Studio",
    teamName: "Design System Squad",
    leaderName: "Marcus Vance",
    institution: "BITS Pilani (Goa)",
    academicTier: "Graduate",
    aiRank: 5,
    aiScore: 84,
    rubric: { innovation: 89, impact: 82, feasibility: 81, technical: 85 },
    status: "reviewed",
    format: "Interactive Prototype",
    submittedAt: "Oct 29, 2026",
    companyNote: "Clean accessibility integration and design tokens."
  }
];

// ==========================================
// 6. TALENT POOL & STUDENTS 
// (institution_student_stats view)
// ==========================================
export const mockTalentPool = [
  { id: "usr_101", name: "Devansh Mehta", institution: "PCCE Verna", tier: "Graduate", xp: 2850, badgesCount: 7, topDomain: "AI/ML & Edge", solutionsSubmitted: 5, avgAiScore: 92 },
  { id: "usr_102", name: "Sarah Al-Mansoor", institution: "IIT Bombay", tier: "Graduate", xp: 2620, badgesCount: 6, topDomain: "UI/UX & Robotics", solutionsSubmitted: 4, avgAiScore: 89 },
  { id: "usr_103", name: "Ananya Sharma", institution: "PCCE Verna", tier: "Grade 11-12", xp: 2190, badgesCount: 5, topDomain: "Generative Frontend", solutionsSubmitted: 4, avgAiScore: 88 },
  { id: "usr_104", name: "Rohan Kulkarni", institution: "BITS Pilani (Goa)", tier: "Graduate", xp: 1980, badgesCount: 4, topDomain: "Cloud & APIs", solutionsSubmitted: 3, avgAiScore: 84 },
  { id: "usr_105", name: "Marcus Vance", institution: "Don Bosco College", tier: "Professional", xp: 1850, badgesCount: 4, topDomain: "Enterprise Triage", solutionsSubmitted: 3, avgAiScore: 81 }
];

// Alias for Employees view
export const mockEmployeesData = [
  { id: "usr_101", name: "Devansh Mehta", email: "devansh@acme.example", department: "Engineering & R&D", academic_tier: "Graduate", is_active: true, last_active_at: "10 mins ago", enrolled_count: 5, completed_count: 4, avg_overall_score: 94, total_xp: 2850, badge_count: 7 },
  { id: "usr_102", name: "Sarah Al-Mansoor", email: "sarah.m@acme.example", department: "Product Design & UX", academic_tier: "Graduate", is_active: true, last_active_at: "2 hours ago", enrolled_count: 4, completed_count: 3, avg_overall_score: 91, total_xp: 2620, badge_count: 6 },
  { id: "usr_103", name: "Ananya Sharma", email: "ananya@acme.example", department: "Engineering & R&D", academic_tier: "Grade 11-12", is_active: true, last_active_at: "Yesterday", enrolled_count: 4, completed_count: 3, avg_overall_score: 88, total_xp: 2190, badge_count: 5 },
  { id: "usr_104", name: "Marcus Vance", email: "marcus@acme.example", department: "Product Design & UX", academic_tier: "Professional", is_active: true, last_active_at: "3 days ago", enrolled_count: 3, completed_count: 2, avg_overall_score: 84, total_xp: 1850, badge_count: 4 },
  { id: "usr_105", name: "Rohan Kulkarni", email: "rohan@acme.example", department: "Engineering & R&D", academic_tier: "Graduate", is_active: true, last_active_at: "4 hours ago", enrolled_count: 4, completed_count: 2, avg_overall_score: 82, total_xp: 1980, badge_count: 4 },
  { id: "usr_106", name: "Priya Nair", email: "priya@acme.example", department: "Customer Operations", academic_tier: "Junior / Intern", is_active: false, last_active_at: "8 days ago", enrolled_count: 3, completed_count: 0, avg_overall_score: 52, total_xp: 410, badge_count: 1 },
  { id: "usr_107", name: "David Kim", email: "david.k@acme.example", department: "Customer Operations", academic_tier: "Junior / Intern", is_active: false, last_active_at: "11 days ago", enrolled_count: 2, completed_count: 0, avg_overall_score: null, total_xp: 250, badge_count: 0 }
];

export const mockTopPerformers = [
  { id: "usr_101", name: "Devansh Mehta", team: "Alpha Squad (AI/ML)", xp: 2850, avgScore: 94 },
  { id: "usr_102", name: "Sarah Al-Mansoor", team: "Design System Squad", xp: 2620, avgScore: 91 },
  { id: "usr_103", name: "Ananya Sharma", team: "Core Infrastructure", xp: 2190, avgScore: 88 },
  { id: "usr_104", name: "Rohan Kulkarni", team: "Alpha Squad (AI/ML)", xp: 1980, avgScore: 84 },
  { id: "usr_105", name: "Marcus Vance", team: "User Research Lab", xp: 1850, avgScore: 81 }
];

// ==========================================
// 7. AWARDS & GRANTS (awards table)
// ==========================================
export const mockCompanyAwards = [
  {
    id: 801,
    title: "Breakthrough AI Innovation Award",
    awardType: "Grand Prize & Internship",
    challengeTitle: "Autonomous Agents in Cold-Chain Logistics",
    recipient: "Alpha Squad (Devansh Mehta)",
    recipientName: "Alpha Squad (Devansh Mehta)",
    institution: "PCCE Verna",
    rewardAmount: "₹2,50,000",
    certificateCode: "ACME-INNOV-9812",
    certificate_code: "ACME-INNOV-9812",
    issuedAt: "Nov 5, 2026",
    issued_at: "Nov 5, 2026"
  },
  {
    id: 802,
    title: "Excellence in Generative Frontend",
    awardType: "Fast-Track R&D Interview",
    challengeTitle: "Generative Multimodal UI Component Studio",
    recipient: "Design System Squad (Sarah Al-Mansoor)",
    recipientName: "Design System Squad (Sarah Al-Mansoor)",
    institution: "IIT Bombay",
    rewardAmount: "Sponsored Tech Grant",
    certificateCode: "ACME-TALENT-4421",
    certificate_code: "ACME-TALENT-4421",
    issuedAt: "Nov 1, 2026",
    issued_at: "Nov 1, 2026"
  }
];

export const mockAwardsData = mockCompanyAwards;

// ==========================================
// 8. CHALLENGE ASSIGNMENTS (challenge_assignments)
// ==========================================
export const mockAssignmentsData = [
  { id: 501, challengeTitle: "Autonomous Agents in Cold-Chain Logistics", target_type: "department", target_name: "Engineering & R&D", due_at: "2026-11-30", note: "Stage 3 SCAMPER ideation required before submission.", status: "active", enrolled_count: 84, completed_count: 52 },
  { id: 502, challengeTitle: "Zero-Shot Escalation Triage Engine", target_type: "department", target_name: "Customer Operations", due_at: "2026-12-15", note: "Priority sprint for onboarding interns.", status: "active", enrolled_count: 112, completed_count: 48 },
  { id: 503, challengeTitle: "Generative Multimodal UI Component Studio", target_type: "team", target_name: "Design System Squad", due_at: "2026-11-25", note: "Complete with high-fidelity React prototype.", status: "active", enrolled_count: 67, completed_count: 67 }
];

// ==========================================
// 9. AI USAGE LOGS (ai_usage_logs table)
// ==========================================
export const mockAiLogsData = [
  { id: 9812, userName: "Devansh Mehta", feature: "scamper", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "10 mins ago" },
  { id: 9811, userName: "Sarah Al-Mansoor", feature: "evaluation", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "18 mins ago" },
  { id: 9810, userName: "Marcus Vance", feature: "five_whys", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "35 mins ago" },
  { id: 9809, userName: "Ananya Sharma", feature: "mentor", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "1 hour ago" },
  { id: 9808, userName: "Rohan Kulkarni", feature: "swot", model: "gemini-2.5-flash-lite", succeeded: true, created_at: "2 hours ago" },
  { id: 9807, userName: "David Kim", feature: "mentor", model: "gemini-2.5-flash-lite", succeeded: false, created_at: "Yesterday" }
];

// ==========================================
// 10. ANALYTICS & BENCHMARKING
// ==========================================
export const mockFunnelData = [
  { stage: "Accepted Challenge", count: 486, percentage: 100, pct: 100 },
  { stage: "Problem Canvas & 5 Whys", count: 412, percentage: 84.7, pct: 84.7 },
  { stage: "SCAMPER Ideation", count: 326, percentage: 67.0, pct: 67.0, isBottleneck: true, isBiggestDrop: true },
  { stage: "AI Rubric Self-Check", count: 284, percentage: 58.4, pct: 58.4 },
  { stage: "Final Submission Uploaded", count: 268, percentage: 55.1, pct: 55.1 }
];

export const mockFunnelStages = mockFunnelData;

export const mockInstitutionParticipation = [
  { name: "Padre Conceição College of Engineering (PCCE)", participants: 142, submissions: 98, avgScore: 84.2 },
  { name: "BITS Pilani (K.K. Birla Goa Campus)", participants: 118, submissions: 82, avgScore: 82.5 },
  { name: "IIT Bombay", participants: 94, submissions: 68, avgScore: 88.0 },
  { name: "National Institute of Technology (NIT) Goa", participants: 76, submissions: 42, avgScore: 76.4 },
  { name: "Don Bosco College of Engineering", participants: 56, submissions: 22, avgScore: 73.1 }
];

export const mockNeedsAttention = [
  { id: 1, priority: "high", title: "14 Onboarding Interns Inactive 7+ Days", description: "Customer Operations Cohort has not submitted Step 2 milestones.", actionLabel: "Send Reminder" },
  { id: 2, priority: "medium", title: "2 Challenges Expiring in 48 Hours", description: "Q4 Autonomous Agents Challenge due on Friday 11:59 PM.", actionLabel: "Extend Due Date" },
  { id: 3, priority: "info", title: "Bulk CSV Upload Completed with 3 Errors", description: "File 'incubator_intake_nov.csv' had duplicate invite emails.", actionLabel: "View Import Log" }
];