from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import pandas as pd
import os
import shutil
import json

from quality_engine import run_quality_checks
from database import get_connection

app = FastAPI(title="DataGuard - Intelligent Data Quality Monitoring System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def make_json_safe(data):
    # Convert Pandas/NumPy/Timestamp values to valid JSON
    if isinstance(data, dict):
        return {key: make_json_safe(value) for key, value in data.items()}

    if isinstance(data, list):
        return [make_json_safe(value) for value in data]

    # Handle Pandas Timestamp
    if isinstance(data, pd.Timestamp):
        return data.isoformat()

    try:
        if pd.isna(data):
            return None
    except (TypeError, ValueError):
        pass

    if hasattr(data, "item"):
        try:
            return data.item()
        except (ValueError, TypeError):
            pass

    # Handle any datetime-like object
    if hasattr(data, "isoformat"):
        try:
            return data.isoformat()
        except Exception:
            pass

    return data


def save_to_postgresql(filename, clean_data, error_data, cleaning_log, report):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        for table in ["cleaned_data", "error_log", "cleaning_log", "quality_reports"]:
            cursor.execute(
                f"DELETE FROM {table} WHERE source_file = %s",
                (filename,)
            )

        for row in clean_data.to_dict(orient="records"):
            cursor.execute(
                "INSERT INTO cleaned_data (source_file, row_data) VALUES (%s, %s)",
                (filename, json.dumps(make_json_safe(row)))
            )

        for row in error_data.to_dict(orient="records"):
            cursor.execute(
                "INSERT INTO error_log (source_file, row_data) VALUES (%s, %s)",
                (filename, json.dumps(make_json_safe(row)))
            )

        for row in cleaning_log.to_dict(orient="records"):
            cursor.execute(
                "INSERT INTO cleaning_log (source_file, row_data) VALUES (%s, %s)",
                (filename, json.dumps(make_json_safe(row)))
            )

        cursor.execute(
            "INSERT INTO quality_reports (source_file, report_data) VALUES (%s, %s)",
            (filename, json.dumps(make_json_safe(report)))
        )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        cursor.close()
        connection.close()


def get_latest_source_file(cursor):
    cursor.execute("""
        SELECT source_file
        FROM quality_reports
        ORDER BY created_at DESC
        LIMIT 1
    """)
    row = cursor.fetchone()
    return row[0] if row else None


@app.get("/")
def home():
    return {"message": "DataGuard API is running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    allowed_extensions = [".csv", ".xlsx"]
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel files are allowed"
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if file_extension == ".csv":
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        report, clean_data, error_data, warning_data, cleaning_log = run_quality_checks(df)

        clean_file = os.path.join(OUTPUT_FOLDER, "cleaned_data.csv")
        clean_data.to_csv(clean_file, index=False)

        error_file = os.path.join(OUTPUT_FOLDER, "error_log.csv")
        error_data.to_csv(error_file, index=False)

        cleaning_file = os.path.join(OUTPUT_FOLDER, "cleaning_log.csv")
        cleaning_log.to_csv(cleaning_file, index=False)

        report_file = os.path.join(OUTPUT_FOLDER, "quality_report.json")
        with open(report_file, "w", encoding="utf-8") as report_output:
            json.dump(jsonable_encoder(report), report_output, indent=2)

        save_to_postgresql(
            filename=file.filename,
            clean_data=clean_data,
            error_data=error_data,
            cleaning_log=cleaning_log,
            report=report
        )

        return {
            "message": "File processed successfully",
            "filename": file.filename,
            "database": "PostgreSQL",
            "quality_report": report,
            "output_files": {
                "cleaned_data": clean_file,
                "error_log": error_file,
                "cleaning_log": cleaning_file,
                "quality_report": report_file
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process file: {str(e)}"
        )


@app.get("/errors")
def get_errors():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        latest_file = get_latest_source_file(cursor)

        if not latest_file:
            return {"total_errors": 0, "errors": []}

        cursor.execute(
            "SELECT row_data FROM error_log WHERE source_file = %s ORDER BY id",
            (latest_file,)
        )

        errors = [row[0] for row in cursor.fetchall()]

        return {
            "total_errors": len(errors),
            "errors": errors
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read error log: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/report")
def get_report():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT report_data
            FROM quality_reports
            ORDER BY created_at DESC
            LIMIT 1
        """)

        row = cursor.fetchone()

        if not row:
            return {
                "message": "No report available yet",
                "quality_report": None
            }

        return row[0]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read quality report: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/cleaned-data")
def get_cleaned_data():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        latest_file = get_latest_source_file(cursor)

        if not latest_file:
            return {"total_rows": 0, "columns": [], "data": []}

        cursor.execute(
            "SELECT row_data FROM cleaned_data WHERE source_file = %s ORDER BY id",
            (latest_file,)
        )

        data = [row[0] for row in cursor.fetchall()]

        columns = list(data[0].keys()) if data else []

        return {
            "total_rows": len(data),
            "columns": columns,
            "data": data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read cleaned data: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/cleaning-log")
def get_cleaning_log():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        latest_file = get_latest_source_file(cursor)

        if not latest_file:
            return {"total_corrections": 0, "cleaning_log": []}

        cursor.execute(
            "SELECT row_data FROM cleaning_log WHERE source_file = %s ORDER BY id",
            (latest_file,)
        )

        cleaning_log = [row[0] for row in cursor.fetchall()]

        return {
            "total_corrections": len(cleaning_log),
            "cleaning_log": cleaning_log
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read cleaning log: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/database-status")
def database_status():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        counts = {}
        for table in ["cleaned_data", "error_log", "cleaning_log", "quality_reports"]:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            counts[table] = cursor.fetchone()[0]

        return {
            "database": "dataguard_db",
            "status": "connected",
            "tables": counts
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.get("/uploads")
def get_uploads():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT source_file, report_data, created_at
            FROM quality_reports
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()

        uploads = []
        for source_file, report_data, created_at in rows:
            uploads.append({
                "filename": source_file,
                "uploaded_at": created_at.isoformat() if created_at else None,
                "report": report_data
            })

        return {"total_uploads": len(uploads), "uploads": uploads}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read upload history: {str(e)}"
        )

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()