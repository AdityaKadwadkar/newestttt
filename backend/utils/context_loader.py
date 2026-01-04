import json
import os
from pyld import jsonld

class ContextLoader:
    def __init__(self):
        self.contexts = {}
        self.load_cache()

    def load_cache(self):
        """Load local context files into memory"""
        base_path = os.path.dirname(os.path.abspath(__file__))
        context_dir = os.path.join(base_path, 'contexts')
        
        # Mapping URLs to local filenames
        mapping = {
            "https://www.w3.org/2018/credentials/v1": "credentials-v1.json",
            "https://schema.org/": "schema.json",
            "https://w3id.org/security/suites/ed25519-2020/v1": "ed25519-2020.json"
        }

        for url, filename in mapping.items():
            path = os.path.join(context_dir, filename)
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    try:
                        self.contexts[url] = json.load(f)
                    except json.JSONDecodeError:
                        print(f"Error decoding context: {filename}")
            else:
                print(f"Warning: Context file not found: {path} for {url}")

    def document_loader(self, url, options=None):
        """pyld compatible document loader"""
        if url in self.contexts:
            return {
                'contextUrl': None,
                'documentUrl': url,
                'document': self.contexts[url]
            }
        
        # For strict compliance, we could raise an error here.
        # But if there are nested contexts (like in schema.org), we might need to fetch them?
        # Ideally, we block everything else.
        raise Exception(f"External context loading not allowed for strict compliance. Missing: {url}")

# Global instance
_loader = ContextLoader()

def get_loader():
    return _loader.document_loader
