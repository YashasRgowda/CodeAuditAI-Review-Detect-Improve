# ============================================================================
# ROUTES/RAG.PY — RAG Knowledge Base API Endpoints
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
# Google's gemini-embedding-001 model for semantic search.
#
# Analyses stored here are automatically retrieved during new analyses
# to give the AI context about past reviews and trends.
# ============================================================================

from fastapi import APIRouter, HTTPException, Query

from app.core.redis import TTL_KB_INFO, CacheManager
from app.schemas.rag import (
    RAGContextResponse,
    RAGKnowledgeBaseResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    RAGSearchResult,
    RAGStoreRequest,
    RAGStoreResponse,
)
from app.services.rag_service import rag_service

router = APIRouter()


# ====================================================================
# STORE — Add an analysis to the knowledge base
# ====================================================================
@router.post("/rag/store", response_model=RAGStoreResponse)
async def store_analysis(request: RAGStoreRequest):
    """Store a completed analysis in the RAG knowledge base."""
    try:
        result = rag_service.store_analysis(
            analysis_data=request.analysis_data,
            repository_name=request.repository_name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store analysis: {str(e)}")

    # New document stored — invalidate the knowledge-base stats cache
    CacheManager.delete("rag:kb_info")

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
    """Search the knowledge base for similar past analyses."""
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
    """Get an overview of the RAG knowledge base."""
    cached = CacheManager.get_json("rag:kb_info")
    if cached is not None:
        return RAGKnowledgeBaseResponse(**cached)

    try:
        info = rag_service.get_knowledge_base_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge base info: {str(e)}")

    CacheManager.set_json("rag:kb_info", info, TTL_KB_INFO)
    return RAGKnowledgeBaseResponse(**info)


@router.delete("/rag/clear")
async def clear_knowledge_base():
    """Clear the entire RAG knowledge base."""
    try:
        result = rag_service.clear_knowledge_base()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear knowledge base: {str(e)}")

    CacheManager.delete("rag:kb_info")
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
    """Preview the RAG context that would be injected into an analysis prompt."""
    try:
        result = rag_service.get_rag_context(
            current_analysis_text=query,
            repository_name=repository_name,
            top_k=top_k,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get RAG context: {str(e)}")

    return RAGContextResponse(**result)
