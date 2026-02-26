# ============================================================================
# ANALYZERS/ — Static Code Analysis Tools
# ============================================================================
# Rule-based code analyzers that run WITHOUT AI (pure logic):
#   - ast_parser.py          → Parses code into AST, extracts metrics
#   - security_scanner.py    → Detects security anti-patterns via regex
#   - performance_analyzer.py → Detects performance anti-patterns
#   - dependency_analyzer.py → Maps cross-file import dependencies
#
# These analyzers provide structured data that is fed to the AI service
# (Gemini) as additional context alongside the raw code diff.
# ============================================================================
