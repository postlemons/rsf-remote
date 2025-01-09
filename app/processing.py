import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
SERVICE_ACCOUNT_FILE = 'token.json'
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive'
]
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

def fetch_google_sheets(spreadsheet_id, ranges):
    """
    Fetches data from specified ranges in a Google Spreadsheet.
    """
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    data_frames = []

    for range_name in ranges:
        result = sheet.values().get(spreadsheetId=spreadsheet_id, range=range_name).execute()
        values = result.get('values', [])
        logger.info(f"Fetched data from range: {range_name}")
        print(values)

        # Check if the data has the expected structure
        if not values:
            print(f"No data found in the specified range: {range_name}")
            continue  # Skip this range instead of raising an error
        if len(values) < 2:
            print(f"Insufficient data in range {range_name}: Expected at least one header row and one data row.")
            continue  # Skip this range

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

def local_file_to_df(local_file_path):
    """
    Converts a local Excel file to a pandas DataFrame.
    """
    try:
       
        # Read the Excel file with date inference
        df = pd.read_excel(local_file_path)
        # Attempt to convert all object columns to datetime
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = pd.to_datetime(df[col], errors='ignore', infer_datetime_format=True)
        
        df = pd.read_excel(local_file_path)
        print("Local DataFrame loaded successfully.")
        return df
    except Exception as e:
        logger.error(f"Error loading local Excel file: {e}")
        raise

def filter_and_remove_matches(df_online_list, df_local, column_name):
    """
    Compares two fields between a local file and an online Google Spreadsheet.
    If a match is found, removes it from the local sheet and returns the modified DataFrame.
    """
    print("Filtering matches based on column:", column_name)
    print("Local DataFrame columns:", df_local.columns.tolist())

    online_set = set()
    for df_online in df_online_list:
        if column_name not in df_online.columns:
            print(f"Column '{column_name}' not found in online DataFrame, skipping this range.")
            continue
        # Convert to string and strip whitespace
        online_set.update(df_online[column_name].dropna().astype(str).str.strip())

    if column_name not in df_local.columns:
        raise ValueError(f"Column '{column_name}' not found in local DataFrame.")

    # Convert to string and strip whitespace
    local_set = set(df_local[column_name].dropna().astype(str).str.strip())

    print("Online Set:", online_set)
    print("Local Set:", local_set)

    # Filter out rows where the specified column's value is in the online_set
    df_local_filtered = df_local[~df_local[column_name].astype(str).str.strip().isin(online_set)]

    print("Filtered Local DataFrame:")
    print(df_local_filtered)

    return df_local_filtered

def save_df_to_excel(df, file_path):
    """
    Saves the DataFrame to an Excel file, preserving date formats without specifying date columns.
    """
    try:
        with pd.ExcelWriter(file_path, engine='xlsxwriter', datetime_format='mm/dd/yyyy') as writer:
            df.to_excel(writer, index=False, sheet_name='Sheet1')
            workbook  = writer.book
            worksheet = writer.sheets['Sheet1']
            
            # Automatically detect date columns
            date_columns = df.select_dtypes(include=['datetime64[ns]', 'datetime64[ns, UTC]']).columns
            
            # Define a date format
            date_format = workbook.add_format({'num_format': 'mm/dd/yyyy'})
            
            # Apply the date format to each detected date column
            for column in date_columns:
                col_idx = df.columns.get_loc(column)
                # Set column width and apply date format; adjust width as needed
                worksheet.set_column(col_idx, col_idx, 15, date_format)
        
        print(f"DataFrame successfully saved to {file_path} with date formats preserved.")
    except Exception as e:
        logger.error(f"Error saving DataFrame to Excel: {e}")
        raise

