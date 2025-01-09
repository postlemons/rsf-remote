import pandas as panda# filepath: /c:/Users/Agent/Documents/GitHub/Remote-sheet-filter/main.py
from flask import Flask, render_template, request, send_file, redirect, url_for
import pandas as pd
import os
from io import BytesIO
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load credentials from the JSON file
SERVICE_ACCOUNT_FILE = 'token.json'
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive'
]
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

def fetch_google_sheet(spreadsheet_id, ranges):
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    data_frames = []

    for range_name in ranges:
        result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        print("Fetched data:", values)

        # Check if the data has the expected structure
        if not values:
            raise ValueError(f"No data found in the specified range: {range_name}")
        if len(values) < 2:
            raise ValueError(
                f"Insufficient data in range {range_name}: "
                "Expected at least one header row and one data row."
            )

        headers = values[0]
        data = values[1:]

        # Ensure all rows have the same number of columns as headers
        processed_data = []
        for row in data:
            if len(row) < len(headers):
                # Pad the row with None for missing columns
                row += [None] * (len(headers) - len(row))
            elif len(row) > len(headers):
                # Truncate the row to match the number of headers
                row = row[:len(headers)]
            processed_data.append(row)

        df = pd.DataFrame(processed_data, columns=headers)
        data_frames.append(df)

    return data_frames

def filter_and_remove_matches(df_online_list, df_local, column_name):
    """
    Compares two fields between a local file and an online Google Spreadsheet.
    If a match is found, removes it from the local sheet and returns the modified DataFrame.
    """
    print("Online DataFrames:")
    for df_online in df_online_list:
        print(df_online)
    print("Local DataFrame:")
    print(df_local)

    online_set = set()
    for df_online in df_online_list:
        if column_name not in df_online.columns:
            print(f"Column '{column_name}' not found in online DataFrame, skipping this range.")
            continue
        online_set.update(df_online[column_name].dropna().astype(str).str.strip())

    if column_name not in df_local.columns:
        raise ValueError(f"Column '{column_name}' not found in local DataFrame.")

    local_set = set(df_local[column_name].dropna().astype(str).str.strip())

    print("Online Set:", online_set)
    print("Local Set:", local_set)

    # Filter out rows where the specified column's value is in the online_set
    df_local_filtered = df_local[~df_local[column_name].astype(str).str.strip().isin(online_set)]

    print("Filtered Local DataFrame:")
    print(df_local_filtered)

    return df_local_filtered

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        try:
            local_file = request.files['local_file']
            google_sheet_url = request.form['google_sheet_url']
            column_name = request.form['column_name']

            local_file_path = os.path.join(UPLOAD_FOLDER, local_file.filename)
            local_file.save(local_file_path)
            df_local = pd.read_excel(local_file_path)

            # Extract spreadsheet ID from the URL
            spreadsheet_id = google_sheet_url.split('/d/')[1].split('/')[0]
            ranges = ['BETA', 'Responses 2']  # Define your ranges here

            df_online_list = fetch_google_sheet(spreadsheet_id, ranges)

            # Filter and remove matches
            df_local_filtered = filter_and_remove_matches(df_online_list, df_local, column_name)

            # Save the modified local file
            modified_local_path = os.path.join(UPLOAD_FOLDER, 'modified_local.xlsx')
            df_local_filtered.to_excel(modified_local_path, index=False)

            return render_template(
                "index.html",
                success=True,
                modified_local_download=url_for('download_file', filename='modified_local.xlsx')
            )
        except Exception as e:
            print(e)
            return render_template("index.html", success=False, error=str(e))

    return render_template("index.html")

@app.route("/download/<filename>")
def download_file(filename):
    return send_file(os.path.join(UPLOAD_FOLDER, filename), as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)