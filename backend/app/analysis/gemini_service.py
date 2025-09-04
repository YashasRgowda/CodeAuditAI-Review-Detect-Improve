import google.generativeai as genai
from fastapi import HTTPException
from typing import Dict, Any, List
from app.config import settings

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    async def analyze_code_changes(self, commit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code changes using Gemini AI"""
        try:
            # Create analysis prompt
            prompt = self._create_analysis_prompt(commit_data)
            
            # Generate analysis using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse the response
            analysis_text = response.text
            
            # Extract structured data from the analysis
            analysis_result = self._parse_analysis_response(analysis_text, commit_data)
            
            return analysis_result
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    
    def _create_analysis_prompt(self, commit_data: Dict[str, Any]) -> str:
        """Create a detailed prompt for code change analysis"""
        
        files_info = []
        for file in commit_data.get('files', []):
            file_summary = f"""
File: {file['filename']}
Status: {file['status']}
Changes: +{file['additions']} -{file['deletions']}
"""
            if file.get('patch'):
                file_summary += f"Code diff:\n{file['patch'][:500]}...\n"
            
            files_info.append(file_summary)
        
        files_text = "\n".join(files_info)
        
        prompt = f"""
You are an expert code reviewer and software engineer. Please analyze the following code changes and provide a comprehensive review.

COMMIT INFORMATION:
- Commit SHA: {commit_data['sha']}
- Message: {commit_data['message']}
- Author: {commit_data['author']}
- Date: {commit_data['date']}
- Total Changes: {commit_data['stats']['total']} lines
- Additions: +{commit_data['stats']['additions']}
- Deletions: -{commit_data['stats']['deletions']}

FILES CHANGED:
{files_text}

Please provide your analysis in the following structured format:

SUMMARY:
[2-3 sentence overview of what this commit does]

RISK LEVEL: [LOW/MEDIUM/HIGH]

IMPACT AREAS:
[List the main areas of the codebase affected]

CODE QUALITY:
[Assessment of code quality, potential issues, best practices]

SECURITY CONSIDERATIONS:
[Any security implications or concerns]

RECOMMENDATIONS:
[Specific suggestions for improvement or areas to watch]

CHANGE TYPE:
[bug_fix/feature/refactoring/documentation/configuration/other]

Keep your analysis concise but thorough, focusing on practical insights for code review.
"""
        return prompt
    
    def _parse_analysis_response(self, analysis_text: str, commit_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI response into structured data"""
        
        # Extract risk level
        risk_level = "medium"  # default
        if "RISK LEVEL: LOW" in analysis_text.upper():
            risk_level = "low"
        elif "RISK LEVEL: HIGH" in analysis_text.upper():
            risk_level = "high"
        
        # Extract change type
        change_type = "other"  # default
        change_types = ["bug_fix", "feature", "refactoring", "documentation", "configuration"]
        for ct in change_types:
            if ct.replace("_", " ").upper() in analysis_text.upper():
                change_type = ct
                break
        
        # Extract summary (first few sentences)
        lines = analysis_text.split('\n')
        summary_lines = []
        in_summary = False
        
        for line in lines:
            if "SUMMARY:" in line.upper():
                in_summary = True
                if line.strip() != "SUMMARY:":
                    summary_lines.append(line.split(":", 1)[1].strip())
            elif in_summary and line.strip():
                if any(keyword in line.upper() for keyword in ["RISK LEVEL:", "IMPACT AREAS:", "CODE QUALITY:"]):
                    break
                summary_lines.append(line.strip())
        
        summary = " ".join(summary_lines) if summary_lines else "Code changes analyzed"
        
        return {
            "summary": summary,
            "full_analysis": analysis_text,
            "risk_level": risk_level,
            "change_type": change_type,
            "files_changed": len(commit_data.get('files', [])),
            "lines_added": commit_data['stats']['additions'],
            "lines_removed": commit_data['stats']['deletions'],
            "commit_hash": commit_data['sha'],
            "commit_message": commit_data['message'],
            "author": commit_data['author'],
            "analysis_date": commit_data['date']
        }

    async def analyze_pull_request(self, pr_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze pull request changes using Gemini AI"""
        try:
            # Create PR analysis prompt
            prompt = self._create_pr_analysis_prompt(pr_data)
            
            # Generate analysis using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse the response
            analysis_text = response.text
            
            # Extract structured data from the analysis
            analysis_result = self._parse_pr_analysis_response(analysis_text, pr_data)
            
            return analysis_result
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PR AI analysis failed: {str(e)}")
    
    def _create_pr_analysis_prompt(self, pr_data: Dict[str, Any]) -> str:
        """Create a detailed prompt for PR analysis"""
        
        files_info = []
        for file in pr_data.get('files', [])[:20]:  # Limit to first 20 files
            file_summary = f"""
File: {file['filename']}
Status: {file['status']}
Changes: +{file['additions']} -{file['deletions']}
"""
            if file.get('patch') and len(file['patch']) < 1000:
                file_summary += f"Code diff:\n{file['patch'][:500]}...\n"
            
            files_info.append(file_summary)
        
        files_text = "\n".join(files_info)
        
        prompt = f"""
You are a senior software architect and security expert reviewing a pull request. Provide a comprehensive technical review.

PULL REQUEST INFORMATION:
- PR #{pr_data['pr_number']}: {pr_data['title']}
- Author: {pr_data['author']}
- Branches: {pr_data['head_branch']} → {pr_data['base_branch']}
- Files Changed: {pr_data['stats']['total_files']}
- Total Changes: {pr_data['stats']['total_changes']} lines
- Additions: +{pr_data['stats']['additions']}
- Deletions: -{pr_data['stats']['deletions']}

DESCRIPTION:
{pr_data.get('description', 'No description provided')[:500]}

FILES CHANGED:
{files_text}

Provide analysis in this EXACT format:

SUMMARY:
[2-3 sentence overview of what this PR accomplishes]

RISK LEVEL: [LOW/MEDIUM/HIGH]

CHANGE TYPE: [feature/bug_fix/refactoring/documentation/security/performance/other]

IMPACT AREAS:
[List main system components affected]

SECURITY ANALYSIS:
[Security implications, vulnerabilities, or improvements]

CODE QUALITY:
[Assessment of code structure, patterns, and maintainability]

PERFORMANCE IMPACT:
[Potential performance effects]

RECOMMENDATIONS:
[Specific actionable suggestions for improvement]

OVERALL SCORE: [1-10 where 10 is excellent]

Focus on technical depth, security implications, and actionable insights for the development team.
"""
        return prompt
    
    def _parse_pr_analysis_response(self, analysis_text: str, pr_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI response into structured PR analysis data"""
        
        # Extract risk level
        risk_level = "medium"
        if "RISK LEVEL: LOW" in analysis_text.upper():
            risk_level = "low"
        elif "RISK LEVEL: HIGH" in analysis_text.upper():
            risk_level = "high"
        
        # Extract change type
        change_type = "other"
        change_types = ["feature", "bug_fix", "refactoring", "documentation", "security", "performance"]
        for ct in change_types:
            if f"CHANGE TYPE: {ct.upper()}" in analysis_text.upper():
                change_type = ct
                break
        
        # Extract overall score
        overall_score = 7  # default
        import re
        score_match = re.search(r'OVERALL SCORE:\s*(\d+)', analysis_text.upper())
        if score_match:
            overall_score = min(10, max(1, int(score_match.group(1))))
        
        # Extract summary
        lines = analysis_text.split('\n')
        summary_lines = []
        in_summary = False
        
        for line in lines:
            if "SUMMARY:" in line.upper():
                in_summary = True
                if line.strip() != "SUMMARY:":
                    summary_lines.append(line.split(":", 1)[1].strip())
            elif in_summary and line.strip():
                if any(keyword in line.upper() for keyword in ["RISK LEVEL:", "CHANGE TYPE:", "IMPACT AREAS:"]):
                    break
                summary_lines.append(line.strip())
        
        summary = " ".join(summary_lines) if summary_lines else f"Analysis of PR #{pr_data['pr_number']}: {pr_data['title']}"
        
        # Extract recommendations
        recommendations = []
        in_recommendations = False
        for line in lines:
            if "RECOMMENDATIONS:" in line.upper():
                in_recommendations = True
                continue
            elif in_recommendations and line.strip():
                if "OVERALL SCORE:" in line.upper():
                    break
                if line.strip().startswith("-") or line.strip().startswith("•"):
                    recommendations.append(line.strip()[1:].strip())
                elif line.strip():
                    recommendations.append(line.strip())
        
        return {
            "summary": summary,
            "full_analysis": analysis_text,
            "risk_level": risk_level,
            "change_type": change_type,
            "files_changed": pr_data['stats']['total_files'],
            "lines_added": pr_data['stats']['additions'],
            "lines_removed": pr_data['stats']['deletions'],
            "overall_score": overall_score,
            "recommendations": recommendations[:5],  # Limit to top 5
            "pr_number": pr_data['pr_number'],
            "pr_title": pr_data['title'],
            "author": pr_data['author']
        }
    
# Create global instance  
gemini_service = GeminiService()