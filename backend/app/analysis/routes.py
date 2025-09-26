from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.analysis import Analysis
from app.models.pr_analysis import PRAnalysis
from app.repositories.github_service import github_service
from app.analysis.gemini_service import gemini_service
from app.analysis.models import (
    AnalysisCreate, 
    AnalysisResponse, 
    AnalysisRequest,
    QuickAnalysisResponse,
    DetailedAnalysisResponse
)
from app.analysis.pr_analysis_models import (
    PRAnalysisRequest,
    QuickPRAnalysisRequest, 
    PRAnalysisResponse,
    QuickPRAnalysisResponse
)

router = APIRouter()

@router.post("/quick", response_model=QuickAnalysisResponse)
async def quick_analysis(request: AnalysisRequest):
    """Quick analysis of code changes without saving to database"""
    
    # For demo purposes, create mock commit data
    # In real implementation, this would fetch from GitHub API
    mock_commit_data = {
        "sha": request.commit_sha or "abc123def456", 
        "message": "Add new feature for better code analysis",
        "author": "YashasRgowda",
        "date": "2025-08-28T02:30:00Z",
        "stats": {
            "total": 45,
            "additions": 35,
            "deletions": 10
        },
        "files": [
            {
                "filename": "src/analyzer.py",
                "status": "modified", 
                "additions": 25,
                "deletions": 5,
                "changes": 30,
                "patch": """@@ -1,10 +1,25 @@
 import ast
 import os
+from typing import List, Dict, Any
 
 class CodeAnalyzer:
     def __init__(self):
-        self.results = []
+        self.results = {}
+        self.file_count = 0
     
-    def analyze(self, file_path):
-        # Basic analysis
-        return {"status": "analyzed"}
+    def analyze(self, file_path: str) -> Dict[str, Any]:
+        \"\"\"Analyze a Python file for complexity and issues\"\"\"
+        try:
+            with open(file_path, 'r') as f:
+                content = f.read()
+            
+            tree = ast.parse(content)
+            analysis = {
+                "file": file_path,
+                "functions": self._count_functions(tree),
+                "classes": self._count_classes(tree), 
+                "complexity": self._calculate_complexity(tree)
+            }
+            return analysis
+        except Exception as e:
+            return {"error": str(e)}"""
            },
            {
                "filename": "tests/test_analyzer.py",
                "status": "added",
                "additions": 10,
                "deletions": 0, 
                "changes": 10,
                "patch": """@@ -0,0 +1,10 @@
+import unittest
+from src.analyzer import CodeAnalyzer
+
+class TestCodeAnalyzer(unittest.TestCase):
+    def setUp(self):
+        self.analyzer = CodeAnalyzer()
+    
+    def test_analyze_basic(self):
+        result = self.analyzer.analyze("sample.py")
+        self.assertIn("functions", result)"""
            }
        ]
    }
    
    # Analyze with Gemini AI
    analysis_result = await gemini_service.analyze_code_changes(mock_commit_data)
    
    return QuickAnalysisResponse(
        summary=analysis_result["summary"],
        risk_level=analysis_result["risk_level"],
        change_type=analysis_result["change_type"],
        files_changed=analysis_result["files_changed"],
        lines_added=analysis_result["lines_added"],
        lines_removed=analysis_result["lines_removed"],
        commit_hash=analysis_result["commit_hash"],
        commit_message=analysis_result["commit_message"],
        author=analysis_result["author"],
        recommendations=[
            "Add unit tests for the new complexity calculation methods",
            "Consider adding error handling for malformed Python files",
            "Document the complexity scoring algorithm"
        ]
    )

@router.post("/", response_model=AnalysisResponse)
async def create_analysis(
    analysis_data: AnalysisCreate,
    db: Session = Depends(get_db)
):
    """Create and save a detailed analysis to the database"""
    
    # Check if repository exists
    repository = db.query(Repository).filter(Repository.id == analysis_data.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get the user who owns this repository
    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")
    
    # Check if analysis already exists for this commit
    existing_analysis = db.query(Analysis).filter(
        Analysis.repository_id == analysis_data.repository_id,
        Analysis.commit_hash == analysis_data.commit_hash
    ).first()
    
    if existing_analysis:
        return existing_analysis
    
    # Fetch REAL commit data from GitHub
    try:
        commit_diff = await github_service.get_commit_diff(user, repository.repo_name, analysis_data.commit_hash)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch commit: {str(e)}")
    
    # Analyze with Gemini AI using REAL data
    try:
        analysis_result = await gemini_service.analyze_code_changes(commit_diff)
    except Exception as e:
        print(f"❌ GEMINI ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    # Save to database
    try:
        analysis = Analysis(
            repository_id=analysis_data.repository_id,
            commit_hash=analysis_data.commit_hash,
            summary=analysis_result.get("summary", "Analysis completed"),
            changes_data=analysis_result,
            risk_level=analysis_result.get("risk_level", "medium"),
            files_changed=analysis_result.get("files_changed", 0),
            lines_added=analysis_result.get("lines_added", 0), 
            lines_removed=analysis_result.get("lines_removed", 0),
            maintainability_score=analysis_result.get("performance_analysis", {}).get("performance_score", 70),
            security_score=100 - analysis_result.get("security_analysis", {}).get("overall_risk_score", 0),
            performance_score=analysis_result.get("performance_analysis", {}).get("performance_score", 100),
            dependency_complexity=len(analysis_result.get("dependency_analysis", {}).get("cross_file_connections", [])),
            technical_debt_ratio=sum(a.get("technical_debt_ratio", 0) for a in analysis_result.get("ast_analysis", {}).get("complexity_summary", []))
        )
        
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return analysis
    except Exception as e:
        db.rollback()
        print(f"❌ DATABASE ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")

@router.get("/", response_model=List[AnalysisResponse])
async def get_analyses(
    repository_id: Optional[int] = Query(None),
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db)
):
    """Get analysis history"""
    query = db.query(Analysis)
    
    if repository_id:
        query = query.filter(Analysis.repository_id == repository_id)
    
    analyses = query.order_by(Analysis.created_at.desc()).limit(limit).all()
    return analyses

@router.get("/{analysis_id}", response_model=DetailedAnalysisResponse) 
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get detailed analysis by ID"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return DetailedAnalysisResponse(
        id=analysis.id,
        summary=analysis.summary,
        full_analysis=analysis.changes_data.get("full_analysis", ""),
        risk_level=analysis.risk_level,
        change_type=analysis.changes_data.get("change_type", "other"),
        files_changed=analysis.files_changed,
        lines_added=analysis.lines_added,
        lines_removed=analysis.lines_removed,
        commit_hash=analysis.commit_hash,
        commit_message=analysis.changes_data.get("commit_message", ""),
        author=analysis.changes_data.get("author", ""),
        repository_name=analysis.repository.repo_name,
        created_at=analysis.created_at,
        changes_data=analysis.changes_data
    )

