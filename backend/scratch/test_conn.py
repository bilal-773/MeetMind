import httpx
import time

url = "https://vleiigdzvvyqszhiqwci.supabase.co/auth/v1/health"
print("Starting request to Supabase auth/v1/health...")
start = time.time()
try:
    r = httpx.get(url, timeout=10.0)
    print(f"Status code: {r.status_code}")
    print(f"Response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
print(f"Time elapsed: {time.time() - start:.2f} seconds")
