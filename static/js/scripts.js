document.addEventListener('DOMContentLoaded', function() {
    const addSheetBtn = document.getElementById('add-sheet-btn');
    const sheetsContainer = document.getElementById('sheets-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const uploadForm = document.getElementById('upload-form');
    const submitBtn = uploadForm ? uploadForm.querySelector('button[type="submit"]') : null;
    setTimeout(() => loadingSpinner.hidden = true, 1000); // Hide the spinner initially
    // Show spinner and disable submit button on form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            if (loadingSpinner) {
                loadingSpinner.hidden = false; // Show the spinner
            }
            if (submitBtn) {
                submitBtn.disabled = true; // Disable the submit button to prevent multiple submissions
            }
        });
    }

    // Add new sheet input
    if (addSheetBtn && sheetsContainer) {
        addSheetBtn.addEventListener('click', function() {
            const sheetInputGroup = document.createElement('div');
            sheetInputGroup.classList.add('input-group', 'mb-2', 'sheet-input');

            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'sheet_ranges[]';
            input.classList.add('form-control');
            input.placeholder = 'e.g., Sheet1!A1:C40';
            input.required = true;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.classList.add('btn', 'btn-danger', 'remove-sheet-btn');
            removeBtn.textContent = 'Remove';

            sheetInputGroup.appendChild(input);
            sheetInputGroup.appendChild(removeBtn);
            sheetsContainer.appendChild(sheetInputGroup);
        });
    }

    // Remove sheet input
    if (sheetsContainer) {
        sheetsContainer.addEventListener('click', function(e) {
            if (e.target && e.target.matches('button.remove-sheet-btn')) {
                const sheetInput = e.target.parentElement;
                sheetsContainer.removeChild(sheetInput);
            }
        });
    }
});