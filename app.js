(function () {
const form = document.getElementById('login-form');
const msg = document.getElementById('msg');
const submit = document.getElementById('submit');
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();


function setMessage(text, type = '') {
msg.textContent = text;
msg.className = `msg ${type}`.trim();
}


form.addEventListener('submit', async (e) => {
e.preventDefault();


const email = document.getElementById('email').value.trim();
const password = document.getElementById('password').value;


if (!email || !password) {
setMessage('Please enter your email and password.', 'error');
return;
}


submit.disabled = true;
setMessage('Signing in…');


try {
const res = await fetch('/api/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password })
});


const data = await res.json();
if (!res.ok) throw new Error(data.error || 'Login failed.');


setMessage(data.message || 'Success!', 'success');


// Error If Redirect
if (data.redirect) {
setTimeout(() => { window.location.href = data.redirect; }, 600);
}
} catch (err) {
setMessage(err.message || 'Something went wrong.', 'error');
} finally {
submit.disabled = false;
}
});
})();