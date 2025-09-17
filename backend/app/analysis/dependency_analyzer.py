from typing import Dict, List, Any, Set
import re
from pathlib import Path

class DependencyAnalyzer:
    def __init__(self):
        self.import_patterns = {
            'python': [
                r'^import\s+(\w+)',
                r'^from\s+(\w+)\s+import',
                r'^from\s+\.(\w+)\s+import'
            ],
            'javascript': [
                r'import.*from\s+[\'"]([^\'"]+)[\'"]',
                r'require\([\'"]([^\'"]+)[\'"]\)',
                r'import\s+[\'"]([^\'"]+)[\'"]'
            ]
        }
    
    def analyze_dependencies(self, files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze dependencies across multiple files"""
        dependencies = {}
        file_connections = []
        
        for file_data in files_data:
            filename = file_data.get('filename', '')
            content = file_data.get('content', '')
            
            if content:
                file_deps = self._extract_file_dependencies(content, filename)
                dependencies[filename] = file_deps
                
                # Find connections between files
                for other_file in files_data:
                    if other_file['filename'] != filename:
                        connection = self._find_connection(file_data, other_file)
                        if connection:
                            file_connections.append(connection)
        
        return {
            'file_dependencies': dependencies,
            'cross_file_connections': file_connections,
            'dependency_summary': self._create_dependency_summary(dependencies),
            'risk_analysis': self._analyze_dependency_risks(dependencies, file_connections)
        }
    
    def _extract_file_dependencies(self, content: str, filename: str) -> Dict[str, Any]:
        """Extract dependencies from a single file"""
        language = self._detect_language(filename)
        imports = []
        
        if language in self.import_patterns:
            for pattern in self.import_patterns[language]:
                matches = re.findall(pattern, content, re.MULTILINE)
                imports.extend(matches)
        
        return {
            'language': language,
            'imports': list(set(imports)),
            'import_count': len(set(imports)),
            'external_dependencies': [imp for imp in imports if not imp.startswith('.')],
            'internal_dependencies': [imp for imp in imports if imp.startswith('.')]
        }
    
    def _detect_language(self, filename: str) -> str:
        """Detect programming language from filename"""
        ext = Path(filename).suffix.lower()
        lang_map = {'.py': 'python', '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript'}
        return lang_map.get(ext, 'unknown')
    
    def _find_connection(self, file1: Dict, file2: Dict) -> Dict[str, Any]:
        """Find if two files are connected"""
        # Simple connection detection
        content1 = file1.get('content', '')
        filename2 = Path(file2['filename']).stem
        
        if filename2 in content1:
            return {
                'from_file': file1['filename'],
                'to_file': file2['filename'],
                'connection_type': 'import_reference',
                'strength': 'direct'
            }
        return None
    
    def _create_dependency_summary(self, dependencies: Dict) -> Dict[str, Any]:
        """Create summary of all dependencies"""
        total_imports = sum(deps['import_count'] for deps in dependencies.values())
        external_deps = set()
        internal_deps = set()
        
        for deps in dependencies.values():
            external_deps.update(deps['external_dependencies'])
            internal_deps.update(deps['internal_dependencies'])
        
        return {
            'total_files_analyzed': len(dependencies),
            'total_imports': total_imports,
            'unique_external_dependencies': len(external_deps),
            'unique_internal_dependencies': len(internal_deps),
            'most_imported_external': list(external_deps)[:5],
            'languages_detected': list(set(deps['language'] for deps in dependencies.values()))
        }
    
    def _analyze_dependency_risks(self, dependencies: Dict, connections: List) -> List[str]:
        """Analyze potential risks in dependencies"""
        risks = []
        
        # Check for circular dependencies
        if len(connections) > len(dependencies):
            risks.append("Potential circular dependencies detected")
        
        # Check for high coupling
        high_import_files = [f for f, deps in dependencies.items() if deps['import_count'] > 10]
        if high_import_files:
            risks.append(f"High coupling detected in: {', '.join(high_import_files)}")
        
        return risks

# Global instance
dependency_analyzer = DependencyAnalyzer()