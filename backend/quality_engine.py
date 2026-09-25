import pandas as pd
import re


def run_quality_checks(df: pd.DataFrame):

    # =====================================================
    # 1. INITIAL SETUP
    # =====================================================

    df = df.copy().reset_index(drop=True)
    original_df = df.copy()

    cleaning_log = []
    unresolved_errors = []
    warning_errors = []

    # =====================================================
    # 2. NORMALIZE COLUMN NAMES
    # =====================================================

    df.columns = [
        str(column).strip().lower().replace(" ", "_")
        for column in df.columns
    ]

    # =====================================================
    # 3. EMPTY / UNKNOWN VALUES → MISSING
    # =====================================================

    missing_tokens = {
        "",
        "nan",
        "none",
        "null",
        "n/a",
        "na",
        "unknown",
        "not available",
        "not_available",
        "-"
    }

    for column in df.columns:

        for index in df.index:

            value = df.at[index, column]

            if pd.isna(value):
                continue

            text_value = str(value).strip()

            if text_value.lower() in missing_tokens:

                df.at[index, column] = pd.NA

                cleaning_log.append({
                    "row": int(index) + 1,
                    "column": column,
                    "action": "Converted empty/unknown value to missing",
                    "original_value": text_value,
                    "new_value": ""
                })

            elif text_value != str(value):

                df.at[index, column] = text_value

                cleaning_log.append({
                    "row": int(index) + 1,
                    "column": column,
                    "action": "Trimmed whitespace",
                    "original_value": str(value),
                    "new_value": text_value
                })

    # =====================================================
    # 4. STANDARDIZE CATEGORICAL VALUES
    # =====================================================

    text_standardization = {

        "region": {
            "west": "West",
            "w": "West",
            "east": "East",
            "e": "East",
            "north": "North",
            "n": "North",
            "south": "South",
            "s": "South"
        },

        "sales_channel": {
            "online": "Online",
            "offline": "Offline",
            "amazon": "Amazon",
            "flipkart": "Flipkart"
        },

        "payment_mode": {
            "upi": "UPI",
            "cash": "Cash",
            "credit card": "Credit Card",
            "credit_card": "Credit Card",
            "debit card": "Debit Card",
            "debit_card": "Debit Card",
            "cod": "COD"
        },

        "order_status": {
            "delivered": "Delivered",
            "pending": "Pending",
            "cancelled": "Cancelled",
            "canceled": "Cancelled",
            "returned": "Returned"
        },

        "category": {
            "electronics": "Electronics",
            "electronic": "Electronics",
            "accessories": "Accessories",
            "accessory": "Accessories",
            "grocery": "Grocery",
            "groceries": "Grocery",
            "clothing": "Clothing",
            "cloth": "Clothing"
        }
    }

    for column, mapping in text_standardization.items():

        if column not in df.columns:
            continue

        for index in df.index:

            value = df.at[index, column]

            if pd.isna(value):
                continue

            normalized = str(value).strip().lower()

            if normalized in mapping:

                new_value = mapping[normalized]

                if str(value) != new_value:

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": column,
                        "action": "Standardized categorical value",
                        "original_value": str(value),
                        "new_value": new_value
                    })

                    df.at[index, column] = new_value

    # =====================================================
    # 5. STANDARDIZE NAMES
    # =====================================================
    #
    # CHANGE: "city" added to this list so that values like
    # "surat" become "Surat".
    # =====================================================

    for column in ["customer_name", "salesperson", "city"]:

        if column not in df.columns:
            continue

        for index in df.index:

            value = df.at[index, column]

            if pd.isna(value):
                continue

            original_value = str(value).strip()

            new_value = " ".join(
                original_value.split()
            ).title()

            if original_value != new_value:

                cleaning_log.append({
                    "row": int(index) + 1,
                    "column": column,
                    "action": "Standardized name",
                    "original_value": original_value,
                    "new_value": new_value
                })

                df.at[index, column] = new_value

    # =====================================================
    # 5B. STANDARDIZE ORDER ID   (NEW SECTION)
    # =====================================================
    #
    # ORD1004, ord-1003, ORD_1005, "ord 1006"  →  ORD-xxxx
    # =====================================================

    if "order_id" in df.columns:

        for index in df.index:

            value = df.at[index, "order_id"]

            if pd.isna(value):
                continue

            original = str(value).strip()

            match = re.match(
                r"^ord[-_ ]?(\d+)$",
                original,
                re.IGNORECASE
            )

            if match:

                new_value = f"ORD-{match.group(1)}"

                if new_value != original:

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "order_id",
                        "action": "Standardized order ID",
                        "original_value": original,
                        "new_value": new_value
                    })

                    df.at[index, "order_id"] = new_value

    # =====================================================
    # 6. PRODUCT → CATEGORY INFERENCE
    # =====================================================

    if "product" in df.columns and "category" in df.columns:

        valid_category_data = df.dropna(
            subset=["product", "category"]
        )

        product_category_map = {}

        if not valid_category_data.empty:

            for product, group in valid_category_data.groupby("product"):

                counts = group["category"].value_counts()

                if len(counts) == 0:
                    continue

                top_category = counts.index[0]
                top_count = counts.iloc[0]
                total_count = counts.sum()

                confidence = top_count / total_count

                # Only infer when confidence is high enough
                if confidence >= 0.80:

                    product_category_map[
                        product
                    ] = top_category

        for index in df.index:

            if not pd.isna(df.at[index, "category"]):
                continue

            product = df.at[index, "product"]

            if pd.isna(product):
                continue

            if product in product_category_map:

                inferred_category = product_category_map[
                    product
                ]

                df.at[index, "category"] = inferred_category

                cleaning_log.append({
                    "row": int(index) + 1,
                    "column": "category",
                    "action": "Inferred category from product",
                    "original_value": "",
                    "new_value": str(inferred_category)
                })

    # =====================================================
    # 7. CITY → REGION INFERENCE
    # =====================================================

    if "city" in df.columns and "region" in df.columns:

        valid_region_data = df.dropna(
            subset=["city", "region"]
        )

        city_region_map = {}

        if not valid_region_data.empty:

            for city, group in valid_region_data.groupby("city"):

                counts = group["region"].value_counts()

                if len(counts) == 0:
                    continue

                top_region = counts.index[0]
                top_count = counts.iloc[0]
                total_count = counts.sum()

                confidence = top_count / total_count

                if confidence >= 0.80:

                    city_region_map[
                        city
                    ] = top_region

        for index in df.index:

            if not pd.isna(df.at[index, "region"]):
                continue

            city = df.at[index, "city"]

            if pd.isna(city):
                continue

            if city in city_region_map:

                inferred_region = city_region_map[city]

                df.at[index, "region"] = inferred_region

                cleaning_log.append({
                    "row": int(index) + 1,
                    "column": "region",
                    "action": "Inferred region from city",
                    "original_value": "",
                    "new_value": str(inferred_region)
                })

    # =====================================================
    # 8. DATE VALIDATION + STANDARDIZATION
    # =====================================================

    invalid_date_errors = []

    if "order_date" in df.columns:

        for index in df.index:

            value = df.at[index, "order_date"]

            if pd.isna(value):

                warning_errors.append({
                    "row": int(index) + 1,
                    "column": "order_date",
                    "issue": "Missing date",
                    "value": ""
                })

                continue

            original_value = str(value).strip()

            parsed_date = pd.to_datetime(
                original_value,
                errors="coerce",
                dayfirst=True
            )

            if pd.isna(parsed_date):

                error = {
                    "row": int(index) + 1,
                    "column": "order_date",
                    "issue": "Invalid date",
                    "value": original_value
                }

                invalid_date_errors.append(error)
                unresolved_errors.append(error)

            else:

                new_value = parsed_date.strftime(
                    "%Y-%m-%d"
                )

                if original_value != new_value:

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "order_date",
                        "action": "Standardized date format",
                        "original_value": original_value,
                        "new_value": new_value
                    })

                df.at[index, "order_date"] = new_value

    # =====================================================
    # 9. QUANTITY VALIDATION
    # =====================================================

    invalid_quantity_errors = []

    if "quantity" in df.columns:

        numeric_quantity = pd.to_numeric(
            df["quantity"],
            errors="coerce"
        )

        for index in df.index:

            value = df.at[index, "quantity"]

            if pd.isna(value):

                warning_errors.append({
                    "row": int(index) + 1,
                    "column": "quantity",
                    "issue": "Missing quantity",
                    "value": ""
                })

                continue

            converted = numeric_quantity.iloc[index]

            if pd.isna(converted):

                error = {
                    "row": int(index) + 1,
                    "column": "quantity",
                    "issue": "Invalid quantity",
                    "value": str(value)
                }

                invalid_quantity_errors.append(error)
                unresolved_errors.append(error)

            elif converted <= 0:

                error = {
                    "row": int(index) + 1,
                    "column": "quantity",
                    "issue": "Quantity must be greater than zero",
                    "value": str(value)
                }

                invalid_quantity_errors.append(error)
                unresolved_errors.append(error)

            else:

                df.at[index, "quantity"] = converted

                if str(value) != str(converted):

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "quantity",
                        "action": "Converted quantity to numeric",
                        "original_value": str(value),
                        "new_value": str(converted)
                    })

    # =====================================================
    # 10. UNIT PRICE CLEANING
    # =====================================================

    invalid_price_errors = []

    if "unit_price" in df.columns:

        price_series = (
            df["unit_price"]
            .astype("string")
            .str.replace(",", "", regex=False)
            .str.replace("₹", "", regex=False)
            .str.replace("$", "", regex=False)
            .str.strip()
        )

        numeric_price = pd.to_numeric(
            price_series,
            errors="coerce"
        )

        product_price_map = {}

        if "product" in df.columns:

            price_data = pd.DataFrame({
                "product": df["product"],
                "price": numeric_price
            })

            price_data = price_data.dropna(
                subset=["product", "price"]
            )

            if not price_data.empty:

                product_price_map = (
                    price_data
                    .groupby("product")["price"]
                    .median()
                    .to_dict()
                )

        for index in df.index:

            original_value = df.at[index, "unit_price"]
            numeric_value = numeric_price.iloc[index]

            if pd.isna(original_value):

                product = None

                if "product" in df.columns:
                    product = df.at[index, "product"]

                if (
                    pd.notna(product)
                    and product in product_price_map
                ):

                    inferred_price = product_price_map[
                        product
                    ]

                    numeric_price.iloc[index] = inferred_price

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "unit_price",
                        "action": "Inferred unit price from product",
                        "original_value": "",
                        "new_value": str(inferred_price)
                    })

                else:

                    warning_errors.append({
                        "row": int(index) + 1,
                        "column": "unit_price",
                        "issue": "Missing unit price",
                        "value": ""
                    })

            elif pd.isna(numeric_value):

                error = {
                    "row": int(index) + 1,
                    "column": "unit_price",
                    "issue": "Invalid unit price",
                    "value": str(original_value)
                }

                invalid_price_errors.append(error)
                unresolved_errors.append(error)

            elif numeric_value <= 0:

                error = {
                    "row": int(index) + 1,
                    "column": "unit_price",
                    "issue": "Unit price must be greater than zero",
                    "value": str(original_value)
                }

                invalid_price_errors.append(error)
                unresolved_errors.append(error)

            else:

                cleaned_value = float(numeric_value)

                df.at[index, "unit_price"] = cleaned_value

                if str(original_value) != str(cleaned_value):

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "unit_price",
                        "action": "Standardized unit price",
                        "original_value": str(original_value),
                        "new_value": str(cleaned_value)
                    })

        # Apply inferred/cleaned values
        for index in df.index:

            if pd.notna(numeric_price.iloc[index]):

                df.at[index, "unit_price"] = float(
                    numeric_price.iloc[index]
                )

    # =====================================================
    # 11. DISCOUNT VALIDATION
    # =====================================================

    invalid_discount_errors = []

    if "discount_%" in df.columns:

        discount_series = (
            df["discount_%"]
            .astype("string")
            .str.replace("%", "", regex=False)
            .str.strip()
        )

        numeric_discount = pd.to_numeric(
            discount_series,
            errors="coerce"
        )

        for index in df.index:

            original_value = df.at[index, "discount_%"]

            if pd.isna(original_value):

                warning_errors.append({
                    "row": int(index) + 1,
                    "column": "discount_%",
                    "issue": "Missing discount",
                    "value": ""
                })

                continue

            numeric_value = numeric_discount.iloc[index]

            if pd.isna(numeric_value):

                error = {
                    "row": int(index) + 1,
                    "column": "discount_%",
                    "issue": "Invalid discount",
                    "value": str(original_value)
                }

                invalid_discount_errors.append(error)
                unresolved_errors.append(error)

            elif numeric_value < 0 or numeric_value > 100:

                error = {
                    "row": int(index) + 1,
                    "column": "discount_%",
                    "issue": "Discount must be between 0 and 100",
                    "value": str(original_value)
                }

                invalid_discount_errors.append(error)
                unresolved_errors.append(error)

            else:

                df.at[index, "discount_%"] = float(
                    numeric_value
                )

                if (
                    str(original_value)
                    .replace("%", "")
                    .strip()
                    != str(numeric_value)
                ):

                    cleaning_log.append({
                        "row": int(index) + 1,
                        "column": "discount_%",
                        "action": "Standardized discount percentage",
                        "original_value": str(original_value),
                        "new_value": str(numeric_value)
                    })

    # =====================================================
    # 12. REQUIRED FIELD CHECK
    # =====================================================
    #
    # Missing required fields are treated as warnings
    # instead of automatically rejecting the entire row.
    # =====================================================

    required_columns = [
        "order_id",
        "order_date",
        "customer_name",
        "product",
        "category",
        "city",
        "region",
        "sales_channel",
        "payment_mode",
        "quantity",
        "unit_price",
        "order_status",
        "salesperson"
    ]

    for column in required_columns:

        if column not in df.columns:
            continue

        for index in df.index:

            if pd.isna(df.at[index, column]):

                warning_errors.append({
                    "row": int(index) + 1,
                    "column": column,
                    "issue": "Missing value",
                    "value": ""
                })

    # =====================================================
    # 13. EMAIL VALIDATION
    # =====================================================

    email_pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"

    invalid_email_errors = []

    for column in df.columns:

        if "email" not in column:
            continue

        for index in df.index:

            value = df.at[index, column]

            if pd.isna(value):
                continue

            value = str(value).strip()

            if not re.match(email_pattern, value):

                error = {
                    "row": int(index) + 1,
                    "column": column,
                    "issue": "Invalid email",
                    "value": value
                }

                invalid_email_errors.append(error)
                unresolved_errors.append(error)

    # =====================================================
    # 14. PHONE VALIDATION
    # =====================================================

    invalid_phone_errors = []

    for column in df.columns:

        if (
            "phone" not in column
            and "mobile" not in column
        ):
            continue

        for index in df.index:

            value = df.at[index, column]

            if pd.isna(value):
                continue

            cleaned_phone = re.sub(
                r"[\s\-\(\)]",
                "",
                str(value)
            )

            if not re.match(
                r"^\+?[0-9]{10,15}$",
                cleaned_phone
            ):

                error = {
                    "row": int(index) + 1,
                    "column": column,
                    "issue": "Invalid phone",
                    "value": cleaned_phone
                }

                invalid_phone_errors.append(error)
                unresolved_errors.append(error)

    # =====================================================
    # 15. DUPLICATE RECORD DETECTION
    # =====================================================

    duplicate_mask = df.duplicated(
        keep="first"
    )

    duplicate_errors = []

    for index in df.index[duplicate_mask]:

        error = {
            "row": int(index) + 1,
            "column": "",
            "issue": "Duplicate record",
            "value": ""
        }

        duplicate_errors.append(error)
        unresolved_errors.append(error)

    # =====================================================
    # 16. ERROR DATAFRAME
    # =====================================================

    error_columns = [
        "row",
        "column",
        "issue",
        "value"
    ]

    if unresolved_errors:

        error_df = pd.DataFrame(
            unresolved_errors,
            columns=error_columns
        )

    else:

        error_df = pd.DataFrame(
            columns=error_columns
        )

    # =====================================================
    # 17. WARNING DATAFRAME
    # =====================================================

    if warning_errors:

        warning_df = pd.DataFrame(
            warning_errors,
            columns=error_columns
        )

    else:

        warning_df = pd.DataFrame(
            columns=error_columns
        )

    # =====================================================
    # 18. DETERMINE UNRESOLVED ROWS
    # =====================================================

    error_rows = set()

    for error in unresolved_errors:

        error_rows.add(
            error["row"] - 1
        )

    # =====================================================
    # 19. REMOVE DUPLICATES
    # =====================================================

    cleaned_df = df.drop_duplicates(
        keep="first"
    ).copy()

    # =====================================================
    # 20. FINAL CLEAN DATA
    # =====================================================

    final_clean_data = cleaned_df[
        ~cleaned_df.index.isin(error_rows)
    ].copy()

    # =====================================================
    # 21. DATA PROFILING
    # =====================================================

    column_profile = {}

    for column in original_df.columns:

        column_profile[column] = {

            "data_type": str(
                original_df[column].dtype
            ),

            "total_values": int(
                len(original_df[column])
            ),

            "missing_values": int(
                original_df[column].isna().sum()
            ),

            "unique_values": int(
                original_df[column].nunique(
                    dropna=True
                )
            )
        }

    # =====================================================
    # 22. QUALITY METRICS
    # =====================================================

    total_rows = len(original_df)

    clean_rows = len(final_clean_data)

    unresolved_rows = len(error_rows)

    warning_rows = len(
        set(
            warning["row"] - 1
            for warning in warning_errors
        )
    )

    corrected_values = len(
        cleaning_log
    )

    # Row validity rate
    row_validity_rate = 0

    if total_rows > 0:

        row_validity_rate = round(
            (clean_rows / total_rows) * 100,
            2
        )

    # =====================================================
    # 23. QUALITY REPORT
    # =====================================================

    report = {

        "total_rows": total_rows,

        "clean_rows": clean_rows,

        "warning_rows": warning_rows,

        "unresolved_rows": unresolved_rows,

        "corrected_values": corrected_values,

        "duplicate_rows": len(
            duplicate_errors
        ),

        "missing_value_count": int(
            original_df.isna().sum().sum()
        ),

        "invalid_date_count": len(
            invalid_date_errors
        ),

        "invalid_quantity_count": len(
            invalid_quantity_errors
        ),

        "invalid_price_count": len(
            invalid_price_errors
        ),

        "invalid_discount_count": len(
            invalid_discount_errors
        ),

        "invalid_email_count": len(
            invalid_email_errors
        ),

        "invalid_phone_count": len(
            invalid_phone_errors
        ),

        "quality_score": row_validity_rate,

        "column_profile": column_profile
    }

    # =====================================================
    # 24. RETURN RESULTS
    # =====================================================

    return (
    report,
    final_clean_data,
    error_df,
    warning_df,
    pd.DataFrame(cleaning_log)
)