import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Use test db bounds dynamically locking states seamlessly safely overwriting locally testing explicitly
os.environ["db_json_path"] = "test_db.json"
