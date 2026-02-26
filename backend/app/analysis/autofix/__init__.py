# ============================================================================
# AUTOFIX/ — AI Auto-Fix Code Generation Package (Phase 5)
# ============================================================================
# On-demand AI code fix generation. When a user reviews their analysis report
# and wants the AI to actually FIX an issue (not just complain about it),
# this package generates the corrected code.
#
# Key principle: HUMAN-IN-THE-LOOP — Fixes are generated ONLY when the user
# explicitly asks for them. The analysis report suggests "🔧 Fix available"
# but never auto-applies fixes.
#
# Components:
#   - autofix_models.py   → Pydantic schemas for fix requests/responses
#   - autofix_service.py  → Core fix generator (sends code + issue to Gemini)
#   - autofix_routes.py   → API endpoints for requesting fixes
# ============================================================================
