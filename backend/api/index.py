import sys
import os
import json
import traceback

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from server import app
    handler = app
except Exception as e:
    tb = traceback.format_exc()
    
    def handler(environ, start_response):
        status = "200 OK"
        headers = [("Content-Type", "application/json")]
        body = json.dumps({"error": str(e), "traceback": tb})
        start_response(status, headers)
        return [body.encode("utf-8")]
