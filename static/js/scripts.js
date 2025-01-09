// scripts.js

// Display Current Year Dynamically
document.addEventListener('DOMContentLoaded', function() {
    var currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Handle Form Submission and Show Loading Spinner
    var uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function() {
            var loadingSpinner = document.getElementById('loading-spinner');
            if (loadingSpinner) {
                loadingSpinner.classList.remove('hidden');
            }
        });
    }
});