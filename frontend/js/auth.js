// Authentication JavaScript
const API_BASE_URL = 'http://localhost:5001/api';

// Check if API is available
const checkAPIAvailability = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            timeout: 5000
        });
        return response.ok;
    } catch (error) {
        console.warn('Backend API not available, using fallback mode');
        return false;
    }
};

// Utility functions
const showError = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
};

const hideError = (elementId) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
};

const showAlert = (message, type = 'info') => {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' || type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Insert at the top of the form
    const form = document.querySelector('.auth-form');
    if (form) {
        form.insertBefore(alert, form.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
};

const setLoading = (buttonId, spinnerId, isLoading) => {
    const button = document.getElementById(buttonId);
    const spinner = document.getElementById(spinnerId);
    const btnText = button.querySelector('.btn-text');

    if (isLoading) {
        button.disabled = true;
        btnText.style.opacity = '0';
        spinner.style.display = 'block';
    } else {
        button.disabled = false;
        btnText.style.opacity = '1';
        spinner.style.display = 'none';
    }
};

// Password toggle functionality
const togglePassword = (inputId = 'password') => {
    const passwordInput = document.getElementById(inputId);
    const icon = document.getElementById(`${inputId}ToggleIcon`);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
};

// Password validation for registration
const validatePassword = (password) => {
    const requirements = {
        length: password.length >= 6,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password)
    };

    // Update UI indicators
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(req);
        if (element) {
            element.className = requirements[req] ? 'valid' : 'invalid';
        }
    });

    return Object.values(requirements).every(Boolean);
};

// Email validation
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Login form handling
const handleLogin = async (event) => {
    event.preventDefault();
    console.log('Login form submitted');
    
    // Clear previous errors
    ['emailError', 'passwordError'].forEach(hideError);
    
    const formData = new FormData(event.target);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');

    console.log('Login attempt:', { email, password: password ? '***' : 'empty' });

    // Validation
    let hasErrors = false;

    if (!email) {
        showError('emailError', 'Email is required');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password) {
        showError('passwordError', 'Password is required');
        hasErrors = true;
    } else if (password.length < 3) {
        showError('passwordError', 'Password must be at least 3 characters');
        hasErrors = true;
    }

    if (hasErrors) {
        console.log('Validation errors found');
        return;
    }

    setLoading('loginBtn', 'loginSpinner', true);

    try {
        console.log('Processing login...');
        
        // Call backend API
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok) {
            // Handle validation errors from backend
            if (data.errors && Array.isArray(data.errors)) {
                data.errors.forEach(error => {
                    const field = error.path;
                    const message = error.msg;
                    showError(`${field}Error`, message);
                });
                return;
            }
            throw new Error(data.message || 'Login failed');
        }

        if (data.success && data.token) {
            showAlert('Login successful! Redirecting...', 'success');
            
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log('User logged in successfully:', data.user);
            
            // Redirect after delay
            setTimeout(() => {
                console.log('Redirecting to home page...');
                window.location.href = 'index.html';
            }, 1500);
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid credentials') || error.message.includes('Invalid email or password')) {
            showError('passwordError', 'Invalid email or password');
        } else if (error.message.includes('Failed to fetch')) {
            showAlert('Unable to connect to server. Please check your connection and try again.', 'danger');
        } else {
            showAlert(error.message || 'Login failed. Please try again.', 'danger');
        }
    } finally {
        setLoading('loginBtn', 'loginSpinner', false);
    }
};

