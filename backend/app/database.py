import sqlite3

DB_NAME = "video.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            object TEXT,
            time REAL
        )
    """)

    conn.commit()
    conn.close()


def save_detections(detections):
    conn = get_connection()
    cursor = conn.cursor()

    for d in detections:
        cursor.execute(
            "INSERT INTO detections (object, time) VALUES (?, ?)",
            (d["object"], d["time"])
        )

    conn.commit()
    conn.close()

def search_object(object_name):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT object, time FROM detections WHERE object = ?",
        (object_name,)
    )

    results = cursor.fetchall()
    conn.close()

    return [
        {"object": row[0], "time": row[1]}
        for row in results
    ]
