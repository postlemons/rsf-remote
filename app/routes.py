from flask import Blueprint, render_template, request, send_file, url_for, current_app, redirect
import os
from datetime import datetime
from .processing import fetch_google_sheets, filter_and_remove_matches, local_file_to_df, save_df_to_excel

main = Blueprint('main', __name__)

@main.route("/", methods=["GET", "POST"])
def index():
    current_year = datetime.now().year
    if request.method == "POST":
        try:
            # Retrieve form data
            local_file = request.files['local_file']
            google_sheet_url = request.form['google_sheet_url']
            column_name = request.form['column_name']
            sheet_ranges = ["BETA", "Responses 2"] #request.form.getlist('BETA', "Responses 2")  # Get all sheet ranges as a list
            print(sheet_ranges)
            if not sheet_ranges:
                raise ValueError("At least one sheet range must be provided.")

            # Save the uploaded local file
            local_file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], local_file.filename)
            local_file.save(local_file_path)

            # Process local Excel file with automatic date parsing
            df_local = local_file_to_df(local_file_path)

            # Extract spreadsheet ID from the URL
            spreadsheet_id = extract_spreadsheet_id(google_sheet_url)

            # Fetch online data
            df_online_list = fetch_google_sheets(spreadsheet_id, sheet_ranges)

            if not df_online_list:
                raise ValueError("No valid data fetched from the provided sheet ranges.")

            # Filter and remove matches
            df_local_filtered = filter_and_remove_matches(df_online_list, df_local, column_name)

            # Save the modified local file with proper date formatting
            modified_local_filename = f'modified_{local_file.filename}'
            modified_local_path = os.path.join(current_app.config['UPLOAD_FOLDER'], modified_local_filename)
            save_df_to_excel(df_local_filtered, modified_local_path)

            return render_template(
                "index.html",
                success=True,
                modified_local_download=url_for('main.download_file', filename=modified_local_filename),
                current_year=current_year
            )
        except Exception as e:
            print(e)
            return render_template(
                "index.html",
                success=False,
                error=str(e),
                current_year=current_year
            )

    return render_template("index.html", current_year=current_year)
    
@main.route("/download/<filename>")
def download_file(filename):
    try:
        return send_file(os.path.join(current_app.config['UPLOAD_FOLDER'], filename), as_attachment=True)
    except Exception as e:
        print(e)
        # Handle error or redirect as needed
        return redirect(url_for('main.index'))

def extract_spreadsheet_id(url):
    """
    Extracts the spreadsheet ID from the Google Sheets URL.
    """
    try:
        return url.split('/d/')[1].split('/')[0]
    except IndexError:
        raise ValueError("Invalid Google Sheets URL.")