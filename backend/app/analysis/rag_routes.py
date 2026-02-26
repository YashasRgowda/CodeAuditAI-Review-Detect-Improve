# ============================================================================
# ANALYSIS/RAG_ROUTES.PY — RAG Knowledge Base API Endpoints
# ============================================================================
# Endpoints for managing the AI's memory (RAG knowledge base):
#
#   POST /analysis/rag/store         → Store an analysis in the knowledge base
#   POST /analysis/rag/search        → Search for similar past analyses
#   GET  /analysis/rag/knowledge-base → View knowledge base overview
#   GET  /analysis/rag/context       → Preview RAG context for a query
#   DELETE /analysis/rag/clear       → Clear the entire knowledge base
#
# The knowledge base is powered by ChromaDB (vector database) and
# Google's text-embedding-004 model for semantic search.
#
# Analyses stored here are automatically retrieved during new analyses
# to give the AI context about past reviews and trends.
# ============================================================================

from fastapi import APIRouter, HTTPException, Query

from app.analysis.rag_models import (
    RAGContextResponse,
    RAGKnowledgeBaseResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    RAGStoreRequest,
    RAGStoreResponse,
)
from app.analysis.rag_service import rag_service

router = APIRouter()


# ====================================================================
# STORE — Add an analysis to the knowledge base
# ====================================================================
@router.post("/rag/store", response_model=RAGStoreResponse)
async def store_analysis(request: RAGStoreRequest):
    """Store a completed analysis in the RAG knowledge base.

    This converts the analysis into a vector embedding and saves it
    in ChromaDB. Future analyses will be able to reference this
    review to identify trends and recurring patterns.

    Pass the full analysis result from /analysis/quick or /analysis/.
    """
    try:
        result = rag_service.store_analysis(
            analysis_data=request.analysis_data,
            repository_name=request.repository_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store analysis: {str(e)}")

    return RAGStoreResponse(
        document_id=result["document_id"],
        message="Analysis stored in knowledge base successfully.",
        total_documents=result["total_documents"],
    )


# ====================================================================
# SEARCH — Find similar past analyses
# ====================================================================
@router.post("/rag/search", response_model=RAGSearchResponse)
async def search_analyses(request: RAGSearchRequest):
    """Search the knowledge base for similar past analyses.

    Uses semantic search to find analyses with similar code patterns,
    issues, or recommendations. Useful for identifying trends.

    Examples:
    - "security vulnerability in authentication"
    - "console.log left in production code"
    - "high complexity function refactoring"
    """
    try:
        results = rag_service.search_similar(
            query=request.query,
            repository_name=request.repository_name,
            top_k=request.top_k,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    return RAGSearchResponse(
        query=request.query,
        results=[RAGSearchResult(**r) for r in results],
        total_results=len(results),
    )


# ====================================================================
# KNOWLEDGE BASE — View and manage stored analyses
# ====================================================================
@router.get("/rag/knowledge-base", response_model=RAGKnowledgeBaseResponse)
async def get_knowledge_base():
    """Get an overview of the RAG knowledge base.

    Shows how many analyses are stored and which repositories
    are represented in the AI's memory.
    """
    try:
        info = rag_service.get_knowledge_base_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge base info: {str(e)}")

    return RAGKnowledgeBaseResponse(**info)


@router.delete("/rag/clear")
async def clear_knowledge_base():
    """Clear the entire RAG knowledge base.

    Removes all stored analyses and embeddings. Use with caution —
    the AI will lose all memory of past reviews.
    """
    try:
        result = rag_service.clear_knowledge_base()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear knowledge base: {str(e)}")

    return result


# ====================================================================
# CONTEXT PREVIEW — See what RAG context would be injected
# ====================================================================
@router.get("/rag/context", response_model=RAGContextResponse)
async def preview_rag_context(
    query: str = Query(..., description="Describe the code change to find relevant past reviews"),
    repository_name: str | None = Query(None, description="Filter by repository name"),
    top_k: int = Query(3, description="Number of past analyses to include"),
):
    """Preview the RAG context that would be injected into an analysis prompt.

    This shows you exactly what past review data the AI would see
    when analyzing a similar code change. Useful for debugging.
    """
    try:
        result = rag_service.get_rag_context(
            current_analysis_text=query,
            repository_name=repository_name,
            top_k=top_k,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get RAG context: {str(e)}")

    return RAGContextResponse(**result)
