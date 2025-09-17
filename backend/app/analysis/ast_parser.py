import ast
import os
from typing import Dict, List, Any, Optional
from pathlib import Path

class ASTParser:
    """Parse and analyze code structure using Abstract Syntax Trees"""
    
    def __init__(self):
        self.supported_languages = {
            '.py': 'python',
            '.js': 'javascript', 
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript'
        }
    
    def detect_language(self, filename: str) -> Optional[str]:
        """Detect programming language from file extension"""
        file_extension = Path(filename).suffix.lower()
        return self.supported_languages.get(file_extension)
    
    def parse_python_file(self, file_content: str, filename: str) -> Dict[str, Any]:
        """Parse Python file and extract code metrics"""
        try:
            tree = ast.parse(file_content)
            
            analysis = {
                'filename': filename,
                'language': 'python',
                'functions': self._count_python_functions(tree),
                'classes': self._count_python_classes(tree), 
                'imports': self._count_python_imports(tree),
                'complexity_score': self._calculate_python_complexity(tree),
                'lines_of_code': len(file_content.split('\n')),
                'security_patterns': self._find_python_security_patterns(file_content),
                'code_quality_issues': self._find_python_quality_issues(tree)
            }
            
            return analysis
            
        except SyntaxError as e:
            return {
                'filename': filename,
                'language': 'python',
                'error': f"Syntax error: {str(e)}",
                'parseable': False
            }
        except Exception as e:
            return {
                'filename': filename, 
                'language': 'python',
                'error': f"Parse error: {str(e)}",
                'parseable': False
            }
    
    def parse_javascript_file(self, file_content: str, filename: str) -> Dict[str, Any]:
        """Parse JavaScript/TypeScript file (basic analysis)"""
        # For now, we'll do basic pattern matching
        # In the future, we can add proper JS AST parsing
        
        lines = file_content.split('\n')
        
        # Count functions (basic regex-like approach)
        function_count = 0
        class_count = 0
        import_count = 0
        
        for line in lines:
            line = line.strip()
            if any(pattern in line for pattern in ['function ', 'const ', 'let ', 'var ']) and '(' in line and ')' in line:
                function_count += 1
            if line.startswith('class '):
                class_count += 1
            if any(pattern in line for pattern in ['import ', 'require(', 'from ']):
                import_count += 1
        
        return {
            'filename': filename,
            'language': 'javascript',
            'functions': function_count,
            'classes': class_count,
            'imports': import_count,
            'complexity_score': self._estimate_js_complexity(file_content),
            'lines_of_code': len(lines),
            'security_patterns': self._find_js_security_patterns(file_content),
            'code_quality_issues': []
        }
    
    def analyze_file(self, file_content: str, filename: str) -> Dict[str, Any]:
        """Main method to analyze any supported file"""
        language = self.detect_language(filename)
        
        if not language:
            return {
                'filename': filename,
                'language': 'unknown',
                'supported': False,
                'error': 'Unsupported file type'
            }
        
        if language == 'python':
            return self.parse_python_file(file_content, filename)
        elif language in ['javascript', 'typescript']:
            return self.parse_javascript_file(file_content, filename)
        else:
            return {
                'filename': filename,
                'language': language,
                'supported': False,
                'error': 'Parser not implemented for this language'
            }
    
    def analyze_multiple_files(self, files_data: List[Dict[str, str]]) -> Dict[str, Any]:
        """Analyze multiple files and provide summary"""
        results = []
        total_complexity = 0
        total_functions = 0
        total_classes = 0
        languages_used = set()
        
        for file_data in files_data:
            filename = file_data.get('filename', '')
            content = file_data.get('content', '')
            
            if content:  # Only analyze if we have content
                analysis = self.analyze_file(content, filename)
                results.append(analysis)
                
                if not analysis.get('error'):
                    total_complexity += analysis.get('complexity_score', 0)
                    total_functions += analysis.get('functions', 0) 
                    total_classes += analysis.get('classes', 0)
                    languages_used.add(analysis.get('language', 'unknown'))
        
        return {
            'file_analyses': results,
            'summary': {
                'total_files_analyzed': len(results),
                'total_functions': total_functions,
                'total_classes': total_classes,
                'average_complexity': total_complexity / len(results) if results else 0,
                'languages_used': list(languages_used),
                'high_complexity_files': [r for r in results if r.get('complexity_score', 0) > 10]
            }
        }
    
    # Helper methods for Python analysis
    def _count_python_functions(self, tree: ast.AST) -> int:
        """Count function definitions in Python AST"""
        return len([node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)])
    
    def _count_python_classes(self, tree: ast.AST) -> int:
        """Count class definitions in Python AST"""
        return len([node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)])
    
    def _count_python_imports(self, tree: ast.AST) -> int:
        """Count import statements in Python AST"""
        imports = [node for node in ast.walk(tree) if isinstance(node, (ast.Import, ast.ImportFrom))]
        return len(imports)
    
    def _calculate_python_complexity(self, tree: ast.AST) -> int:
        """Calculate cyclomatic complexity for Python code"""
        complexity = 1  # Base complexity
        
        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
        
        return complexity
    
    def _find_python_security_patterns(self, content: str) -> List[str]:
        """Find potential security issues in Python code"""
        security_issues = []
        
        dangerous_patterns = [
            ('eval(', 'Use of eval() can be dangerous'),
            ('exec(', 'Use of exec() can be dangerous'),
            ('__import__(', 'Dynamic imports can be risky'),
            ('subprocess.', 'Subprocess calls need validation'),
            ('os.system(', 'os.system() is vulnerable to injection'),
            ('pickle.loads(', 'Pickle deserialization can be dangerous')
        ]
        
        for pattern, warning in dangerous_patterns:
            if pattern in content:
                security_issues.append(warning)
        
        return security_issues
    
    def _find_python_quality_issues(self, tree: ast.AST) -> List[str]:
        """Find code quality issues in Python AST"""
        issues = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Check for very long functions
                if hasattr(node, 'lineno') and hasattr(node, 'end_lineno'):
                    if node.end_lineno and node.lineno:
                        function_length = node.end_lineno - node.lineno
                        if function_length > 50:
                            issues.append(f"Function '{node.name}' is very long ({function_length} lines)")
                
                # Check for too many parameters
                if len(node.args.args) > 5:
                    issues.append(f"Function '{node.name}' has too many parameters ({len(node.args.args)})")
        
        return issues
    
    def _estimate_js_complexity(self, content: str) -> int:
        """Estimate complexity for JavaScript code (basic)"""
        complexity = 1
        
        # Count control flow statements
        complexity_patterns = ['if (', 'while (', 'for (', 'switch (', 'catch (', '&&', '||']
        
        for pattern in complexity_patterns:
            complexity += content.count(pattern)
        
        return min(complexity, 20)  # Cap at 20 for basic analysis
    
    def _find_js_security_patterns(self, content: str) -> List[str]:
        """Find potential security issues in JavaScript code"""
        security_issues = []
        
        dangerous_patterns = [
            ('eval(', 'Use of eval() can be dangerous'),
            ('innerHTML', 'innerHTML can lead to XSS vulnerabilities'),
            ('document.write(', 'document.write() can be unsafe'),
            ('setTimeout(', 'setTimeout with string parameter can be risky'),
            ('setInterval(', 'setInterval with string parameter can be risky')
        ]
        
        for pattern, warning in dangerous_patterns:
            if pattern in content:
                security_issues.append(warning)
        
        return security_issues
    
    def calculate_advanced_metrics(self, file_content: str, filename: str) -> Dict[str, Any]:
        """Calculate advanced complexity metrics"""
        analysis = self.analyze_file(file_content, filename)
        
        # Add maintainability index calculation
        lines = len(file_content.split('\n'))
        complexity = analysis.get('complexity_score', 1)
        
        # Simple maintainability index (0-100, higher is better)
        maintainability_index = max(0, 100 - complexity * 2 - lines // 10)
        
        analysis.update({
            'maintainability_index': maintainability_index,
            'technical_debt_ratio': min(100, complexity * 5),
            'code_smell_count': len(analysis.get('code_quality_issues', [])),
            'refactoring_priority': 'high' if maintainability_index < 30 else 'medium' if maintainability_index < 70 else 'low'
        })
        
        return analysis

# Create global instance
ast_parser = ASTParser()