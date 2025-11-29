import pymysql
from decouple import config

# Connect without DB name to create it
conn = pymysql.connect(
    host=config('DB_HOST'),
    user=config('DB_USER'),
    password=config('DB_PASSWORD'),
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:
        db_name = config('DB_NAME')
        print(f"Creating database: {db_name}")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print("Database created successfully")
finally:
    conn.close()
