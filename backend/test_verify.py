import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.core.auth import get_supabase

def test():
    token = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijk5OTA5ZmFmLTBhYmEtNGMwZi04MjNkLTY1OTg1ZjhiOWFmZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3pkeHhnamR6bHhzandrcnhiZWVyLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiZWI2MDU4Yi03MjZkLTRhZjUtOTRkZi0wZTAyNjQ2ZjJiNjYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc5OTY5NTcxLCJpYXQiOjE3Nzk5NjU5NzEsImVtYWlsIjoidGVzdF91c2VyX2FudGlncmF2aXR5QGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InRlc3RfdXNlcl9hbnRpZ3Jhdml0eUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJiZWI2MDU4Yi03MjZkLTRhZjUtOTRkZi0wZTAyNjQ2ZjJiNjYifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc3OTk2NTk3MX1dLCJzZXNzaW9uX2lkIjoiYjgzOWJmNWEtZWY4Ny00OGUyLWJlOTUtYjM5YjViMjFmOTNjIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.FGwwkG2EJyRFUZ9JeVKx2Z5W2vieSY4O8dhGYHTXLGbZYJ2ZIlaf_cDXn8p9igv79szdhHe9hoYiLwEycgtxhA"
    supabase = get_supabase()
    try:
        res = supabase.auth.get_user(token)
        print("Verification success!")
        print("User details:", res.user.id, res.user.email)
    except Exception as e:
        print("Verification failed:", e)

if __name__ == "__main__":
    test()
