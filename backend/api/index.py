import sys
import os
import json

# Add parent directory to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from server import app
    handler = app
except Exception as e:
    import traceback
    def handler(environ, start_response):
        body = json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc(),
            "env": {k: ("***" if "key" in k.lower() or "secret" in k.lower() or "password" in k.lower() else v) for k, v in os.environ.items() if k in ["MONGO_URL", "DB_NAME", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "CORS_ORIGINS"]}
        })
        start_response("200 OK", [("Content-Type", "application/json")])
        return [body.encode()]
