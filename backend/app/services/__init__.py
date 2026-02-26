# ============================================================================
# SERVICES/ — Business Logic & AI Engines
# ============================================================================
# All AI and business logic lives here:
#   - gemini_service.py   → Core AI analysis engine (Gemini structured output)
#   - github_service.py   → GitHub API integration (repos, commits, PRs)
#   - github_oauth.py     → GitHub OAuth 2.0 login flow
#   - chat_service.py     → Multi-turn conversational AI (Redis-backed)
#   - rag_service.py      → RAG engine (ChromaDB + Google Embeddings)
#   - autofix_service.py  → AI code fix generator
#   - agents/             → Multi-agent specialist system
#     ├── base_agent.py       → Abstract base for all agents
#     ├── security_agent.py   → Cybersecurity specialist
#     ├── performance_agent.py → Performance engineer specialist
#     ├── architecture_agent.py → Senior architect specialist
#     └── orchestrator.py     → Runs all agents in parallel
# ============================================================================
