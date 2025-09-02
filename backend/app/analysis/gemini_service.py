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

# Create global instance
gemini_service = GeminiService()