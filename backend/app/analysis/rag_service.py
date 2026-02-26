# ============================================================================
# ANALYSIS/RAG_SERVICE.PY — RAG Engine (Retrieval-Augmented Generation)
# ============================================================================
# Gives the AI "memory" by storing past analysis results in a vector database
# and retrieving relevant past reviews when doing new analyses.
#
# HOW IT WORKS:
#   1. STORE: After each analysis, the result (summary, recommendations,
#      scores, etc.) is converted into a text document, embedded into a
#      vector using Google's embedding model, and stored in ChromaDB.
#
#   2. RETRIEVE: Before a new analysis, we search ChromaDB for similar
#      past analyses (same repo, similar code patterns, similar issues).
#
#   3. AUGMENT: The retrieved past reviews are injected into the Gemini
#      prompt as extra context, so the AI can reference trends, recurring
#      issues, and historical patterns.
#
# Components:
#   - ChromaDB: Lightweight vector database (persistent, file-based)
#   - Google Embeddings: gemini-embedding-001 model for vector generation
#   - Retrieval: Semantic search with optional repo-based filtering
#
# Key methods:
#   - store_analysis()       → Store a completed analysis in vector DB
#   - search_similar()       → Find similar past analyses
#   - get_rag_context()      → Build RAG context string for prompts
#   - get_knowledge_base_info() → Get overview of stored knowledge
#   - clear_knowledge_base() → Clear all stored analyses
# ============================================================================

import uuid
from pathlib import Path
from typing import Any

import chromadb
import google.generativeai as genai

from app.config import settings

# ChromaDB persistent storage path (inside backend directory)
CHROMA_PERSIST_DIR = str(Path(__file__).parent.parent.parent / "chroma_data")


