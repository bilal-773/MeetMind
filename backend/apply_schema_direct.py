"""
Apply MeetMind schema to Supabase.
Run this with your Supabase DB password.

Usage:
  python apply_schema_direct.py <your-db-password>

Get DB password from:
  https://supabase.com/dashboard/project/vleiigdzvvyqszhiqwci/settings/database
"""
import sys
import psycopg2

PROJECT_REF = 'vleiigdzvvyqszhiqwci'

SCHEMA_SQL = open('schema.sql').read()


def apply_schema(password: str):
    # Supabase connection pooler (transaction mode, port 6543)
    conn_strings = [
        f"host=aws-0-ap-southeast-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.{PROJECT_REF} password={password} sslmode=require",
        f"host=aws-0-ap-southeast-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.{PROJECT_REF} password={password} sslmode=require",
    ]

    for conn_str in conn_strings:
        try:
            print(f"Connecting via: {conn_str[:60]}...")
            conn = psycopg2.connect(conn_str)
            conn.autocommit = True
            cur = conn.cursor()
            
            print("Applying schema...")
            cur.execute(SCHEMA_SQL)
            
            cur.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tables = [r[0] for r in cur.fetchall()]
            print(f"SUCCESS! Tables created: {tables}")
            
            cur.close()
            conn.close()
            return True
        except Exception as e:
            print(f"Failed: {e}")
    
    return False


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    password = sys.argv[1]
    success = apply_schema(password)
    sys.exit(0 if success else 1)
