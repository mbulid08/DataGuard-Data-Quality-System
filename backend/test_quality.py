import pandas as pd

from quality_engine import run_quality_checks


# 1. Load CSV
df = pd.read_csv("sales_data.csv")


# 2. Run quality checks
(
    report,
    clean_df,
    error_df,
    warning_df,
    cleaning_log
) = run_quality_checks(df)


# 3. Display results
print("\n========== QUALITY REPORT ==========")
print(report)

print("\n========== CLEAN DATA ==========")
print(clean_df)

print("\n========== ERRORS ==========")
print(error_df)

print("\n========== WARNINGS ==========")
print(warning_df)

print("\n========== CLEANING LOG ==========")
print(cleaning_log)