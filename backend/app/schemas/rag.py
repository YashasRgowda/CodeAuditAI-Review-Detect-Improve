# ============================================================================
# SCHEMAS/RAG.PY — RAG (AI Memory) Request/Response Models
# ============================================================================
# Data shapes for the RAG knowledge base system:
#   - RAGStoreRequest/Response:   Store an analysis into vector database
#   - RAGSearchRequest/Response:  Search for similar past analyses
#   - RAGSearchResult:            A single search result with similarity score
#   - RAGKnowledgeBaseResponse:   Overview of what's stored in memory
#   - RAGContextResponse:         The context injected into AI prompts
#
# Uses ChromaDB for vector storage and Google Embeddings for vectorization.
# ============================================================================

from pydantic import BaseModel


class RAGStoreRequest(BaseModel):
    """Store an analysis result into the RAG knowledge base"""
    analysis_data: dict  # The full analysis result to store
    repository_name: str | None = None  # Optional: for filtering by repo


class RAGStoreResponse(BaseModel):
    """Confirmation that analysis was stored"""
    document_id: str
    message: str
    total_documents: int


class RAGSearchRequest(BaseModel):
    """Search the knowledge base for similar past analyses"""
    query: str  # Natural language search query
    repository_name: str | None = None  # Optional: filter by repo
    top_k: int = 5  # Number of results to return


class RAGSearchResult(BaseModel):
    """A single search result from the knowledge base"""
    document_id: str
    summary: str
    risk_level: str
    overall_score: int | None = None
    commit_hash: str | None = None
    repository: str | None = None
    similarity_score: float
    metadata: dict = {}


class RAGSearchResponse(BaseModel):
    """Search results from the knowledge base"""
    query: str
    results: list[RAGSearchResult]
    total_results: int


class RAGKnowledgeBaseResponse(BaseModel):
    """Overview of the RAG knowledge base"""
    total_documents: int
    repositories: list[str]
    message: str


class RAGContextResponse(BaseModel):
    """The RAG context that gets injected into analysis prompts"""
    context: str
    sources_used: int
    message: str
