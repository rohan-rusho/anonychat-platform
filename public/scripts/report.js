// Report page functionality
class ReportManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.prefillTimestamp();
    }

    setupEventListeners() {
        const reportForm = document.getElementById('reportForm');
        const reportDescription = document.getElementById('reportDescription');

        if (reportForm) {
            reportForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReport();
            });
        }

        if (reportDescription) {
            reportDescription.addEventListener('input', () => {
                this.updateCharCounter();
            });
        }

        // Handle issue type selection
        document.querySelectorAll('input[name="issueType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleIssueTypeChange();
            });
        });

        // Handle contact email toggle
        const contactEmail = document.getElementById('contactEmail');
        if (contactEmail) {
            contactEmail.addEventListener('input', () => {
                this.validateEmail();
            });
        }
    }

    setupFormValidation() {
        // Real-time validation
        const form = document.getElementById('reportForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    prefillTimestamp() {
        const timestampInput = document.getElementById('timestamp');
        if (timestampInput) {
            // Set to current time minus 5 minutes (approximate time issue occurred)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            timestampInput.value = fiveMinutesAgo.toISOString().slice(0, 16);
        }

        // If we have session data from a chat, prefill session ID
        const sessionIdInput = document.getElementById('sessionId');
        if (sessionIdInput) {
            try {
                const chatData = JSON.parse(sessionStorage.getItem('chatData') || '{}');
                if (chatData.roomId) {
                    sessionIdInput.value = chatData.roomId;
                }
            } catch (error) {
                console.log('No chat session data found');
            }
        }
    }

    handleIssueTypeChange() {
        const selectedIssue = document.querySelector('input[name="issueType"]:checked');
        const descriptionField = document.getElementById('reportDescription');

        if (selectedIssue && descriptionField) {
            // Update placeholder text based on selected issue
            const placeholders = {
                harassment: 'Please describe the threatening, intimidating, or abusive behavior you experienced...',
                nudity: 'Please describe the inappropriate content you encountered...',
                spam: 'Please describe the spam or scam content you received...',
                underage: 'Please describe why you believe this user is under 18...',
                hate: 'Please describe the discriminatory language or content...',
                illegal: 'Please describe the illegal activity you encountered...',
                other: 'Please provide details about the issue you encountered...'
            };

            descriptionField.placeholder = placeholders[selectedIssue.value] ||
                'Please provide details about the issue...';
        }
    }

    updateCharCounter() {
        const textarea = document.getElementById('reportDescription');
        const counter = document.querySelector('.char-counter');

        if (textarea && counter) {
            const currentLength = textarea.value.length;
            const maxLength = textarea.maxLength || 1000;
            counter.textContent = `${currentLength}/${maxLength} characters`;

            // Change color when approaching limit
            if (currentLength > maxLength * 0.9) {
                counter.style.color = 'var(--warning)';
            } else if (currentLength === maxLength) {
                counter.style.color = 'var(--danger)';
            } else {
                counter.style.color = 'var(--text-muted)';
            }
        }
    }

    validateField(field) {
        const fieldGroup = field.closest('.form-group');
        if (!fieldGroup) return;

        // Remove existing validation classes
        fieldGroup.classList.remove('field-valid', 'field-invalid');

        let isValid = true;
        let errorMessage = '';

        switch (field.type) {
            case 'email':
                if (field.value && !this.isValidEmail(field.value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'radio':
                const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
                isValid = Array.from(radioGroup).some(radio => radio.checked);
                if (!isValid) {
                    errorMessage = 'Please select an option';
                }
                break;

            default:
                if (field.required && !field.value.trim()) {
                    isValid = false;
                    errorMessage = 'This field is required';
                }
                break;
        }

        // Update UI
        if (isValid) {
            fieldGroup.classList.add('field-valid');
            this.removeErrorMessage(fieldGroup);
        } else {
            fieldGroup.classList.add('field-invalid');
            this.showFieldError(fieldGroup, errorMessage);
        }

        return isValid;
    }

    validateEmail() {
        const emailField = document.getElementById('contactEmail');
        if (emailField) {
            this.validateField(emailField);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFieldError(fieldGroup, message) {
        // Remove existing error message
        this.removeErrorMessage(fieldGroup);

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: var(--danger);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        errorDiv.textContent = message;

        fieldGroup.appendChild(errorDiv);
    }

    removeErrorMessage(fieldGroup) {
        const existingError = fieldGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    validateForm() {
        const form = document.getElementById('reportForm');
        if (!form) return false;

        let isValid = true;
        const formData = new FormData(form);

        // Validate issue type selection
        const issueType = formData.get('issueType');
        if (!issueType) {
            this.showError('Please select the type of issue you want to report.');
            isValid = false;
        }

        // Validate description if it's required for certain issue types
        const description = document.getElementById('reportDescription').value.trim();
        const criticalIssues = ['harassment', 'illegal', 'underage'];

        if (criticalIssues.includes(issueType) && description.length < 10) {
            this.showError('Please provide more details about this serious issue (at least 10 characters).');
            isValid = false;
        }

        // Validate email if provided
        const email = document.getElementById('contactEmail').value.trim();
        if (email && !this.isValidEmail(email)) {
            this.showError('Please enter a valid email address or leave it blank.');
            isValid = false;
        }

        return isValid;
    }

    async submitReport() {
        if (!this.validateForm()) {
            return;
        }

        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        try {
            const formData = this.getFormData();

            // Here you would normally send to your backend
            // For now, we'll simulate the submission
            await this.sendReportToServer(formData);

            this.showSuccessModal();

        } catch (error) {
            console.error('Error submitting report:', error);
            this.showError('Failed to submit report. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Report';
            }
        }
    }

    getFormData() {
        const form = document.getElementById('reportForm');
        const formData = new FormData(form);

        return {
            issueType: formData.get('issueType'),
            description: document.getElementById('reportDescription').value.trim(),
            sessionId: document.getElementById('sessionId').value.trim(),
            timestamp: document.getElementById('timestamp').value,
            contactEmail: document.getElementById('contactEmail').value.trim(),
            reportedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    async sendReportToServer(reportData) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Log the report data (in a real app, this would go to your backend)
                console.log('Report submitted:', reportData);

                // Store in localStorage for demo purposes
                const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
                existingReports.push({
                    id: Date.now(),
                    ...reportData
                });
                localStorage.setItem('reports', JSON.stringify(existingReports));

                resolve({ success: true });
            }, 1000);
        });
    }

    showSuccessModal() {
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.add('active');
        }
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--danger);
            color: white;
            padding: 1rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;

        toast.innerHTML = `
            <span>⚠️</span>
            <span>${this.sanitizeHTML(message)}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                padding: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    sanitizeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Static method to get all reports (for admin purposes)
    static getAllReports() {
        return JSON.parse(localStorage.getItem('reports') || '[]');
    }

    // Static method to clear all reports
    static clearAllReports() {
        localStorage.removeItem('reports');
    }
}

// Add CSS for form validation styles
const validationStyles = document.createElement('style');
validationStyles.textContent = `
    .field-valid input,
    .field-valid textarea,
    .field-valid select {
        border-color: var(--success);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
    }
    
    .field-invalid input,
    .field-invalid textarea,
    .field-invalid select {
        border-color: var(--danger);
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
    }
    
    .field-error {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(validationStyles);

// Initialize report manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const reportManager = new ReportManager();

    // Make globally accessible for debugging
    window.reportManager = reportManager;

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});
