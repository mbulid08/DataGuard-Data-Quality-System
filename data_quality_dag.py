from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import requests

default_args = {
    'owner': 'dataguard',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def check_data_quality():
    """Call FastAPI backend to get quality report"""
    try:
        # FastAPI is running on host machine
        response = requests.get("http://host.docker.internal:8000/report", timeout=30)
        response.raise_for_status()
        data = response.json()
        
        print("=" * 50)
        print("DATA QUALITY REPORT")
        print("=" * 50)
        print(f"Total Rows      : {data.get('total_rows')}")
        print(f"Clean Rows      : {data.get('clean_rows')}")
        print(f"Unresolved Rows : {data.get('unresolved_rows')}")
        print(f"Quality Score   : {data.get('quality_score')}%")
        print(f"Corrected Values: {data.get('corrected_values')}")
        print("=" * 50)
        
        return "Quality check completed successfully"
    
    except Exception as e:
        print(f"Error calling FastAPI: {str(e)}")
        raise

with DAG(
    dag_id='data_quality_monitoring',
    default_args=default_args,
    description='DataGuard - Intelligent Data Quality Monitoring DAG',
    schedule_interval=timedelta(hours=1),  # Har 1 ghante baad chalega
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['dataguard', 'data-quality'],
) as dag:

    quality_check_task = PythonOperator(
        task_id='run_quality_check',
        python_callable=check_data_quality,
    )
    