import { useRef, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [report, setReport] = useState(null);
  const [errors, setErrors] = useState([]);
  const [cleaningLog, setCleaningLog] = useState([]);
  const [totalCorrections, setTotalCorrections] = useState(0);

  const [cleanedData, setCleanedData] = useState([]);
  const [cleanedColumns, setCleanedColumns] = useState([]);
  const [cleanedTotalRows, setCleanedTotalRows] = useState(0);
  const [cleanedLoading, setCleanedLoading] = useState(false);
  const [cleanedSearch, setCleanedSearch] = useState("");
  const [cleanedColumnFilter, setCleanedColumnFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [cleaningLoading, setCleaningLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [page, setPage] = useState("dashboard");

  const [search, setSearch] = useState("");
  const [columnFilter, setColumnFilter] = useState("All");
  const [issueFilter, setIssueFilter] = useState("All");

  // ===== NEW: UPLOAD HISTORY STATE =====
  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);


  // =====================================================
  // FILE SELECTION
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const fileName = file.name.toLowerCase();

    if (
      !fileName.endsWith(".csv") &&
      !fileName.endsWith(".xlsx")
    ) {
      setSelectedFile(null);

      setMessage(
        "Only CSV and Excel (.xlsx) files are supported."
      );

      return;
    }

    setSelectedFile(file);
    setMessage("");
  };


  // =====================================================
  // OPEN FILE PICKER
  // =====================================================

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };


  // =====================================================
  // FETCH ERROR LOG
  // =====================================================

  const fetchErrors = async () => {
    try {
      const response = await fetch(
        `${API_URL}/errors`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load error log."
        );
      }

      const data = await response.json();

      setErrors(data.errors || []);

    } catch (error) {
      console.error(error);

      setErrors([]);
    }
  };


  // =====================================================
  // FETCH CLEANING ACTIVITY
  // =====================================================

  const fetchCleaningLog = async () => {
    setCleaningLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/cleaning-log`
      );

      if (!response.ok) {
        throw new Error(
          "Could not load cleaning activity."
        );
      }

      const data = await response.json();

      setCleaningLog(
        data.cleaning_log || []
      );
      setTotalCorrections(
        Number(data.total_corrections ?? 0)
      );

    } catch (error) {
      console.error(error);

      setCleaningLog([]);

    } finally {
      setCleaningLoading(false);
    }
  };


  // =====================================================
  // FETCH CLEANED DATA
  // =====================================================

  const fetchCleanedData = async () => {
    setCleanedLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/cleaned-data`
      );

      if (!response.ok) {
        throw new Error("Could not load cleaned data.");
      }

      const data = await response.json();

      setCleanedData(data.data || []);
      setCleanedColumns(data.columns || []);
      setCleanedTotalRows(
        Number(data.total_rows ?? 0)
      );

    } catch (error) {
      console.error(error);
      setCleanedData([]);
      setCleanedColumns([]);
      setCleanedTotalRows(0);

    } finally {
      setCleanedLoading(false);
    }
  };


  // =====================================================
  // NEW: FETCH UPLOAD HISTORY
  // =====================================================

  const fetchUploads = async () => {
    setUploadsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/uploads`
      );

      if (!response.ok) {
        throw new Error("Could not load upload history.");
      }

      const data = await response.json();

      setUploads(data.uploads || []);

    } catch (error) {
      console.error(error);
      setUploads([]);

    } finally {
      setUploadsLoading(false);
    }
  };


  // =====================================================
  // UPLOAD + ANALYZE
  // =====================================================

  const uploadFile = async () => {

    if (!selectedFile) {
      setMessage(
        "Please select a CSV or Excel file first."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    const formData = new FormData();

    formData.append(
      "file",
      selectedFile
    );


    try {

      const response = await fetch(
        `${API_URL}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "File processing failed."
        );

      }


      // Update report
      setReport(
        data.quality_report
      );


      // Refresh error log
      await fetchErrors();


      // Refresh cleaning activity
      await fetchCleaningLog();

      // Refresh cleaned data
      await fetchCleanedData();


      setMessage(
        `Successfully analyzed ${data.filename}`
      );


    } catch (error) {

      console.error(error);

      setMessage(
        error.message ||
        "Could not connect to the server."
      );

      setReport(null);

      setErrors([]);

      setCleaningLog([]);
      setTotalCorrections(0);
      setCleanedData([]);
      setCleanedColumns([]);
      setCleanedTotalRows(0);


    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // GO TO ERROR LOG
  // =====================================================

  const goToErrorLog = async () => {

    setPage("errors");

    await fetchErrors();

  };


  // =====================================================
  // GO TO CLEANING ACTIVITY
  // =====================================================

  const goToCleaningActivity = async () => {

    setPage("cleaning-activity");

    await fetchCleaningLog();

  };


  // =====================================================
  // GO TO CLEANED DATA
  // =====================================================

  const goToCleanedData = async () => {
    setPage("cleaned-data");
    await fetchCleanedData();
  };


  // =====================================================
  // NEW: GO TO UPLOAD HISTORY
  // =====================================================

  const goToUploadHistory = async () => {
    setPage("upload-history");
    await fetchUploads();
  };


  // =====================================================
  // REPORT VALUES
  // =====================================================

  const qualityScore =
    report?.quality_score ?? 0;

  const totalRows =
    report?.total_rows ?? 0;

  const cleanRows =
    report?.clean_rows ?? 0;

  const unresolvedRows =
    report?.unresolved_rows ?? 0;

  const warningRows =
    report?.warning_rows ?? 0;

  const correctedValues =
    report?.corrected_values ?? 0;


  const invalidQuantity =
    report?.invalid_quantity_count ?? 0;

  const invalidDiscount =
    report?.invalid_discount_count ?? 0;

  const invalidDate =
    report?.invalid_date_count ?? 0;

  const invalidPrice =
    report?.invalid_price_count ?? 0;


  // =====================================================
  // ERROR FILTERS
  // =====================================================

  const columns = [
    "All",
    ...new Set(
      errors.map(
        (error) => error.column
      )
    ),
  ];


  const issues = [
    "All",
    ...new Set(
      errors.map(
        (error) => error.issue
      )
    ),
  ];


  const filteredErrors =
    errors.filter((error) => {

      const text =
        search.toLowerCase();


      const matchesSearch =
        String(
          error.row ?? ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          error.column ?? ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          error.issue ?? ""
        )
          .toLowerCase()
          .includes(text) ||

        String(
          error.value ?? ""
        )
          .toLowerCase()
          .includes(text);


      const matchesColumn =
        columnFilter === "All" ||
        error.column === columnFilter;


      const matchesIssue =
        issueFilter === "All" ||
        error.issue === issueFilter;


      return (
        matchesSearch &&
        matchesColumn &&
        matchesIssue
      );

    });


  const filteredCleanedData = cleanedData.filter((row) => {
    const searchText = cleanedSearch.toLowerCase();

    const matchesSearch =
      searchText === "" ||
      cleanedColumns.some((column) =>
        String(row[column] ?? "")
          .toLowerCase()
          .includes(searchText)
      );

    const matchesColumn =
      cleanedColumnFilter === "All" ||
      cleanedColumns.includes(cleanedColumnFilter);

    return matchesSearch && matchesColumn;
  });

  // =====================================================
  // DATA PROFILE CALCULATIONS
  // =====================================================

  const profileRows = cleanedData;

  const profileColumns = cleanedColumns.map((column) => {

    const values = profileRows.map(
      (row) => row[column]
    );

    const nonEmptyValues = values.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );

    const uniqueValues = new Set(
      nonEmptyValues.map((value) =>
        String(value)
      )
    ).size;

    const missingValues =
      values.length - nonEmptyValues.length;

    let dataType = "Text";

    if (nonEmptyValues.length > 0) {

      const sampleValues =
        nonEmptyValues.slice(0, 100);

      const numericValues =
        sampleValues.filter(
          (value) =>
            value !== "" &&
            !Number.isNaN(
              Number(value)
            )
        );

      const numericRatio =
        numericValues.length /
        sampleValues.length;

      const dateRatio =
        sampleValues.filter(
          (value) =>
            !Number.isNaN(
              Date.parse(String(value))
            )
        ).length /
        sampleValues.length;

      if (numericRatio >= 0.9) {
        dataType = "Number";
      } else if (dateRatio >= 0.9) {
        dataType = "Date";
      }
    }

    return {
      column,
      dataType,
      missingValues,
      missingPercent:
        values.length > 0
          ? (
              (missingValues /
                values.length) *
              100
            ).toFixed(1)
          : "0.0",
      uniqueValues
    };
  });

  const profileMissingTotal =
    profileColumns.reduce(
      (sum, item) =>
        sum + item.missingValues,
      0
    );

  const profileNumericColumns =
    profileColumns.filter(
      (item) =>
        item.dataType === "Number"
    ).length;

  const profileDateColumns =
    profileColumns.filter(
      (item) =>
        item.dataType === "Date"
    ).length;

  const profileTextColumns =
    profileColumns.filter(
      (item) =>
        item.dataType === "Text"
    ).length;


  // =====================================================
  // DASHBOARD CHART DATA
  // =====================================================

  const qualityWarningOnly = Math.max(
    Number(warningRows) - Number(unresolvedRows),
    0
  );

  const qualityComposition = [
    { label: "Clean", value: Number(cleanRows) },
    { label: "Warning-only", value: qualityWarningOnly },
    { label: "Unresolved", value: Number(unresolvedRows) },
  ];

  const qualityIssueData = [
    { label: "Missing Values", value: Number(report?.missing_value_count ?? 0) },
    { label: "Invalid Date", value: Number(report?.invalid_date_count ?? 0) },
    { label: "Invalid Quantity", value: Number(report?.invalid_quantity_count ?? 0) },
    { label: "Invalid Price", value: Number(report?.invalid_price_count ?? 0) },
    { label: "Invalid Discount", value: Number(report?.invalid_discount_count ?? 0) },
    { label: "Invalid Email", value: Number(report?.invalid_email_count ?? 0) },
    { label: "Invalid Phone", value: Number(report?.invalid_phone_count ?? 0) },
  ];

  const missingByColumn = [...profileColumns]
    .sort((a, b) => b.missingValues - a.missingValues)
    .slice(0, 10);

  const cleaningActionCounts = cleaningLog.reduce((accumulator, item) => {
    const action = String(
      item.action ??
      item.Action ??
      item.issue ??
      item.Issue ??
      item.rule ??
      item.Rule ??
      "Other"
    ).trim() || "Other";

    accumulator[action] = (accumulator[action] || 0) + 1;
    return accumulator;
  }, {});

  const cleaningChartData = Object.entries(cleaningActionCounts)
    .map(([label, value]) => ({ label, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxIssueValue = Math.max(
    ...qualityIssueData.map((item) => item.value),
    1
  );

  const maxMissingValue = Math.max(
    ...missingByColumn.map((item) => item.missingValues),
    1
  );

  const maxCleaningValue = Math.max(
    ...cleaningChartData.map((item) => item.value),
    1
  );

  // =====================================================
  // NEW: HELPER TO FORMAT UPLOAD DATE
  // =====================================================

  const formatUploadDate = (isoString) => {
    if (!isoString) return "—";

    try {
      const parsedDate = new Date(isoString);

      return parsedDate.toLocaleString();

    } catch (error) {
      return isoString;
    }
  };

  return (

    <div className="app">

      <style>{`
        .brand-logo-mark {
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-logo-mark svg {
          display: block;
          width: 42px;
          height: 42px;
        }
      `}</style>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">


        <div className="brand">

          <div
            className="brand-logo-mark"
            aria-label="DataGuard logo"
            title="DataGuard"
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1"
                y="1"
                width="46"
                height="46"
                rx="13"
                fill="#101D36"
              />
              <rect x="11" y="25" width="4" height="9" rx="1.5" fill="#27B8E8" />
              <rect x="17" y="20" width="4" height="14" rx="1.5" fill="#27B8E8" />
              <rect x="23" y="15" width="4" height="19" rx="1.5" fill="#27B8E8" />
              <path
                d="M30 18.5L37 21.2V27.2C37 32 34 35.7 30 37.3C26 35.7 23 32 23 27.2V21.2L30 18.5Z"
                fill="#18CDB5"
              />
              <path
                d="M26.2 27.7L28.5 30L33.6 24.9"
                stroke="#101D36"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <div
              className="brand-title"
              style={{
                fontSize: "21px",
                fontWeight: 800,
                letterSpacing: "-0.35px",
                lineHeight: 1.15,
              }}
            >
              DataGuard
            </div>
            <div className="brand-subtitle">
              Data Quality Platform
            </div>
          </div>

        </div>

        <nav className="navigation">


          <div className="nav-section">
            MAIN
          </div>


          <button
            className={`nav-item ${
              page === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setPage("dashboard")
            }
          >

            <span>⌂</span>

            Dashboard

          </button>


          <button
            className={`nav-item ${
              page === "quality"
                ? "active"
                : ""
            }`}
            onClick={() => setPage("quality")}
          >

            <span>◈</span>

            Data Quality

          </button>


          <button
            className={`nav-item ${
              page === "profile"
                ? "active"
                : ""
            }`}
            onClick={() => setPage("profile")}
          >

            <span>▦</span>

            Data Profile

          </button>


          <div className="nav-section">
            DATA
          </div>


          <button
            className={`nav-item ${
              page === "errors"
                ? "active"
                : ""
            }`}
            onClick={goToErrorLog}
          >

            <span>⚠</span>

            Error Log

          </button>


          <button
            className={`nav-item ${
              page === "cleaned-data"
                ? "active"
                : ""
            }`}
            onClick={goToCleanedData}
          >

            <span>✓</span>

            Cleaned Data

          </button>


          <button
            className={`nav-item ${
              page === "cleaning-activity"
                ? "active"
                : ""
            }`}
            onClick={
              goToCleaningActivity
            }
          >

            <span>↻</span>

            Cleaning Activity

          </button>


          {/* ===== NEW: UPLOAD HISTORY NAV ITEM ===== */}

          <button
            className={`nav-item ${
              page === "upload-history"
                ? "active"
                : ""
            }`}
            onClick={goToUploadHistory}
          >

            <span>🕘</span>

            Upload History

          </button>


        </nav>


        <div className="sidebar-bottom">

          <div className="system-status">

            <span className="status-dot"></span>

            System Online

          </div>

        </div>


      </aside>



      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="main-content">


        {/* =================================================
            TOP BAR
        ================================================= */}

        <header className="topbar">


          <div>

            <h1>

              {page === "quality"
                ? "Data Quality"
                : page === "profile"
                ? "Data Profile"
                : page === "errors"
                ? "Error Log"
                : page === "cleaning-activity"
                ? "Cleaning Activity"
                : page === "cleaned-data"
                ? "Cleaned Data"
                : page === "upload-history"
                ? "Upload History"
                : "Dashboard"}

            </h1>


            <p>

              {page === "quality"
                ? "Review detailed data quality validation results"
                : page === "profile"
                ? "Explore columns, data types, missing values and unique values"
                : page === "errors"
                ? "Review unresolved data quality issues"
                : page === "cleaning-activity"
                ? "Review automated corrections and standardization"
                : page === "cleaned-data"
                ? "Review clean and corrected records"
                : page === "upload-history"
                ? "Browse and review all previous dataset uploads"
                : "Monitor and manage your data quality"}

            </p>

          </div>


          <div className="topbar-right">


            <button
              className="icon-button"
              title="Open Error Log"
              onClick={goToErrorLog}
            >
              ⌕
            </button>


            <button
              className="icon-button"
              title="Open Data Quality"
              onClick={() => setPage("quality")}
            >
              ◔
            </button>


            <div className="profile">


              <div className="profile-avatar">
                DQ
              </div>


              <div>

                <strong>
                  Administrator
                </strong>

                <span>
                  Data Quality
                </span>

              </div>


            </div>


          </div>


        </header>



        {/* =================================================
            DASHBOARD
        ================================================= */}

        {page === "dashboard" && (

          <>


            {/* UPLOAD */}

            <section className="upload-section">


              <div className="upload-header">


                <div>

                  <h2>
                    Upload & Analyze Data
                  </h2>


                  <p>
                    Upload a CSV or Excel file to run
                    automated data quality validation.
                  </p>

                </div>


                <span className="supported-format">
                  CSV · XLSX
                </span>


              </div>



              <div
                className="upload-box"
                onClick={
                  openFilePicker
                }
              >


                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={
                    handleFileChange
                  }
                  hidden
                />


                <div className="upload-icon">
                  ↑
                </div>


                <h3>

                  {selectedFile
                    ? selectedFile.name
                    : "Drop your data file here"}

                </h3>


                <p>

                  {selectedFile
                    ? `${(
                        selectedFile.size / 1024
                      ).toFixed(1)} KB selected`
                    : "or browse files from your computer"}

                </p>


                <button
                  className="browse-button"
                  onClick={(event) => {

                    event.stopPropagation();

                    openFilePicker();

                  }}
                >
                  Browse Files
                </button>


                <small>

                  Maximum supported formats:
                  CSV, Excel (.xlsx)

                </small>


              </div>



              <div className="upload-action">


                <button
                  className="analyze-button"
                  onClick={
                    uploadFile
                  }
                  disabled={
                    loading ||
                    !selectedFile
                  }
                >

                  {loading
                    ? "Analyzing..."
                    : "Upload & Analyze"}

                </button>


              </div>


              {message && (

                <div className="upload-message">

                  {message}

                </div>

              )}


            </section>



            {/* QUALITY OVERVIEW */}

            <section className="section">


              <div className="section-title">


                <div>

                  <h2>
                    Quality Overview
                  </h2>

                  <p>
                    Latest data validation results
                  </p>

                </div>


                <button className="date-button">
                  Latest Run ▾
                </button>


              </div>



              <div className="metrics-grid">


                <div className="metric-card quality-card">


                  <div className="metric-top">

                    <span>
                      Quality Score
                    </span>

                    <span className="metric-icon">
                      ◉
                    </span>

                  </div>


                  <div className="metric-value">
                    {qualityScore}%
                  </div>


                  <div className="progress">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${qualityScore}%`,
                      }}
                    ></div>

                  </div>


                  <span className="metric-note">
                    Current validation score
                  </span>


                </div>



                <div className="metric-card">


                  <div className="metric-top">

                    <span>
                      Total Records
                    </span>

                    <span className="metric-icon">
                      ▤
                    </span>

                  </div>


                  <div className="metric-value">

                    {totalRows.toLocaleString()}

                  </div>


                  <span className="metric-note">
                    Records processed
                  </span>


                </div>



                <div className="metric-card">


                  <div className="metric-top">

                    <span>
                      Clean Records
                    </span>

                    <span className="metric-icon">
                      ✓
                    </span>

                  </div>


                  <div className="metric-value">

                    {cleanRows.toLocaleString()}

                  </div>


                  <span className="metric-note">
                    Passed validation
                  </span>


                </div>



                <div className="metric-card">


                  <div className="metric-top">

                    <span>
                      Unresolved
                    </span>

                    <span className="metric-icon">
                      !
                    </span>

                  </div>


                  <div className="metric-value">

                    {unresolvedRows.toLocaleString()}

                  </div>


                  <span className="metric-note">
                    Require attention
                  </span>


                </div>


              </div>


            </section>



            {/* ANALYTICS */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: "20px",
                marginBottom: "20px",
              }}
            >

              {/* QUALITY OVERVIEW — DONUT */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Quality Overview</h3>
                    <p>Clean, warning-only and unresolved records</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    gap: "28px",
                    padding: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "190px",
                      height: "190px",
                      borderRadius: "50%",
                      background:
                        `conic-gradient(#667386 0 ${qualityScore}%, #d9dee5 ${qualityScore}% ${Math.min(
                          qualityScore +
                            (totalRows > 0
                              ? (qualityWarningOnly / totalRows) * 100
                              : 0),
                          100
                        )}%, #f0b56b ${Math.min(
                          qualityScore +
                            (totalRows > 0
                              ? (qualityWarningOnly / totalRows) * 100
                              : 0),
                          100
                        )}% 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "118px",
                        height: "118px",
                        borderRadius: "50%",
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 0 1px #edf0f3",
                      }}
                    >
                      <strong style={{ fontSize: "28px", lineHeight: 1 }}>
                        {qualityScore}%
                      </strong>
                      <span
                        style={{
                          marginTop: "7px",
                          color: "#7b8490",
                          fontSize: "12px",
                        }}
                      >
                        Quality Score
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: "190px",
                      flex: 1,
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    {qualityComposition.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            color: "#5f6875",
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              background:
                                item.label === "Clean"
                                  ? "#667386"
                                  : item.label === "Warning-only"
                                  ? "#d9dee5"
                                  : "#f0b56b",
                            }}
                          />
                          {item.label}
                        </span>
                        <strong>{item.value.toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* DATA QUALITY ISSUES — BAR */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Data Quality Issues</h3>
                    <p>Detected validation issues by type</p>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 24px 24px",
                    display: "grid",
                    gap: "15px",
                  }}
                >
                  {qualityIssueData.map((item) => (
                    <div key={item.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          marginBottom: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <span
                          style={{
                            color: "#5f6875",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.label}
                        </span>
                        <strong>{item.value.toLocaleString()}</strong>
                      </div>

                      <div
                        style={{
                          height: "8px",
                          borderRadius: "99px",
                          background: "#edf0f3",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(item.value / maxIssueValue) * 100}%`,
                            minWidth: item.value > 0 ? "4px" : "0",
                            height: "100%",
                            borderRadius: "99px",
                            background: "#667386",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>


            {/* SECOND ROW OF ANALYTICS */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: "20px",
                marginBottom: "20px",
              }}
            >

              {/* MISSING VALUES */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Missing Values by Column</h3>
                    <p>Columns with the highest missing-value counts</p>
                  </div>
                </div>

                <div
                  style={{
                    padding: "18px 24px 24px",
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  {missingByColumn.length === 0 ? (
                    <div className="empty-table">
                      Upload and analyze a dataset first.
                    </div>
                  ) : (
                    missingByColumn.map((item) => (
                      <div key={item.column}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "6px",
                            fontSize: "12px",
                          }}
                        >
                          <span
                            style={{
                              color: "#5f6875",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.column}
                          >
                            {item.column}
                          </span>

                          <strong>
                            {item.missingValues.toLocaleString()}
                          </strong>
                        </div>

                        <div
                          style={{
                            height: "8px",
                            borderRadius: "99px",
                            background: "#edf0f3",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(item.missingValues / maxMissingValue) * 100}%`,
                              minWidth:
                                item.missingValues > 0 ? "4px" : "0",
                              height: "100%",
                              borderRadius: "99px",
                              background: "#8a94a3",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>


              {/* CLEANING ACTIVITY */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Cleaning Activity</h3>
                    <p>Most frequent automated correction actions</p>
                  </div>

                  <button
                    className="view-button"
                    onClick={goToCleaningActivity}
                  >
                    View All
                  </button>
                </div>

                <div
                  style={{
                    padding: "18px 24px 24px",
                    display: "grid",
                    gap: "15px",
                  }}
                >
                  {cleaningChartData.length === 0 ? (
                    <div className="empty-table">
                      Upload and analyze a dataset first.
                    </div>
                  ) : (
                    cleaningChartData.map((item) => (
                      <div key={item.label}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "6px",
                            fontSize: "12px",
                          }}
                        >
                          <span
                            style={{
                              color: "#5f6875",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.label}
                          >
                            {item.label}
                          </span>

                          <strong>{item.value.toLocaleString()}</strong>
                        </div>

                        <div
                          style={{
                            height: "8px",
                            borderRadius: "99px",
                            background: "#edf0f3",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(item.value / maxCleaningValue) * 100}%`,
                              minWidth:
                                item.value > 0 ? "4px" : "0",
                              height: "100%",
                              borderRadius: "99px",
                              background: "#667386",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </section>


            {/* RECENT VALIDATION */}

            <section className="panel table-panel">


              <div className="panel-header">


                <div>

                  <h3>
                    Recent Validation Results
                  </h3>

                  <p>
                    Latest detected data-quality issues
                  </p>

                </div>


                <button
                  className="view-button"
                  onClick={
                    goToErrorLog
                  }
                >
                  View All
                </button>


              </div>



              <div className="table-wrapper">


                <table>


                  <thead>

                    <tr>

                      <th>Row</th>

                      <th>Column</th>

                      <th>Issue</th>

                      <th>Value</th>

                      <th>Status</th>

                    </tr>

                  </thead>



                  <tbody>


                    {errors.length === 0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="empty-table"
                        >

                          Upload and analyze a file to
                          view validation results.

                        </td>

                      </tr>

                    ) : (

                      errors
                        .slice(0, 10)
                        .map(
                          (
                            error,
                            index
                          ) => (

                            <tr key={index}>

                              <td>
                                {error.row}
                              </td>

                              <td>
                                {error.column}
                              </td>

                              <td>
                                {error.issue}
                              </td>

                              <td>
                                {error.value}
                              </td>

                              <td>

                                <span className="badge unresolved">
                                  Unresolved
                                </span>

                              </td>

                            </tr>

                          )
                        )

                    )}


                  </tbody>


                </table>


              </div>


            </section>


          </>

        )}



        {/* =================================================
            DATA QUALITY
        ================================================= */}

        {page === "quality" && (

          <section className="error-page">

            <div className="error-summary">

              <div className="error-summary-card">
                <span>Quality Score</span>
                <strong>
                  {qualityScore}%
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Total Records</span>
                <strong>
                  {totalRows.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Clean Records</span>
                <strong>
                  {cleanRows.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Corrected Values</span>
                <strong>
                  {correctedValues.toLocaleString()}
                </strong>
              </div>

            </div>


            <div className="panel error-panel">

              <div className="panel-header">

                <div>
                  <h3>Data Quality Overview</h3>
                  <p>
                    Detailed validation results from the latest dataset
                  </p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setPage("dashboard")}
                >
                  ← Dashboard
                </button>

              </div>


              <div style={{
                padding: "24px",
                borderBottom: "1px solid #edf0f3"
              }}>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px"
                }}>

                  <strong>Overall Quality Score</strong>

                  <strong>{qualityScore}%</strong>

                </div>

                <div className="progress">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${qualityScore}%`
                    }}
                  ></div>

                </div>

              </div>


              <div style={{ padding: "24px" }}>

                <h3 style={{ marginBottom: "20px" }}>
                  Quality Checks
                </h3>

                <div className="issue-list">

                  <div className="issue-row">
                    <span>Missing Values</span>
                    <strong>
                      {Number(
                        report?.missing_value_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Duplicate Records</span>
                    <strong>
                      {Number(
                        report?.duplicate_rows ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Quantity</span>
                    <strong>
                      {Number(
                        report?.invalid_quantity_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Discount</span>
                    <strong>
                      {Number(
                        report?.invalid_discount_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Date</span>
                    <strong>
                      {Number(
                        report?.invalid_date_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Price</span>
                    <strong>
                      {Number(
                        report?.invalid_price_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Email</span>
                    <strong>
                      {Number(
                        report?.invalid_email_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Invalid Phone</span>
                    <strong>
                      {Number(
                        report?.invalid_phone_count ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                </div>

              </div>


              <div style={{
                padding: "24px",
                borderTop: "1px solid #edf0f3"
              }}>

                <h3 style={{ marginBottom: "20px" }}>
                  Processing Summary
                </h3>

                <div className="issue-list">

                  <div className="issue-row">
                    <span>Clean Records</span>
                    <strong>
                      {Number(
                        report?.clean_rows ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Corrected Records</span>
                    <strong>
                      {Number(
                        report?.corrected_rows ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Records for Review</span>
                    <strong>
                      {Number(
                        report?.review_rows ??
                        report?.unresolved_rows ??
                        0
                      ).toLocaleString()}
                    </strong>
                  </div>

                  <div className="issue-row">
                    <span>Total Corrections</span>
                    <strong>
                      {Number(
                        report?.corrected_values ?? 0
                      ).toLocaleString()}
                    </strong>
                  </div>

                </div>

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            DATA PROFILE
        ================================================= */}

        {page === "profile" && (

          <section className="error-page">

            <div className="error-summary">

              <div className="error-summary-card">
                <span>Rows</span>
                <strong>
                  {profileRows.length.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Columns</span>
                <strong>
                  {profileColumns.length.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Missing Values</span>
                <strong>
                  {profileMissingTotal.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Unique Columns</span>
                <strong>
                  {profileColumns.filter(
                    (item) =>
                      item.uniqueValues > 0
                  ).length.toLocaleString()}
                </strong>
              </div>

            </div>


            <div className="panel error-panel">

              <div className="panel-header">

                <div>
                  <h3>Data Profile</h3>
                  <p>
                    Column-level structure and statistics of the processed dataset
                  </p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setPage("dashboard")}
                >
                  ← Dashboard
                </button>

              </div>


              {profileColumns.length === 0 ? (

                <div className="empty-table">
                  Upload and analyze a dataset first to generate the data profile.
                </div>

              ) : (

                <>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, minmax(0, 1fr))",
                    gap: "16px",
                    padding: "24px",
                    borderBottom:
                      "1px solid #edf0f3"
                  }}>

                    <div className="metric-card">
                      <div className="metric-top">
                        <span>Text Columns</span>
                      </div>
                      <div className="metric-value">
                        {profileTextColumns}
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-top">
                        <span>Numeric Columns</span>
                      </div>
                      <div className="metric-value">
                        {profileNumericColumns}
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-top">
                        <span>Date Columns</span>
                      </div>
                      <div className="metric-value">
                        {profileDateColumns}
                      </div>
                    </div>

                  </div>


                  <div className="table-wrapper">

                    <table>

                      <thead>

                        <tr>
                          <th>Column</th>
                          <th>Data Type</th>
                          <th>Missing</th>
                          <th>Missing %</th>
                          <th>Unique Values</th>
                        </tr>

                      </thead>

                      <tbody>

                        {profileColumns.map(
                          (item) => (

                            <tr key={item.column}>

                              <td>
                                {item.column}
                              </td>

                              <td>
                                {item.dataType}
                              </td>

                              <td>
                                {item.missingValues.toLocaleString()}
                              </td>

                              <td>
                                {item.missingPercent}%
                              </td>

                              <td>
                                {item.uniqueValues.toLocaleString()}
                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </>

              )}

            </div>

          </section>

        )}


        {/* =================================================
            ERROR LOG
        ================================================= */}

        {page === "errors" && (

          <section className="error-page">


            <div className="error-summary">


              <div className="error-summary-card">

                <span>
                  Total Unresolved Errors
                </span>

                <strong>
                  {errors.length.toLocaleString()}
                </strong>

              </div>


              <div className="error-summary-card">

                <span>
                  Filtered Results
                </span>

                <strong>
                  {filteredErrors.length.toLocaleString()}
                </strong>

              </div>


            </div>



            <div className="panel error-panel">


              <div className="panel-header">


                <div>

                  <h3>
                    Unresolved Error Records
                  </h3>

                  <p>
                    Records that could not be automatically corrected
                  </p>

                </div>


                <button
                  className="view-button"
                  onClick={() =>
                    setPage("dashboard")
                  }
                >
                  ← Dashboard
                </button>


              </div>



              <div className="error-filters">


                <input
                  type="text"
                  placeholder="Search row, column, issue or value..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />


                <select
                  value={columnFilter}
                  onChange={(event) =>
                    setColumnFilter(
                      event.target.value
                    )
                  }
                >

                  {columns.map(
                    (column) => (

                      <option
                        key={column}
                        value={column}
                      >

                        {column === "All"
                          ? "All Columns"
                          : column}

                      </option>

                    )
                  )}

                </select>


                <select
                  value={issueFilter}
                  onChange={(event) =>
                    setIssueFilter(
                      event.target.value
                    )
                  }
                >

                  {issues.map(
                    (issue) => (

                      <option
                        key={issue}
                        value={issue}
                      >

                        {issue === "All"
                          ? "All Issues"
                          : issue}

                      </option>

                    )
                  )}

                </select>


              </div>



              <div className="table-wrapper">


                <table>


                  <thead>

                    <tr>

                      <th>Row</th>

                      <th>Column</th>

                      <th>Issue</th>

                      <th>Value</th>

                      <th>Status</th>

                    </tr>

                  </thead>



                  <tbody>


                    {filteredErrors.length === 0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="empty-table"
                        >

                          No matching error records found.

                        </td>

                      </tr>

                    ) : (

                      filteredErrors.map(
                        (
                          error,
                          index
                        ) => (

                          <tr key={index}>

                            <td>
                              {error.row}
                            </td>

                            <td>
                              {error.column}
                            </td>

                            <td>
                              {error.issue}
                            </td>

                            <td>
                              {error.value}
                            </td>

                            <td>

                              <span className="badge unresolved">
                                Unresolved
                              </span>

                            </td>

                          </tr>

                        )
                      )

                    )}


                  </tbody>


                </table>


              </div>


            </div>


          </section>

        )}



        {/* =================================================
            CLEANED DATA
        ================================================= */}

        {page === "cleaned-data" && (

          <section className="error-page">

            <div className="error-summary">

              <div className="error-summary-card">
                <span>Total Cleaned Records</span>
                <strong>
                  {cleanedTotalRows.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Filtered Results</span>
                <strong>
                  {filteredCleanedData.length.toLocaleString()}
                </strong>
              </div>

            </div>

            <div className="panel error-panel">

              <div className="panel-header">

                <div>
                  <h3>Cleaned Data</h3>
                  <p>
                    Clean and corrected records produced by the quality engine
                  </p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setPage("dashboard")}
                >
                  ← Dashboard
                </button>

              </div>

              <div className="error-filters">

                <input
                  type="text"
                  placeholder="Search cleaned data..."
                  value={cleanedSearch}
                  onChange={(event) =>
                    setCleanedSearch(event.target.value)
                  }
                />

                <select
                  value={cleanedColumnFilter}
                  onChange={(event) =>
                    setCleanedColumnFilter(event.target.value)
                  }
                >
                  <option value="All">All Columns</option>

                  {cleanedColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>

              </div>

              <div className="table-wrapper">

                {cleanedLoading ? (

                  <div className="empty-table">
                    Loading cleaned data...
                  </div>

                ) : filteredCleanedData.length === 0 ? (

                  <div className="empty-table">
                    {cleanedData.length === 0
                      ? "No cleaned data available. Upload and analyze a dataset first."
                      : "No matching cleaned records found."}
                  </div>

                ) : (

                  <table>

                    <thead>
                      <tr>
                        {cleanedColumns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>

                      {filteredCleanedData.map((row, index) => (

                        <tr key={index}>

                          {cleanedColumns.map((column) => (
                            <td key={column}>
                              {String(row[column] ?? "")}
                            </td>
                          ))}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                )}

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            CLEANING ACTIVITY
        ================================================= */}

        {page === "cleaning-activity" && (

          <section className="error-page">


            <div className="error-summary">


              <div className="error-summary-card">

                <span>
                  Total Corrections
                </span>

                <strong>
                  {totalCorrections.toLocaleString()}
                </strong>

              </div>


              <div className="error-summary-card">

                <span>
                  Cleaning Status
                </span>

                <strong>

                  {cleaningLoading
                    ? "Loading..."
                    : "Completed"}

                </strong>

              </div>


            </div>



            <div className="panel error-panel">


              <div className="panel-header">


                <div>

                  <h3>
                    Cleaning Activity
                  </h3>

                  <p>
                    Automated corrections and standardization performed by the quality engine
                  </p>

                </div>


                <button
                  className="view-button"
                  onClick={() =>
                    setPage("dashboard")
                  }
                >
                  ← Dashboard
                </button>


              </div>



              <div className="table-wrapper">


                {cleaningLoading ? (

                  <div className="empty-table">

                    Loading cleaning activity...

                  </div>

                ) : cleaningLog.length === 0 ? (

                  <div className="empty-table">

                    No cleaning activity available.
                    Upload and analyze a dataset first.

                  </div>

                ) : (

                  <table>


                    <thead>

                      <tr>

                        {Object.keys(
                          cleaningLog[0]
                        ).map(
                          (column) => (

                            <th key={column}>
                              {column}
                            </th>

                          )
                        )}

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>



                    <tbody>


                      {cleaningLog.map(
                        (
                          row,
                          index
                        ) => (

                          <tr key={index}>

                            {Object.keys(
                              cleaningLog[0]
                            ).map(
                              (column) => (

                                <td key={column}>

                                  {String(
                                    row[column] ?? ""
                                  )}

                                </td>

                              )
                            )}


                            <td>

                              <span className="badge clean">
                                Corrected
                              </span>

                            </td>

                          </tr>

                        )
                      )}


                    </tbody>


                  </table>

                )}


              </div>


            </div>


          </section>

        )}


        {/* =================================================
            NEW: UPLOAD HISTORY
        ================================================= */}

        {page === "upload-history" && (

          <section className="error-page">

            <div className="error-summary">

              <div className="error-summary-card">
                <span>Total Uploads</span>
                <strong>
                  {uploads.length.toLocaleString()}
                </strong>
              </div>

              <div className="error-summary-card">
                <span>Latest Upload</span>
                <strong style={{ fontSize: "14px" }}>
                  {uploads.length > 0
                    ? uploads[0].filename
                    : "—"}
                </strong>
              </div>

            </div>

            <div className="panel error-panel">

              <div className="panel-header">

                <div>
                  <h3>Upload History</h3>
                  <p>
                    All previous dataset uploads. Click a row to view its summary.
                  </p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setPage("dashboard")}
                >
                  ← Dashboard
                </button>

              </div>

              <div className="table-wrapper">

                {uploadsLoading ? (

                  <div className="empty-table">
                    Loading upload history...
                  </div>

                ) : uploads.length === 0 ? (

                  <div className="empty-table">
                    No uploads found yet. Upload a dataset from the Dashboard first.
                  </div>

                ) : (

                  <table>

                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Uploaded At</th>
                        <th>Quality Score</th>
                        <th>Total Rows</th>
                        <th>Unresolved</th>
                      </tr>
                    </thead>

                    <tbody>

                      {uploads.map((upload, index) => (

                        <tr
                          key={index}
                          onClick={() => setSelectedUpload(upload)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>{upload.filename}</td>
                          <td>{formatUploadDate(upload.uploaded_at)}</td>
                          <td>{upload.report?.quality_score ?? 0}%</td>
                          <td>
                            {Number(
                              upload.report?.total_rows ?? 0
                            ).toLocaleString()}
                          </td>
                          <td>
                            {Number(
                              upload.report?.unresolved_rows ?? 0
                            ).toLocaleString()}
                          </td>
                        </tr>

                      ))}

                    </tbody>

                  </table>

                )}

              </div>

            </div>

          </section>

        )}


      </main>


      {/* =================================================
          NEW: UPLOAD SUMMARY SIDE PANEL
      ================================================= */}

      {selectedUpload && (

        <>

          {/* backdrop */}
          <div
            onClick={() => setSelectedUpload(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(23, 32, 51, 0.35)",
              zIndex: 40,
            }}
          />

          {/* panel */}
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "380px",
              maxWidth: "90vw",
              background: "#ffffff",
              borderLeft: "1px solid #e3e7ed",
              boxShadow: "-8px 0 24px rgba(23, 32, 51, 0.12)",
              zIndex: 41,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >

            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid #eef1f5",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >

              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "#9aa2af",
                    marginBottom: "6px",
                  }}
                >
                  UPLOAD SUMMARY
                </div>

                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#172033",
                    wordBreak: "break-word",
                  }}
                >
                  {selectedUpload.filename}
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#929aa8",
                    marginTop: "4px",
                  }}
                >
                  {formatUploadDate(selectedUpload.uploaded_at)}
                </div>
              </div>

              <button
                className="icon-button"
                onClick={() => setSelectedUpload(null)}
                title="Close"
              >
                ✕
              </button>

            </div>

            <div style={{ padding: "20px 24px", display: "grid", gap: "14px" }}>

              <div className="issue-row">
                <span>Quality Score</span>
                <strong>
                  {selectedUpload.report?.quality_score ?? 0}%
                </strong>
              </div>

              <div className="issue-row">
                <span>Total Records</span>
                <strong>
                  {Number(
                    selectedUpload.report?.total_rows ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Clean Records</span>
                <strong>
                  {Number(
                    selectedUpload.report?.clean_rows ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Warning Rows</span>
                <strong>
                  {Number(
                    selectedUpload.report?.warning_rows ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Unresolved Rows</span>
                <strong>
                  {Number(
                    selectedUpload.report?.unresolved_rows ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Total Corrections</span>
                <strong>
                  {Number(
                    selectedUpload.report?.corrected_values ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Missing Values</span>
                <strong>
                  {Number(
                    selectedUpload.report?.missing_value_count ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div className="issue-row">
                <span>Duplicate Rows</span>
                <strong>
                  {Number(
                    selectedUpload.report?.duplicate_rows ?? 0
                  ).toLocaleString()}
                </strong>
              </div>

            </div>

          </aside>

        </>

      )}

    </div>

  );
}


export default App;