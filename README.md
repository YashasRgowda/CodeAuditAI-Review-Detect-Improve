# CodeAuditAI

## Overview

CodeAuditAI is an AI-powered code review and analysis platform that helps developers and teams automatically review GitHub repositories, detect potential issues, assess risk, and improve overall code quality. The platform integrates directly with GitHub, analyzes commits and pull requests, and provides structured, actionable insights through a web-based dashboard.

---

## Screenshots
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 34 34 PM" src="https://github.com/user-attachments/assets/ef1380bd-b0f2-4cb2-905d-1101efc9a979" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 34 47 PM" src="https://github.com/user-attachments/assets/4648b317-2372-4610-8e78-e2a574991652" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 01 PM" src="https://github.com/user-attachments/assets/6bcf4a6d-9a63-4b10-a7a5-ac2862649b0d" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 15 PM" src="https://github.com/user-attachments/assets/a4409821-a298-4fc5-9569-f9fba78c26c0" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 22 PM" src="https://github.com/user-attachments/assets/4a53b980-757d-45ce-ad70-6e01aa16d0cf" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 29 PM" src="https://github.com/user-attachments/assets/112c36c2-1132-4225-aae4-5b13c9813aab" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 36 PM" src="https://github.com/user-attachments/assets/2e52334c-c092-49b0-a2d6-e0e5ae665f58" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 43 PM" src="https://github.com/user-attachments/assets/9e983a3c-17c0-4dde-b70e-7766b8c161bc" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 35 50 PM" src="https://github.com/user-attachments/assets/5e2bf683-5e43-49c2-85e6-e3be30bac889" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 36 02 PM" src="https://github.com/user-attachments/assets/baa68248-896e-46de-80e1-17313e743dfa" />
<img width="1512" height="982" alt="Screenshot 2025-12-24 at 5 36 19 PM" src="https://github.com/user-attachments/assets/7128b40d-0ab5-45c3-b4c5-be86e16fd8e6" />


## Key Features

* GitHub OAuth-based authentication
* Repository onboarding and management
* Centralized dashboard with analysis overview
* Automated commit-level code analysis
* AI-generated summaries and impact assessments
* Risk classification (Low, Medium, High)
* Code metrics including files changed and lines added/removed
* Security score evaluation
* Quick analysis for faster feedback
* Historical analysis tracking

---

## Application Flow

### Authentication

Users sign in using their GitHub account via OAuth. Once authenticated, the application gains access to selected repositories for analysis.

### Dashboard

The dashboard provides a consolidated overview of repositories, total analyses performed, and identified risk levels. Recent activity and quick actions are also displayed.

### Repository Management

Users can add, view, and manage GitHub repositories. Each repository can be independently analyzed and tracked.

### Code Analysis

Commits are processed to identify architectural changes, security concerns, maintainability issues, and potential regressions.

### Analysis Details

Each analysis includes:

* Commit summary
* Risk level classification
* Impact areas
* Files changed
* Lines added and removed
* AI-generated detailed report

---

## Tech Stack

### Frontend

* React
* Component-based architecture
* Responsive dark-mode UI

### Backend

* FastAPI
* RESTful APIs
* GitHub OAuth integration

### Database

* PostgreSQL
* SQLAlchemy ORM

### AI Engine

* Large Language Models (LLMs)
* Rule-based and AI-assisted risk detection

---

## Project Structure

```
frontend/
  ├─ components/
  ├─ pages/
  ├─ layouts/
  └─ services/

backend/
  ├─ app/
  │   ├─ api/
  │   ├─ core/
  │   ├─ models/
  │   ├─ services/
  │   └─ main.py
  └─ requirements.txt
```

---

## Setup Instructions

### Prerequisites

* Node.js
* Python 3.9 or higher
* PostgreSQL
* GitHub OAuth credentials

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

The backend requires the following environment variables:

* DATABASE_URL
* GITHUB_CLIENT_ID
* GITHUB_CLIENT_SECRET
* SECRET_KEY

---

## Security

* OAuth-based authentication
* Secure token handling
* Authorization checks for repository and analysis access

---

## Current Status

* MVP with end-to-end GitHub integration
* Commit-level analysis implemented
* Dashboard, repository management, and analysis views completed

---

## Roadmap

* Pull request review automation
* CI/CD pipeline integration
* Advanced vulnerability detection
* Team and organization support
* Exportable analysis reports

---

## License

This project is under active development. Licensing details will be added in future releases.

---

## Author

Yashas R