// Registration form handling
const handleRegister = async (event) => {
    event.preventDefault();
    console.log('Registration form submitted');
    
    // Clear previous errors
    ['nameError', 'emailError', 'passwordError', 'confirmPasswordError', 'termsError'].forEach(hideError);
    
    const formData = new FormData(event.target);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const aestheticPreference = formData.get('aestheticPreference');
    const terms = formData.get('terms');

    console.log('Registration attempt:', { name, email, hasPassword: !!password, terms });

    // Validation
    let hasErrors = false;

    if (!name || name.length < 2) {
        showError('nameError', 'Name must be at least 2 characters long');
        hasErrors = true;
    }

    if (!email) {
        showError('emailError', 'Email is required');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showError('emailError', 'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password) {
        showError('passwordError', 'Password is required');
        hasErrors = true;
    } else if (!validatePassword(password)) {
        showError('passwordError', 'Password must meet all requirements');
        hasErrors = true;
    }

    if (!confirmPassword) {
        showError('confirmPasswordError', 'Please confirm your password');
        hasErrors = true;
    } else if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        hasErrors = true;
    }

    if (!terms) {
        showError('termsError', 'You must agree to the terms and conditions');
        hasErrors = true;
    }

    if (hasErrors) {
        console.log('Validation errors found');
        return;
    }

    setLoading('registerBtn', 'registerSpinner', true);

    try {
        console.log('Processing registration...');
        
        // Check if API is available
        const isAPIAvailable = await checkAPIAvailability();
        let data;

        if (isAPIAvailable) {
            // Call backend API
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    aestheticPreference: aestheticPreference || 'eclectic'
                })
            });

            data = await response.json();
            console.log('Registration response:', data);

            if (!response.ok) {
                // Handle validation errors from backend
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(error => {
                        const field = error.path;
                        const message = error.msg;
                        showError(`${field}Error`, message);
                    });
                    return;
                }
                throw new Error(data.message || 'Registration failed');
            }

            if (!data.success || !data.token) {
                throw new Error('Invalid response from server');
            }
        } else {
            // Fallback mode - simulate successful registration
            console.log('Using fallback registration mode');
            data = {
                success: true,
                token: 'fallback_token_' + Date.now(),
                user: {
                    id: 'user_' + Date.now(),
                    name: name,
                    email: email,
                    role: 'user',
                    sustainabilityPoints: 50,
                    aestheticPreference: aestheticPreference || 'eclectic',
                    registrationTime: new Date().toISOString()
                }
            };
        }

        if (data.success && data.token) {
            showAlert('Registration successful! Welcome to Aestheticize!', 'success');
            
            // Store authentication data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('isLoggedIn', 'true');
            
            console.log('User registered successfully:', data.user);
            
            // Redirect after delay
            setTimeout(() => {
                console.log('Redirecting to home page...');
                window.location.href = 'index.html';
            }, 2000);
        } else {
            throw new Error('Registration failed');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message.includes('User already exists')) {
            showError('emailError', 'An account with this email already exists');
        } else if (error.message.includes('Failed to fetch')) {
            showAlert('Unable to connect to server. Using offline mode for demo.', 'warning');
            
            // Fallback registration
            const userData = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                role: 'user',
                sustainabilityPoints: 50,
                aestheticPreference: aestheticPreference || 'eclectic',
                registrationTime: new Date().toISOString()
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', 'demo_token_' + Date.now());
            localStorage.setItem('authToken', 'demo_auth_' + Date.now());
            localStorage.setItem('isLoggedIn', 'true');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } else {
            showAlert(error.message || 'Registration failed. Please try again.', 'error');
        }
    } finally {
        setLoading('registerBtn', 'registerSpinner', false);
    }
};

// Check if user is already logged in
const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Only redirect if we have valid session data AND user is actually logged in
    if (token && user && isLoggedIn === 'true') {
        try {
            const userData = JSON.parse(user);
            // Check if user data is valid
            if (userData && userData.email) {
                const currentPage = window.location.pathname;
                if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
                    console.log('User already logged in, redirecting to home');
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            // If user data is corrupted, clear it
            console.log('Corrupted user data, clearing...');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('isLoggedIn');
        }
    }
};

// Logout function - accessible from all pages
const logout = () => {
    console.log('Logout function called');
    
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlist');
    localStorage.removeItem('currentUser');
    
    console.log('All authentication data cleared');
    
    // Show confirmation message
    if (typeof showNotification === 'function') {
        showNotification('Logged out successfully!', 'success');
    } else {
        alert('Logged out successfully!');
    }
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        console.log('Redirecting to login page...');
        window.location.href = 'login.html';
    }, 1000);
};

// Make logout function globally accessible
window.logout = logout;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check auth status
    checkAuthStatus();

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Real-time password validation
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                validatePassword(e.target.value);
            });
        }

        // Confirm password validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', (e) => {
                const password = passwordInput.value;
                const confirmPassword = e.target.value;
                
                if (confirmPassword && password !== confirmPassword) {
                    showError('confirmPasswordError', 'Passwords do not match');
                } else {
                    hideError('confirmPasswordError');
                }
            });
        }
    }

    // Social auth buttons (placeholder functionality)
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showAlert('Social authentication coming soon!', 'info');
        });
    });
});

// Export functions for global use
window.togglePassword = togglePassword;
window.logout = logout;
