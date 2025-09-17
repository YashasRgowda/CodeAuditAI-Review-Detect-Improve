import re
from typing import Dict, List, Any

class SecurityScanner:
    def __init__(self):
        self.patterns = {
            'python': {
                'critical': [
                    (r'eval\s*\(', 'Dangerous eval() usage'),
                    (r'exec\s*\(', 'Dangerous exec() usage'),
                    (r'pickle\.loads?\s*\(', 'Unsafe pickle deserialization'),
                    (r'subprocess\..*shell\s*=\s*True', 'Shell injection risk')
                ],
                'high': [
                    (r'os\.system\s*\(', 'OS command execution'),
                    (r'__import__\s*\(', 'Dynamic import risk'),
                    (r'input\s*\([^)]*\)', 'User input without validation')
                ]
            },
            'javascript': {
                'critical': [
                    (r'eval\s*\(', 'Dangerous eval() usage'),
                    (r'innerHTML\s*=', 'XSS vulnerability risk'),
                    (r'document\.write\s*\(', 'XSS vulnerability risk')
                ],
                'high': [
                    (r'setTimeout\s*\([\'"][^\'"]*[\'"]', 'String-based setTimeout'),
                    (r'setInterval\s*\([\'"][^\'"]*[\'"]', 'String-based setInterval')
                ]
            }
        }
    
    def scan_content(self, content: str, filename: str) -> Dict[str, Any]:
        language = self._detect_language(filename)
        issues = {'critical': [], 'high': [], 'medium': [], 'low': []}
        
        if language in self.patterns:
            for severity, patterns in self.patterns[language].items():
                for pattern, description in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        issues[severity].append({'pattern': pattern, 'description': description, 'file': filename})
        
        return {
            'filename': filename,
            'language': language,
            'security_issues': issues,
            'risk_score': self._calculate_risk_score(issues)
        }
    
    def scan_multiple_files(self, files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        all_issues = []
        total_risk = 0
        
        for file_data in files_data:
            if file_data.get('content'):
                scan_result = self.scan_content(file_data['content'], file_data['filename'])
                all_issues.append(scan_result)
                total_risk += scan_result['risk_score']
        
        return {
            'file_scans': all_issues,
            'overall_risk_score': total_risk,
            'critical_issues_count': sum(len(scan['security_issues']['critical']) for scan in all_issues),
            'high_issues_count': sum(len(scan['security_issues']['high']) for scan in all_issues),
            'recommendations': self._generate_security_recommendations(all_issues)
        }
    
    def _detect_language(self, filename: str) -> str:
        if filename.endswith(('.py',)): return 'python'
        if filename.endswith(('.js', '.jsx', '.ts', '.tsx')): return 'javascript'
        return 'unknown'
    
    def _calculate_risk_score(self, issues: Dict) -> int:
        return len(issues['critical']) * 10 + len(issues['high']) * 5 + len(issues['medium']) * 2 + len(issues['low'])
    
    def _generate_security_recommendations(self, scans: List[Dict]) -> List[str]:
        recommendations = []
        has_critical = any(scan['security_issues']['critical'] for scan in scans)
        has_high = any(scan['security_issues']['high'] for scan in scans)
        
        if has_critical:
            recommendations.append("URGENT: Address critical security vulnerabilities immediately")
        if has_high:
            recommendations.append("Review and fix high-risk security patterns")
        
        return recommendations

security_scanner = SecurityScanner()