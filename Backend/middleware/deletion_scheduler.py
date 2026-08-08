"""
NAUTILUS Banking System — Background Deletion Scheduler
Periodically checks for accounts in 'on-hold' status older than 7 days and permanently deletes them.
"""

import asyncio
from datetime import datetime, timedelta
from db.client import get_supabase_client

# How often to check for expired on-hold accounts (in seconds) - e.g., every 6 hours
SCHEDULER_INTERVAL_SECONDS = 6 * 3600

_scheduler_task: asyncio.Task = None


async def purge_expired_accounts():
    """
    Finds and permanently removes accounts that have been on-hold for more than 7 days.
    """
    sb = get_supabase_client()
    if not sb:
        print("[SCHEDULER] Supabase client unavailable for account purge.")
        return

    cutoff = (datetime.utcnow() - timedelta(days=7)).isoformat()
    tables = ["cpb_database", "eb_database", "sb_database"]

    for table in tables:
        try:
            res = (
                sb.table(table)
                .select("bank_user_id, email, deletion_requested_at")
                .eq("status", "on-hold")
                .lte("deletion_requested_at", cutoff)
                .execute()
            )
            expired_users = res.data or []
            if expired_users:
                print(f"[SCHEDULER] Found {len(expired_users)} expired account(s) in {table} to purge.")
                for user in expired_users:
                    user_id = user["bank_user_id"]
                    sb.table(table).delete().eq("bank_user_id", user_id).execute()
                    print(f"[SCHEDULER] Permanently purged user ID #{user_id} ({user.get('email')}) from {table}.")
        except Exception as e:
            print(f"[SCHEDULER ERROR] Failed to purge expired accounts from {table}: {e}")


async def _scheduler_loop():
    """Continuous background loop running while FastAPI is active."""
    print("[SCHEDULER] Account deletion background scheduler started.")
    # Run an initial check on startup
    await purge_expired_accounts()

    while True:
        try:
            await asyncio.sleep(SCHEDULER_INTERVAL_SECONDS)
            await purge_expired_accounts()
        except asyncio.CancelledError:
            print("[SCHEDULER] Scheduler task cancelled.")
            break
        except Exception as e:
            print(f"[SCHEDULER LOOP EXCEPTION]: {e}")
            await asyncio.sleep(60)


def start_deletion_scheduler():
    """Starts the deletion scheduler background task."""
    global _scheduler_task
    if _scheduler_task is None or _scheduler_task.done():
        _scheduler_task = asyncio.create_task(_scheduler_loop())


def stop_deletion_scheduler():
    """Stops the deletion scheduler background task."""
    global _scheduler_task
    if _scheduler_task and not _scheduler_task.done():
        _scheduler_task.cancel()
