import psycopg2
from psycopg2.extras import Json


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "dataguard_db",
    "user": "postgres",
    "password": "POSTm08"
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def create_tables():
    connection = get_connection()
    cursor = connection.cursor()

    # 1. Cleaned Data
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cleaned_data (
            id SERIAL PRIMARY KEY,
            source_file VARCHAR(255),
            row_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 2. Error Log
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS error_log (
            id SERIAL PRIMARY KEY,
            source_file VARCHAR(255),
            row_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 3. Cleaning Activity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cleaning_log (
            id SERIAL PRIMARY KEY,
            source_file VARCHAR(255),
            row_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 4. Quality Reports
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quality_reports (
            id SERIAL PRIMARY KEY,
            source_file VARCHAR(255),
            report_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    connection.commit()
    cursor.close()
    connection.close()


if __name__ == "__main__":
    try:
        connection = get_connection()
        print("PostgreSQL connection successful!")
        connection.close()

        create_tables()
        print("DataGuard database tables created successfully!")

    except Exception as e:
        print("Database setup failed:")
        print(e)