@router.post("/pr/quick", response_model=QuickPRAnalysisResponse)
async def quick_pr_analysis(request: QuickPRAnalysisRequest, db: Session = Depends(get_db)):
    """Quick PR analysis without saving to database"""
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=401, detail="No authenticated user found")
    
    try:
        # Get PR files from GitHub
        pr_data = await github_service.get_pull_request_files(user, request.repo_full_name, request.pr_number)
        
        # Analyze with Gemini AI
        analysis_result = await gemini_service.analyze_pull_request(pr_data)
        
        return QuickPRAnalysisResponse(
            pr_number=analysis_result["pr_number"],
            title=analysis_result["pr_title"],
            summary=analysis_result["summary"],
            risk_level=analysis_result["risk_level"],
            change_type=analysis_result["change_type"],
            files_changed=analysis_result["files_changed"],
            lines_added=analysis_result["lines_added"],
            lines_removed=analysis_result["lines_removed"],
            impact_areas=["Multi-document features", "Backend APIs", "Frontend UI"],
            security_concerns=["Data validation", "File upload handling"],
            recommendations=analysis_result["recommendations"],
            overall_score=analysis_result["overall_score"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PR analysis failed: {str(e)}")

@router.post("/pr/", response_model=PRAnalysisResponse)
async def create_pr_analysis(analysis_request: PRAnalysisRequest, db: Session = Depends(get_db)):
    """Create and save PR analysis to database"""
    repository = db.query(Repository).filter(Repository.id == analysis_request.repository_id).first()
    if not repository:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    user = db.query(User).filter(User.id == repository.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Repository owner not found")
    
    try:
        # Get PR data from GitHub
        pr_data = await github_service.get_pull_request_files(user, repository.repo_name, analysis_request.pr_number)
        
        # Analyze with Gemini AI
        analysis_result = await gemini_service.analyze_pull_request(pr_data)
        
        # Save to database
        pr_analysis = PRAnalysis(
            repository_id=analysis_request.repository_id,
            pr_number=analysis_request.pr_number,
            summary=analysis_result["summary"],
            full_analysis=analysis_result["full_analysis"],
            risk_level=analysis_result["risk_level"],
            change_type=analysis_result["change_type"],
            files_changed=analysis_result["files_changed"],
            lines_added=analysis_result["lines_added"],
            lines_removed=analysis_result["lines_removed"],
            overall_score=analysis_result["overall_score"],
            analysis_data=analysis_result
        )
        
        db.add(pr_analysis)
        db.commit()
        db.refresh(pr_analysis)
        
        return PRAnalysisResponse(
            id=pr_analysis.id,
            repository_id=pr_analysis.repository_id,
            pull_request_id=pr_analysis.pull_request_id,
            pr_number=pr_analysis.pr_number,
            summary=pr_analysis.summary,
            full_analysis=pr_analysis.full_analysis,
            risk_level=pr_analysis.risk_level,
            change_type=pr_analysis.change_type,
            files_changed=pr_analysis.files_changed,
            lines_added=pr_analysis.lines_added,
            lines_removed=pr_analysis.lines_removed,
            security_issues=[],
            recommendations=analysis_result["recommendations"],
            created_at=pr_analysis.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PR analysis creation failed: {str(e)}")

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Delete an analysis"""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    db.delete(analysis)
    db.commit()
    
    return {"message": "Analysis deleted successfully"}

@router.get("/compare/{analysis_id1}/{analysis_id2}")
async def compare_analyses(analysis_id1: int, analysis_id2: int, db: Session = Depends(get_db)):
    """Compare two analyses"""
    analysis1 = db.query(Analysis).filter(Analysis.id == analysis_id1).first()
    analysis2 = db.query(Analysis).filter(Analysis.id == analysis_id2).first()
    
    if not analysis1 or not analysis2:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "comparison": {
            "maintainability_change": analysis2.maintainability_score - analysis1.maintainability_score,
            "security_change": analysis2.security_score - analysis1.security_score,
            "performance_change": analysis2.performance_score - analysis1.performance_score,
            "complexity_change": analysis2.dependency_complexity - analysis1.dependency_complexity,
            "improvement_trend": "positive" if analysis2.maintainability_score > analysis1.maintainability_score else "negative"
        },
        "analysis1": {"id": analysis1.id, "commit": analysis1.commit_hash, "created": analysis1.created_at},
        "analysis2": {"id": analysis2.id, "commit": analysis2.commit_hash, "created": analysis2.created_at}
    }