class RAGService:
    def __init__(self):
        # Configure Google AI for embeddings
        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Initialize ChromaDB with persistent storage
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

        # Create/get the collection for storing analysis embeddings
        self.collection = self.chroma_client.get_or_create_collection(
            name="code_analyses",
            metadata={"description": "Past code analysis results for RAG retrieval"}
        )

    # ====================================================================
    # STORE — Save an analysis result into the vector database
    # ====================================================================
    def store_analysis(self, analysis_data: dict[str, Any], repository_name: str | None = None) -> dict:
        """Store a completed analysis in ChromaDB for future retrieval.

        The analysis text is converted into a vector embedding and stored
        with metadata for filtering and display.

        Args:
            analysis_data: The full analysis result dict
            repository_name: Optional repo name for filtering

        Returns:
            dict with document_id and total_documents count
        """
        # Build a rich text document from the analysis
        document_text = self._build_document_text(analysis_data)

        # Generate embedding using Google's embedding model
        embedding = self._generate_embedding(document_text)

        # Create a unique document ID
        commit_hash = analysis_data.get("commit_hash", "unknown")
        doc_id = f"analysis:{commit_hash[:12]}:{uuid.uuid4().hex[:8]}"

        # Build metadata for filtering and display
        metadata = {
            "repository": repository_name or analysis_data.get("repository_name", "unknown"),
            "commit_hash": commit_hash,
            "author": analysis_data.get("author", "unknown"),
            "risk_level": analysis_data.get("risk_level", "unknown"),
            "change_type": analysis_data.get("change_type", "unknown"),
            "overall_score": analysis_data.get("overall_score", 0),
            "maintainability_score": analysis_data.get("maintainability_score", 0),
            "security_score": analysis_data.get("security_score", 0),
            "performance_score": analysis_data.get("performance_score", 0),
            "files_changed": analysis_data.get("files_changed", 0),
            "summary": analysis_data.get("summary", "")[:500],  # ChromaDB metadata limit
        }

        # Store in ChromaDB
        self.collection.add(
            documents=[document_text],
            embeddings=[embedding],
            metadatas=[metadata],
            ids=[doc_id]
        )

        return {
            "document_id": doc_id,
            "total_documents": self.collection.count()
        }

    # ====================================================================
    # SEARCH — Find similar past analyses
    # ====================================================================
    def search_similar(
        self,
        query: str,
        repository_name: str | None = None,
        top_k: int = 5
    ) -> list[dict]:
        """Search for similar past analyses using semantic search.

        Args:
            query: Natural language search query or analysis text
            repository_name: Optional filter by repository
            top_k: Number of results to return

        Returns:
            List of similar analyses with scores
        """
        if self.collection.count() == 0:
            return []

        # Generate embedding for the search query
        query_embedding = self._generate_embedding(query)

        # Build filter if repository specified
        where_filter = None
        if repository_name:
            where_filter = {"repository": repository_name}

        # Limit top_k to actual document count
        actual_k = min(top_k, self.collection.count())

        # Search ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=actual_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        # Format results
        formatted_results = []
        if results and results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0

                # Convert distance to similarity score (ChromaDB returns L2 distance)
                # Lower distance = more similar. Convert to 0-1 scale.
                similarity = max(0, 1 - (distance / 2))

                formatted_results.append({
                    "document_id": doc_id,
                    "summary": metadata.get("summary", "No summary"),
                    "risk_level": metadata.get("risk_level", "unknown"),
                    "overall_score": metadata.get("overall_score"),
                    "commit_hash": metadata.get("commit_hash"),
                    "repository": metadata.get("repository"),
                    "similarity_score": round(similarity, 3),
                    "metadata": metadata,
                })

        return formatted_results

    # ====================================================================
    # GET RAG CONTEXT — Build context string for Gemini prompts
    # ====================================================================
    def get_rag_context(
        self,
        current_analysis_text: str,
        repository_name: str | None = None,
        top_k: int = 3
    ) -> dict:
        """Retrieve relevant past analyses and build RAG context for prompts.

        This is called BEFORE sending a prompt to Gemini. The returned
        context string is injected into the analysis prompt so the AI
        can reference past reviews.

        Args:
            current_analysis_text: Description of the current code change
            repository_name: Optional repo filter
            top_k: Number of past analyses to include

        Returns:
            dict with 'context' string and 'sources_used' count
        """
        if self.collection.count() == 0:
            return {
                "context": "",
                "sources_used": 0,
                "message": "No past analyses in knowledge base yet."
            }

        # Search for relevant past analyses
        similar = self.search_similar(
            query=current_analysis_text,
            repository_name=repository_name,
            top_k=top_k
        )

        if not similar:
            return {
                "context": "",
                "sources_used": 0,
                "message": "No relevant past analyses found."
            }

        # Build the RAG context string
        context_parts = ["PAST ANALYSIS HISTORY (from your knowledge base):"]
        context_parts.append("Use this context to identify trends, recurring issues, and improvements.\n")

        for i, result in enumerate(similar, 1):
            meta = result.get("metadata", {})
            context_parts.append(f"--- Past Review #{i} (similarity: {result['similarity_score']:.0%}) ---")
            context_parts.append(f"Repository: {meta.get('repository', 'N/A')}")
            context_parts.append(f"Commit: {meta.get('commit_hash', 'N/A')[:12]}")
            context_parts.append(f"Author: {meta.get('author', 'N/A')}")
            context_parts.append(f"Risk: {meta.get('risk_level', 'N/A')} | Score: {meta.get('overall_score', 'N/A')}/10")
            context_parts.append(f"Scores: maintainability={meta.get('maintainability_score', 'N/A')}, "
                                 f"security={meta.get('security_score', 'N/A')}, "
                                 f"performance={meta.get('performance_score', 'N/A')}")
            context_parts.append(f"Summary: {meta.get('summary', 'N/A')}")
            context_parts.append("")

        context_parts.append("--- END OF PAST REVIEWS ---")
        context_parts.append("Reference these past reviews to identify patterns, recurring issues, "
                             "and whether the codebase is improving or degrading over time.\n")

        return {
            "context": "\n".join(context_parts),
            "sources_used": len(similar),
            "message": f"Found {len(similar)} relevant past analyses."
        }

    # ====================================================================
    # KNOWLEDGE BASE MANAGEMENT
    # ====================================================================
    def get_knowledge_base_info(self) -> dict:
        """Get overview of what's stored in the knowledge base."""
        total = self.collection.count()

        # Get unique repositories from metadata
        repositories = set()
        if total > 0:
            # Fetch all metadata to get unique repos
            all_data = self.collection.get(include=["metadatas"])
            if all_data and all_data["metadatas"]:
                for meta in all_data["metadatas"]:
                    repo = meta.get("repository", "unknown")
                    if repo != "unknown":
                        repositories.add(repo)

        return {
            "total_documents": total,
            "repositories": sorted(repositories),
            "message": f"Knowledge base contains {total} analyses from {len(repositories)} repositories."
        }

    def clear_knowledge_base(self) -> dict:
        """Clear all stored analyses from the knowledge base."""
        # Delete and recreate the collection
        self.chroma_client.delete_collection("code_analyses")
        self.collection = self.chroma_client.get_or_create_collection(
            name="code_analyses",
            metadata={"description": "Past code analysis results for RAG retrieval"}
        )

        return {
            "message": "Knowledge base cleared successfully.",
            "total_documents": 0
        }

    # ====================================================================
    # INTERNAL HELPERS
    # ====================================================================
    def _build_document_text(self, analysis_data: dict[str, Any]) -> str:
        """Build a rich text document from analysis data for embedding.

        Combines all important analysis fields into a single searchable
        text document that captures the essence of the review.
        """
        parts = []

        # Summary and basic info
        if analysis_data.get("summary"):
            parts.append(f"Summary: {analysis_data['summary']}")

        if analysis_data.get("commit_message"):
            parts.append(f"Commit: {analysis_data['commit_message']}")

        if analysis_data.get("change_type"):
            parts.append(f"Change type: {analysis_data['change_type']}")

        if analysis_data.get("risk_level"):
            parts.append(f"Risk level: {analysis_data['risk_level']}")

        # Scores
        scores = []
        for key in ["maintainability_score", "security_score", "performance_score", "overall_score"]:
            if analysis_data.get(key) is not None:
                scores.append(f"{key}: {analysis_data[key]}")
        if scores:
            parts.append(f"Scores: {', '.join(scores)}")

        # Recommendations
        recs = analysis_data.get("recommendations", [])
        if recs:
            parts.append(f"Recommendations: {'; '.join(recs[:5])}")

        # Security concerns
        concerns = analysis_data.get("security_concerns", [])
        if concerns:
            parts.append(f"Security concerns: {'; '.join(concerns[:5])}")

        # Impact areas
        impacts = analysis_data.get("impact_areas", [])
        if impacts:
            parts.append(f"Impact areas: {', '.join(impacts)}")

        # Code quality
        if analysis_data.get("code_quality_assessment"):
            parts.append(f"Code quality: {analysis_data['code_quality_assessment'][:300]}")

        return "\n".join(parts) if parts else "No analysis data available"

    def _generate_embedding(self, text: str) -> list[float]:
        """Generate a vector embedding using Google's embedding model.

        Uses gemini-embedding-001 (Google's latest embedding model)
        for high-quality semantic vector representations.
        """
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text,
        )
        return result['embedding']


# Create global instance
rag_service = RAGService()
