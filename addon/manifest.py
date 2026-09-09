"""
Manifest builder.  Generates a per-profile manifest dict.
"""

from config import ADDON_PUBLIC_URL


def build_manifest(profile_id: str, profile_name: str, user_lists: list[dict]) -> dict:
    """
    Construct the Stremio manifest for this profile.
    user_lists: list of {"id": str, "name": str} dicts.
    """
    # Base catalogs every profile gets
    catalogs = [
        {
            "type": "movie",
            "id": "watchlist",
            "name": "📚 My Watchlist",
            "extra": [{"name": "skip"}],
        },
        {
            "type": "series",
            "id": "watchlist",
            "name": "📚 My Watchlist (Series)",
            "extra": [{"name": "skip"}],
        },
        {
            "type": "movie",
            "id": "watch_history",
            "name": "🕓 Watch History",
            "extra": [{"name": "skip"}],
        },
        {
            "type": "movie",
            "id": "ratings",
            "name": "⭐ My Ratings",
            "extra": [{"name": "skip"}],
        },
        # Director / actor search catalogs
        {
            "type": "movie",
            "id": "director_search",
            "name": "🎬 Search by Director",
            "extra": [{"name": "search", "isRequired": True}],
        },
        {
            "type": "movie",
            "id": "actor_search",
            "name": "🎭 Search by Actor",
            "extra": [{"name": "search", "isRequired": True}],
        },
    ]

    # One catalog entry per user-created list
    for lst in user_lists:
        catalogs.append(
            {
                "type": "movie",
                "id": f"list_{lst['id']}",
                "name": f"📋 {lst['name']}",
                "extra": [{"name": "skip"}],
            }
        )

    return {
        "id": f"community.stremio.custom.{profile_id}",
        "version": "1.0.0",
        "name": f"My Library · {profile_name}",
        "description": (
            "Personal watchlist, ratings, watch history, and custom lists. "
            f"Managed at {ADDON_PUBLIC_URL.replace('http://', '').replace('https://', '')}"
        ),
        "logo": "",
        "background": "",
        "types": ["movie", "series"],
        "catalogs": catalogs,
        "resources": ["catalog", "stream", "meta"],
        "idPrefixes": ["tt"],
        "behaviorHints": {
            "adult": False,
            "p2p": False,
        },
    }
