"""Launch the Stremio FastAPI add-on."""
import sys, os

_root = os.path.dirname(os.path.abspath(__file__))

# pythonw has no console — redirect stdout/stderr to a log file
_log_dir = os.path.join(_root, "logs")
os.makedirs(_log_dir, exist_ok=True)
_log = open(os.path.join(_log_dir, "addon.log"), "a", buffering=1)
if sys.stdout is None:
    sys.stdout = _log
if sys.stderr is None:
    sys.stderr = _log

# On Windows, pythonw uses ProactorEventLoop which breaks uvicorn when
# there is no real console.  SelectorEventLoop works fine headlessly.
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.path.insert(0, _root)

import uvicorn
from config import ADDON_HOST, ADDON_PORT

if __name__ == "__main__":
    uvicorn.run(
        "addon.main:app",
        host=ADDON_HOST,
        port=ADDON_PORT,
        reload=False,
        log_level="info",
    )
