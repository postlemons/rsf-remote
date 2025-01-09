document.addEventListener('DOMContentLoaded', function() {
    const addSheetBtn = document.getElementById('add-sheet-btn');
    const sheetsContainer = document.getElementById('sheets-container');
    const LoadingSpinner = document.getElementById('loading-spinner');
    setTimeout(() => {
        LoadingSpinner.remove();
    }, 2000);
  
    // Add new sheet input
    if (addSheetBtn) {
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