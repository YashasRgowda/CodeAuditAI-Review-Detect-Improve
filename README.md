# CodeAuditAI

> **AI-powered code review platform that analyzes commits and pull requests using multi-agent reasoning, real-time streaming, RAG memory, and auto-fix generation.**

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-D82C20?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/ChromaDB-RAG-orange?style=for-the-badge" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
</p>

---

## Overview

CodeAuditAI is a full-stack AI code intelligence platform built to make code reviews faster, deeper, and more actionable.

Instead of relying only on rule-based static checks, it combines **local code analysis**, **LLM-based reasoning**, **multi-agent review**, **real-time streaming**, and **RAG memory** to deliver context-aware feedback on commits and pull requests.

It is designed to help developers:

- catch security, performance, and architecture issues earlier
- understand why an issue matters
- ask follow-up questions in natural language
- move from detection to resolution with AI-generated fixes

---

## Why This Project Stands Out

- **Commit-level and PR-level review**, not just repo-wide scanning
- **Three specialized AI agents** for security, performance, and architecture
- **Streaming analysis experience** with live progress updates
- **RAG memory with ChromaDB** for context-aware future reviews
- **AI chat interface** for deeper debugging and explanation
- **Auto-fix generation** with diff-style output
- **GitHub-native workflow** with OAuth, repositories, commits, and pull requests

---

## Key Features

### Multi-Agent Review Engine

CodeAuditAI runs three specialized agents in parallel:

- **Security Agent** identifies vulnerabilities, secrets, and unsafe patterns
- **Performance Agent** detects bottlenecks, inefficient logic, and costly operations
- **Architecture Agent** evaluates maintainability, coupling, and structural quality

These results are merged into one unified report for a more balanced review.

---

### Commit and Pull Request Analysis

Analyze code changes at the exact point they happen:

- specific commits
- individual pull requests
- historical analysis results
- comparison across reviews

---

### Real-Time Streaming Analysis

The platform supports **Server-Sent Events (SSE)** so users can watch progress live while analysis is running.

---

### RAG Memory

Past analyses are stored in **ChromaDB** and retrieved during future reviews to improve context and continuity.

---

### AI Chat

After an analysis, users can ask follow-up questions such as:

- What is the biggest risk here?
- Explain this issue simply
- How should I fix this?
- What could break if I ignore this?

---

### Auto-Fix Generation

The platform can generate actionable fixes with:

- issue explanation
- suggested code changes
- diff-style output
- confidence score

---

### GitHub Integration

- GitHub OAuth login
- repository connection and browsing
- commit and PR workflows
- webhook support

---

### Developer Dashboard

A central dashboard gives visibility into:

- code health
- recent analyses
- risk trends
- repository activity
- review outcomes

---

## Architecture Flow

```text
GitHub OAuth Login
        ↓
Connect Repository
        ↓
Select Commit / Pull Request
        ↓
Run Local Static Analysis
        ↓
Run AI Analysis (Quick / Streaming / Multi-Agent)
        ↓
Merge Agent Results
        ↓
Store in RAG Memory
        ↓
Show Dashboard Insights
        ↓
Enable AI Chat and Auto-Fix
```

---

## Tech Stack

### Frontend

- Next.js 15
- React 19
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Recharts
- Sonner
- NextAuth.js

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- sse-starlette
- Ruff

### Data Layer

- PostgreSQL
- Redis
- ChromaDB

### AI Layer

- Google Gemini 2.5 Flash
- Gemini Embeddings
- Multi-agent orchestration
- RAG pipeline

### DevOps

- Docker
- Docker Compose
- GitHub Actions
- Render deployment config

---

## Product Walkthrough

Replace the image paths below with your actual GitHub image links or screenshot paths.

### Landing Page

<img width="2048" height="1330" alt="1" src="https://github.com/user-attachments/assets/87932944-8725-45b3-bcac-8b8ce5b8907a" />

<img width="2048" height="1330" alt="2" src="https://github.com/user-attachments/assets/a212636b-1104-45fc-9adb-6e859d3bad33" />


<img width="2048" height="1330" alt="3" src="https://github.com/user-attachments/assets/f5700f21-3518-439c-ba8c-23e96e64b83a" />


<img width="2048" height="1330" alt="4" src="https://github.com/user-attachments/assets/e0302b8f-6fde-4ecf-8901-22335827cabb" />

