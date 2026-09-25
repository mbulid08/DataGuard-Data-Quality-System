# DataGuard-Data-Quality-System
Intelligent Data Quality Monitoring System using FastAPI, React, PostgreSQL and Airflow

DataGuard is a data quality monitoring system that helps identify problems in incoming datasets before they affect downstream analysis and applications.

The system can:

* Accept data through the application
* Perform automated data quality checks
* Identify valid and invalid records
* Generate data quality results
* Store processed data
* Maintain error information
* Provide a frontend interface for users
* Automate data processing using Apache Airflow
* Support data-quality monitoring and visualization

## 🏗️ Project Architecture

```text
User
  ↓
React Frontend
  ↓
FastAPI Backend
  ↓
Data Quality Engine
  ↓
Data Validation & Processing
  ↓
PostgreSQL Database
  ↓
Power BI Dashboard
```

For automated workflow processing:

```text
Data Source
    ↓
Apache Airflow
    ↓
Extract Data
    ↓
Data Validation
    ↓
Data Quality Engine
    ↓
 ┌───────────────┬────────────────┐
 ↓               ↓
Good Records   Bad Records
 ↓               ↓
PostgreSQL     Error Log
    ↓
Power BI Dashboard
```

## 🛠️ Technologies Used

### Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

### Backend

* Python
* FastAPI
* Uvicorn
* Pandas
* Data Quality Engine

### Database

* PostgreSQL

### Data Pipeline

* Apache Airflow
* Python

### Visualization

* Power BI

### Development Tools

* Git
* GitHub
* Visual Studio Code

## 📂 Project Structure

```text
Intelligent-Data-Quality-Monitoring/
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   └── README.md
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── quality_engine.py
│   └── test_quality.py
│
├── Airflow/
│   ├── dags/
│   │   └── data_quality_dag.py
│   └── docker-compose.yaml
│
├── README.md
└── .gitignore
```

> Generated files and local environments such as `node_modules`, `venv`, `__pycache__`, `.pyc`, and Airflow logs are excluded from the repository using `.gitignore`.

## ⚙️ Requirements

Before running the project, install:

* Python
* Node.js and npm
* PostgreSQL
* Docker Desktop (for the Airflow setup)
* Git

## 🚀 How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/mbulid08/DataGuard-Data-Quality-System.git
```

Then:

```bash
cd DataGuard-Data-Quality-System
```

---

## 2. Start the Backend

Open a terminal and go to the backend folder:

```powershell
cd backend
```

Create/activate your Python virtual environment if required.

Install the required Python packages:

```powershell
pip install -r requirements.txt
```

Then start FastAPI:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend will run at:

```text
http://127.0.0.1:8000
```

---

## 3. Start the Frontend

Open a **new terminal**.

Go to the Frontend folder:

```powershell
cd Frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the React/Vite development server:

```powershell
npm run dev -- --host 127.0.0.1 --port 3000
```

The frontend will normally be available at:

```text
http://127.0.0.1:3000
```

> `node_modules` is not included in GitHub. Running `npm install` creates it automatically.

---

## 4. PostgreSQL

Make sure PostgreSQL is installed and running.

Create/configure the database according to the database configuration used by the backend.

The backend uses PostgreSQL for storing processed data and application data.

---

## 5. Apache Airflow

The project also contains an Apache Airflow workflow for automated data-quality processing.

Airflow configuration is available inside:

```text
Airflow/
```

The DAG is located at:

```text
Airflow/dags/data_quality_dag.py
```

Docker configuration is provided through:

```text
Airflow/docker-compose.yaml
```

Docker Desktop is required for running the Airflow environment.

---

## 🔍 Data Quality Processing

The Data Quality Engine performs validation and processing of incoming data.

The general workflow is:

```text
Input Data
    ↓
Data Extraction
    ↓
Data Validation
    ↓
Quality Checks
    ↓
Good Records
    ↓
PostgreSQL

Invalid Records
    ↓
Error Handling / Error Log
```

This helps separate valid data from records containing quality issues.

## 📊 Power BI

Power BI can be connected to the processed data to create dashboards for monitoring data quality.

Possible monitoring areas include:

* Total records
* Valid records
* Invalid records
* Data-quality issues
* Error trends
* Validation results

## 🧪 Testing

Backend data-quality logic can be tested using:

```text
backend/test_quality.py
```

Run the relevant Python tests according to the project's configured testing setup.

## 🔐 Environment & Security

Do not commit passwords, API keys, database credentials, or other secrets to GitHub.

Use environment variables where required.

Example:

```text
.env
.env.*
```

should remain excluded from the public repository unless an example configuration is intentionally provided.

## 📌 Important

The following generated/local files are intentionally not included in the GitHub repository:

```text
node_modules/
venv/
.venv/
__pycache__/
*.pyc
Airflow/logs/
backend/uploads/
backend/outputs/
.env
```

These files are generated locally and can be recreated when setting up the project on another computer.

## 👨‍💻 Project

**Project Name:** DataGuard – Data Quality Monitoring System

**Purpose:** Automated Data Quality Monitoring and Validation

**Technologies:** React, FastAPI, Python, PostgreSQL, Apache Airflow, Power BI

**Repository:**
https://github.com/mbulid08/DataGuard-Data-Quality-System


