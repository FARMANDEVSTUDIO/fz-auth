"""
FZ Auth — Python Client Example
Usage:
  1. Create an app in the FZ Auth panel and copy app_id + secret
  2. Generate a license key in the panel
  3. Set the constants below and run: python examples/client-example.py
"""

import requests
import platform
import hashlib
import sys

BASE = "http://localhost:3001"

# ── Replace these with your real values from the panel ──────────────
APP_ID     = "YOUR_APP_ID_HERE"
APP_SECRET = "YOUR_APP_SECRET_HERE"
LICENSE_KEY = "YOUR_LICENSE_KEY_HERE"
# ────────────────────────────────────────────────────────────────────


def get_hwid():
    raw = f"{platform.node()}-{platform.system()}-{platform.machine()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def api(endpoint, extra=None):
    body = {"app_id": APP_ID, "secret": APP_SECRET}
    if extra:
        body.update(extra)
    r = requests.post(f"{BASE}/api/v1/{endpoint}", json=body, timeout=10)
    return r.json()


def main():
    print("FZ Auth — Python Client\n")
    hwid = get_hwid()
    print(f"HWID: {hwid}\n")

    # 1) Init
    print("1) Initializing...")
    data = api("init", {"version": "1.0"})
    if not data.get("success"):
        print(f"   FAILED: {data.get('message')}")
        sys.exit(1)
    print(f"   App: {data['app_name']} v{data['version']}")
    print(f"   Users: {data['user_count']} | Sessions: {data['active_sessions']}\n")

    # 2) Login
    username = input("   Username: ").strip()
    password = input("   Password: ").strip()

    print(f"\n2) Logging in as '{username}'...")
    data = api("login", {"username": username, "password": password, "hwid": hwid})
    if not data.get("success"):
        print(f"   FAILED: {data.get('message')}")
        sys.exit(1)
    token = data["token"]
    print(f"   Logged in! Expiry: {data.get('expiry', 'lifetime')}\n")

    # 3) Check session
    print("3) Validating session...")
    data = api("check", {"token": token})
    if not data.get("success"):
        print(f"   FAILED: {data.get('message')}")
        sys.exit(1)
    print(f"   Session valid for: {data['username']}\n")

    # 4) Fetch variables
    print("4) Fetching variables...")
    data = api("var")
    if data.get("success"):
        for k, v in (data.get("variables") or {}).items():
            print(f"   {k} = {v}")
        if not data.get("variables"):
            print("   (no variables set)")
    print()

    print("Done! Authentication successful.")


if __name__ == "__main__":
    main()