<img width="2048" height="1330" alt="5" src="https://github.com/user-attachments/assets/e72d1835-c88a-4396-8434-d54712b049d8" />

<img width="2048" height="1330" alt="6" src="https://github.com/user-attachments/assets/e0d06c97-5473-4eb8-a0d5-364fc3b49ae9" />

<img width="2048" height="1330" alt="7" src="https://github.com/user-attachments/assets/2b2a20d8-52b6-4a80-98bc-e4e73c760791" />

<img width="2048" height="1330" alt="8" src="https://github.com/user-attachments/assets/22cd1f09-36fe-4cfb-b7fc-f221fa009aa1" />

<img width="2048" height="1330" alt="9" src="https://github.com/user-attachments/assets/939c18d1-feb2-47f3-89fc-65465d9df9cd" />

The landing page is designed to communicate the value of CodeAuditAI immediately. It introduces the platform, highlights the core capabilities, and positions the product as an intelligent code review assistant rather than a basic static checker.

---

### Dashboard
<img width="2048" height="1330" alt="1" src="https://github.com/user-attachments/assets/0a749f04-9fbd-4b2d-848b-394e489f6315" />



The dashboard acts as the control center of the platform. It gives users a quick summary of repository activity, analysis results, and code health signals, making it easier to monitor review outcomes at a glance.

---

### Repository Management

![Repository Management]()

The repository section allows users to connect and manage GitHub repositories, browse available projects, and move into commit or pull request analysis flows. This is the bridge between GitHub data and AI-powered review workflows.

---

### Commit / PR Analysis

![Commit and PR Analysis]()

The analysis page presents the detailed output of a review, including issue summaries, risk classification, impact understanding, and AI-generated insights. It helps developers see both the technical findings and the reasoning behind them.

---

### Multi-Agent Analysis

![Multi-Agent Analysis]()

This page showcases one of the strongest parts of the platform: multiple AI agents reviewing the same change from different perspectives. Instead of a single flat response, users get security, performance, and architecture intelligence combined into a richer review experience.

---

### Real-Time Streaming Analysis

![Streaming Analysis]()

Streaming analysis makes the review process feel alive. Rather than waiting for a single final response, users can see progress updates while the system processes the code, which improves transparency and user trust.

---

### AI Chat

![AI Chat]()

The chat interface transforms a static report into an interactive debugging experience. Users can ask follow-up questions, request clarification, explore risks in more depth, and get more practical guidance based on the existing analysis.

---

### Auto-Fix Engine

![Auto-Fix Engine]()

The auto-fix engine helps close the gap between finding an issue and fixing it. It provides suggested improvements in a developer-friendly format, making the platform useful not only for review but also for implementation support.

---

### Knowledge Base / RAG Memory

![Knowledge Base]()

The knowledge base stores and retrieves past review insights, allowing CodeAuditAI to use historical context in future analyses. This gives the system memory and makes the review process more informed over time.

---

## Project Structure

```text
AI-code_review_assistant/
├── backend/
│   ├── app/
│   │   ├── analyzers/
│   │   ├── core/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   │   └── agents/
│   │   ├── webhooks/
│   │   └── main.py
│   ├── chroma_data/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
├── docker-compose.yml
├── pyproject.toml
└── render.yaml
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd AI-code_review_assistant
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Docker Setup

Run backend services with PostgreSQL and Redis:

```bash
docker compose up --build
```

---

## Environment Variables

### Backend

Create `backend/.env`:

```env
DATABASE_URL=
REDIS_URL=
GEMINI_API_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

### Frontend

Create `frontend/.env.local`:

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=
GITHUB_SECRET=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Current Status

- [x] GitHub OAuth integration
- [x] Repository connection and browsing
- [x] Commit-level AI analysis
- [x] PR-level AI analysis
- [x] Multi-agent review engine
- [x] SSE-based real-time streaming
- [x] RAG memory with ChromaDB
- [x] AI chat workflows
- [x] Auto-fix generation
- [x] Redis caching
- [x] GitHub webhook support
- [x] GitHub Actions CI pipeline

---

## Roadmap

- [ ] Team collaboration features
- [ ] Advanced vulnerability detection
- [ ] One-click fix PR generation
- [ ] Expanded automated testing
- [ ] More analytics and reporting

---

## Author

**Yashas R**

---

## License

Add your preferred license here.

MIT License
