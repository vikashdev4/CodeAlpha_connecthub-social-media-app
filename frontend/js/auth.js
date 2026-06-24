/* =========================================================
   ConnectHub — auth.js
   Powers login.html and register.html. Only one of the two
   forms will exist in the DOM at a time, so each handler
   simply checks whether its form is present before wiring up.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Already logged in? Skip straight to the feed.
  if (Storage.getToken()) {
    window.location.href = 'feed.html';
    return;
  }

  wireLoginForm();
  wireRegisterForm();
});

function setFieldError(fieldEl, message) {
  fieldEl.classList.add('has-error');
  const errorEl = fieldEl.querySelector('.field-error');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldEl) {
  fieldEl.classList.remove('has-error');
}

function shakeForm(form) {
  form.classList.add('shake');
  setTimeout(() => form.classList.remove('shake'), 450);
}

/* ---------------------------------------------------------
   Login
   --------------------------------------------------------- */
function wireLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const identifierField = document.getElementById('loginIdentifierField');
  const passwordField = document.getElementById('loginPasswordField');
  const submitBtn = document.getElementById('loginSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    [identifierField, passwordField].forEach(clearFieldError);

    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    let hasError = false;
    if (!identifier) {
      setFieldError(identifierField, 'Enter your email or username');
      hasError = true;
    }
    if (!password) {
      setFieldError(passwordField, 'Enter your password');
      hasError = true;
    }
    if (hasError) {
      shakeForm(form);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner spinner-sm" style="border-top-color:#fff;border-right-color:#fff;margin:0;"></span> Logging in...`;

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { emailOrUsername: identifier, password },
      });
      Storage.setToken(data.token);
      Storage.setUser(data.user);
      showToast(`Welcome back, ${data.user.username}!`, 'success');
      setTimeout(() => (window.location.href = 'feed.html'), 400);
    } catch (err) {
      shakeForm(form);
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log In';
    }
  });
}

/* ---------------------------------------------------------
   Register
   --------------------------------------------------------- */
function wireRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const usernameField = document.getElementById('regUsernameField');
  const emailField = document.getElementById('regEmailField');
  const passwordField = document.getElementById('regPasswordField');
  const confirmField = document.getElementById('regConfirmField');
  const submitBtn = document.getElementById('registerSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    [usernameField, emailField, passwordField, confirmField].forEach(clearFieldError);

    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    let hasError = false;

    if (!/^[a-zA-Z0-9._]{3,30}$/.test(username)) {
      setFieldError(usernameField, '3-30 characters: letters, numbers, dots or underscores');
      hasError = true;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError(emailField, 'Enter a valid email address');
      hasError = true;
    }
    if (password.length < 6) {
      setFieldError(passwordField, 'Password must be at least 6 characters');
      hasError = true;
    }
    if (confirm !== password) {
      setFieldError(confirmField, 'Passwords do not match');
      hasError = true;
    }

    if (hasError) {
      shakeForm(form);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner spinner-sm" style="border-top-color:#fff;border-right-color:#fff;margin:0;"></span> Creating account...`;

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: { username, email, password, fullName },
      });
      Storage.setToken(data.token);
      Storage.setUser(data.user);
      showToast('Account created! Welcome to ConnectHub.', 'success');
      setTimeout(() => (window.location.href = 'feed.html'), 400);
    } catch (err) {
      shakeForm(form);
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });
}
