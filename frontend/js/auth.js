// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorMsg = document.getElementById('login-error');
    const successMsg = document.getElementById('login-success');
    
    if (urlParams.get('error') === 'true' && errorMsg) {
        errorMsg.innerText = 'Invalid username or password.';
        errorMsg.style.display = 'block';
    }
    
    if (urlParams.get('expired') === 'true' && errorMsg) {
        errorMsg.innerText = 'Your session has expired. Please sign in again.';
        errorMsg.style.display = 'block';
    }
    
    if (urlParams.get('logout') === 'true' && successMsg) {
        successMsg.innerText = 'You have been logged out successfully.';
        successMsg.style.display = 'block';
    }
});
