# ai-innovation-platform

# AI-Powered Gamified Project-Based Learning & Innovation Platform

> A comprehensive SaaS ecosystem bridging the gap between academia and industry through AI-guided design thinking workflows, conversational Socratic mentorship, and a competitive gamification layer.

---

## 📌 Project Overview

Traditional project-based learning often lacks scalable mentorship, objective evaluation, and structured design frameworks. This platform guides learners through end-to-end innovation cycles—from root-cause discovery to prototype scoping—augmented by adaptive conversational AI mentors, automated tech recommendations, and gamified incentives.

### 🌟 Key Highlights
- **Adaptive Academic Tiers:** Tailors challenge complexity, UI, and AI assistance across Grade 8–10, Grade 11–12, Graduate, and Professional tiers.
- **AI-Guided Design Thinking:** Interactive frameworks including 5-Whys, How-Might-We (HMW), SCAMPER ideation, Mind Mapping, and 2×2 SWOT/Feasibility scoring matrices.
- **Conversational Socratic AI Mentor:** In-workspace stage-aware coach providing hints, prompts, and guidance without giving away direct answers.
- **Instant AI Rubric Evaluation:** Multi-criteria automated assessment scoring innovation, technical feasibility, and real-world impact.
- **Gamified Engagement:** Dynamic XP gains, daily streak tracking, achievement badges, and multi-scope leaderboards (Class, Institution, Global).

---

## 👥 Team & Roles

Developed at **Padre Conceicao College of Engineering (PCCE)**

| Member | Primary Role | Secondary Role | Focus Track |
| :--- | :--- | :--- | :--- |
| **Riya Shetgaonkar** | Backend Developer | Integration Lead | Auth, Dashboard, Submissions, API Routing |
| **Sheryl Menezes** | Backend Developer | Database & API Integration | Data Models, Gamification Engine, Cloud Storage |
| **Shanallie Braganza** | AI/ML Developer | Frontend Developer | LLM Prompt Pipelines, Problem Canvas, AI Mentor |
| **Farah Imran Cutchi** | AI/ML Developer | UI/UX & Frontend Developer | Ideation Board, Rubric Scoring, Frontend Architecture |

---

## 🏗️ System Architecture & Tech Stack

### **Frontend**
- **Framework:** React.js (Vite)
- **State Management:** React Context API (`AuthContext`, `WorkspaceContext`)
- **Styling & UI:** Tailwind CSS / Modular CSS with responsive layouts
- **Networking:** Axios / Fetch client per domain module

### **Backend**
- **Framework:** FastAPI (Python 3.10+)
- **Data Validation:** Pydantic v2 schemas
- **Database & ORM:** PostgreSQL / SQLAlchemy
- **Caching & Real-Time Stats:** Redis (XP, Streaks, Leaderboard cache)
- **Security:** JWT Authentication, RBAC Policy Engine

### **AI & Cloud Integrations**
- **LLM Services:** OpenAI / Anthropic APIs with Socratic system prompts
- **Cloud Object Storage:** AWS S3 / GCP Cloud Storage (Submissions & Reports)
- **Communications:** Twilio / AWS SNS (OTP SMS), SendGrid / SES (Email)

---

## 📂 Project Directory Structure

```text
ai-innovation-platform/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app entrypoint
│   │   ├── config.py                   # Environment & app configurations
│   │   ├── database.py                 # Database engine & session setup
│   │   ├── security.py                 # JWT generation & RBAC handlers
│   │   ├── models/                     # SQLAlchemy ORM database models
│   │   │   ├── user.py                 # Epic 1: User metadata & tiers
│   │   │   ├── otp.py                  # Epic 1: OTP tokens & expiration
│   │   │   ├── challenge.py            # Epic 2: Domain challenges & briefs
│   │   │   ├── ideation.py             # Epic 3: Canvas, 5-Whys, Brainstorming
│   │   │   ├── evaluation.py           # Epic 3.3 & Epic 4.2: SWOT & Scorecards
│   │   │   ├── submission.py           # Epic 4: Deliverables & artifact URLs
│   │   │   ├── gamification.py         # Epic 5: XP logs, badges, streaks
│   │   │   └── mentor.py               # Epic 6: Chat history & session states
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── routers/                    # Endpoint routers by business domain
│   │   │   ├── auth.py                 # /api/auth/* (register, login, OTP)
│   │   │   ├── user.py                 # /api/user/* (profile, RBAC)
│   │   │   ├── dashboard.py            # /api/dashboard/*
│   │   │   ├── challenges.py           # /api/challenges/*
│   │   │   ├── ideation.py             # /api/ideation/*
│   │   │   ├── ai.py                   # /api/ai/* (refine, score, ideas)
│   │   │   ├── evaluation.py           # /api/evaluation/*
│   │   │   ├── submissions.py          # /api/submissions/*
│   │   │   ├── gamification.py         # /api/gamification/*
│   │   │   ├── planning.py             # /api/planning/* (WBS & sprint tasks)
│   │   │   └── mentor.py               # /api/ai/mentor/*
│   │   ├── services/                   # Core business logic & integrations
│   │   │   ├── otp_service.py
│   │   │   ├── sms_service.py          # Twilio / AWS SNS
│   │   │   ├── email_service.py        # SendGrid / SES
│   │   │   ├── llm_service.py          # Shared LLM wrapper & prompts
│   │   │   ├── storage_service.py      # Cloud object storage integration
│   │   │   ├── recommendation_service.py
│   │   │   └── gamification_service.py # XP, streaks, badges, leaderboard
│   │   └── utils/
│   ├── tests/                          # Backend unit & integration test suites
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/                      # Page views mapped by epic/feature
│   │   │   ├── auth/                   # Register, VerifyOtp, TierSelect, Login
│   │   │   ├── dashboard/              # Epic 2.1: Student overview
│   │   │   ├── challenges/             # Epic 2.2: Industry catalog & filters
│   │   │   ├── canvas/                 # Epic 3.1: 5-Whys & HMW canvas
│   │   │   ├── ideation/               # Epic 3.2: SCAMPER / Mind Map board
│   │   │   ├── evaluation/             # Epic 3.3: SWOT & 2x2 scatter matrix
│   │   │   ├── architecture/           # Epic 3.4: Tech stack selector
│   │   │   ├── planning/               # Epic 3.5: Auto WBS & checklist
│   │   │   ├── submission/             # Epic 4.1: Multi-format uploader
│   │   │   ├── scorecard/              # Epic 4.2: AI rubric feedback
│   │   │   ├── gamification/           # Epic 5: Badges & cohort leaderboards
│   │   │   └── mentor/                 # Epic 6: Contextual AI chat drawer
│   │   ├── components/                 # Reusable UI components
│   │   ├── context/                    # AuthContext, WorkspaceContext
│   │   ├── api/                        # Domain API client calls
│   │   ├── App.jsx                     # Application routing & layout
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/                               # Sprint plans & product specs
└── README.md