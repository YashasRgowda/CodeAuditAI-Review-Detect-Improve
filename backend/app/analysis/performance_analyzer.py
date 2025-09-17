import re
from typing import Dict, List, Any

class PerformanceAnalyzer:
    def __init__(self):
        self.performance_patterns = {
            'python': [
                (r'for.*in.*range\(len\(', 'Inefficient loop pattern'),
                (r'\.append\s*\(.*\)\s*$', 'List append in loop (consider list comprehension)'),
                (r'time\.sleep\s*\(', 'Blocking sleep operation'),
                (r'\.join\s*\(\s*\[.*for.*in.*\]', 'String join with generator preferred')
            ],
            'javascript': [
                (r'for\s*\(.*\.length.*\)', 'Cache array length in loops'),
                (r'document\.getElementById', 'Consider caching DOM elements'),
                (r'setInterval.*\d+ms', 'High-frequency intervals'),
                (r'\.forEach\s*\(.*=>', 'Consider for-loop for better performance')
            ]
        }
    
    def analyze_performance(self, files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        performance_issues = []
        
        for file_data in files_data:
            if file_data.get('content'):
                issues = self._analyze_file_performance(file_data['content'], file_data['filename'])
                if issues:
                    performance_issues.extend(issues)
        
        return {
            'performance_issues': performance_issues,
            'issue_count': len(performance_issues),
            'performance_score': max(0, 100 - len(performance_issues) * 5),
            'recommendations': self._generate_performance_recommendations(performance_issues)
        }
    
    def _analyze_file_performance(self, content: str, filename: str) -> List[Dict[str, Any]]:
        language = self._detect_language(filename)
        issues = []
        
        if language in self.performance_patterns:
            for pattern, description in self.performance_patterns[language]:
                matches = re.finditer(pattern, content, re.MULTILINE)
                for match in matches:
                    issues.append({
                        'file': filename,
                        'pattern': pattern,
                        'description': description,
                        'line_content': match.group(0)
                    })
        
        return issues
    
    def _detect_language(self, filename: str) -> str:
        if filename.endswith('.py'): return 'python'
        if filename.endswith(('.js', '.jsx', '.ts', '.tsx')): return 'javascript'
        return 'unknown'
    
    def _generate_performance_recommendations(self, issues: List[Dict]) -> List[str]:
        if not issues: return ["No performance issues detected"]
        
        recommendations = ["Review performance patterns in modified files"]
        if len(issues) > 5:
            recommendations.append("Consider performance testing for this change")
        
        return recommendations

performance_analyzer = PerformanceAnalyzer()