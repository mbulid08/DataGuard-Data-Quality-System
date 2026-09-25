# DataGuard-Data-Quality-System
Intelligent Data Quality Monitoring System using FastAPI, React, PostgreSQL and Airflow

**DataGuard** is an intelligent data quality monitoring platform that automatically profiles, validates, cleans, and monitors data quality. It supports both manual file uploads and scheduled runs using Apache Airflow, and presents clear insights through a modern React dashboard.

---

## Features

- Manual Upload support for **CSV** and **Excel (.xlsx)** files
- Scheduled automatic processing using **Apache Airflow**
- Custom **Data Quality Engine** built with Pandas
- Automatic data cleaning and standardization
- Unresolved records moved to Error Log
- Data storage in **PostgreSQL**
- Modern **React Dashboard** with interactive charts
- Global Search and Quality Summary panel
- Quality Score calculation and detailed reports
- Upload History tracking

---

## Supported File Formats

| File Type | Extension | Supported |
|-----------|-----------|---------|
| CSV       | .csv      | Yes     |
| Excel     | .xlsx     | Yes     |
| Others    | -         | No      |

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Backend        | Python, FastAPI, Uvicorn, Pandas    |
| Frontend       | React, Vite, JavaScript, CSS        |
| Database       | PostgreSQL                          |
| Scheduler      | Apache Airflow + Docker             |
| Quality Engine | Custom Pandas-based engine          |

---

## Project Structure
Intelligent-Data-Quality-Monitoring/
├── Airflow/
│   └── dags/
│       └── data_quality_dag.py
├── backend/
│   ├── main.py
│   ├── quality_engine.py
│   ├── database.py
│   ├── uploads/
│   └── outputs/
├── Frontend/
│   └── src/
│       ├── App.jsx
│       └── App.css
├── docker-compose.yaml
└── README.md
text---

## How to Run the Project

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pandas openpyxl psycopg2-binary python-multipart
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
2. Frontend Setup
Bashcd Frontend
npm install
npm run dev -- --host 127.0.0.1 --port 3000
3. Airflow Setup
Make sure Docker Desktop is running, then:
Bashdocker compose up -d

Access Links

Service,URL
Dashboard,http://127.0.0.1:3000
Backend API,http://127.0.0.1:8000
Swagger Docs,http://127.0.0.1:8000/docs
Airflow UI,http://localhost:8080


Quality Engine Capabilities

Column name normalization
Missing and unknown value handling
Whitespace cleaning
Category and name standardization
Product → Category inference
City → Region inference
Date parsing and standardization
Quantity, Unit Price, and Discount validation
Email and Phone validation
Duplicate row detection
Automatic cleaning activity logging
Quality report and score generation

## Screenshots


Future Improvements

Multi-user authentication (Signup / Login)
API data source support
Custom rule builder
Email / Slack alerts
Advanced reporting and export options
Role-based access control


Author
DataGuard Project

Intelligent Data Quality Monitoring System
