"""Launch the Flask companion web app."""
import sys, os

_root = os.path.dirname(os.path.abspath(__file__))

# pythonw has no console — redirect stdout/stderr to a log file
_log_dir = os.path.join(_root, "logs")
os.makedirs(_log_dir, exist_ok=True)
_log = open(os.path.join(_log_dir, "companion.log"), "a", buffering=1)
if sys.stdout is None:
    sys.stdout = _log
if sys.stderr is None:
    sys.stderr = _log

sys.path.insert(0, _root)

from config import COMPANION_HOST, COMPANION_PORT, TMDB_API_KEY
from companion.app import app

if __name__ == "__main__":
    if not TMDB_API_KEY:
        print()
        print("=" * 60)
        print("  WARNING: TMDB_API_KEY not set in config.py")
        print("  Titles will import as raw tt-IDs with no names")
        print("  or posters until you add a key.")
        print()
        print('  Free key: https://www.themoviedb.org/settings/api')
        print('  Then in config.py set TMDB_API_KEY = your_key_here')
        print("=" * 60)
        print()
    # threaded=True lets Flask serve poll requests while background
    # import threads are running (required for the waiting page).
    app.run(host=COMPANION_HOST, port=COMPANION_PORT, debug=False, threaded=True)
