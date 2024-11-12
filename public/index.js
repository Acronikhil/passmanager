 // Login Form Submission
 console.log("index.js");
 document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // document.getElementById("login-form").style.display = 'none';
            // document.getElementById("password-dashboard").style.display = 'block';
            
            document.getElementById("user-name-display").innerText = username;
            loadPasswords(); // Load saved passwords on successful login
            window.location.href = "/dashboard";
        } else {
            alert(data.message || 'Login failed');
        }
    });
});

// Logout
document.getElementById("logout").addEventListener("click", function() {
    fetch('/logout', { method: 'POST' })
        .then(() => {
            document.getElementById("login-form").style.display = 'block';
            document.getElementById("password-dashboard").style.display = 'none';
        });
});

// Add New Password
document.getElementById("add-password-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const site = document.getElementById("site").value;
    const password = document.getElementById("password").value;

    fetch('/add-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password added successfully');
            loadPasswords(); // Reload passwords to show the new entry
        }
    });
});

// Fetch and Render Passwords
function loadPasswords() {
    fetch('/get-passwords')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderPasswords(data.passwords);
            }
        });
}

function renderPasswords(passwords) {
    const passwordsContainer = document.getElementById('passwords');
    passwordsContainer.innerHTML = ''; 

    Object.keys(passwords).forEach(site => {
        const passwordInfo = passwords[site];
        const passwordCard = document.createElement('div');
        passwordCard.classList.add('col-md-4', 'mt-3');

        passwordCard.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${site}</h5>
                    <p><strong>Password:</strong> <span id="password-${site}">${passwordInfo.password}</span></p>
                    <p><strong>Last Updated:</strong> ${passwordInfo.lastUpdated}</p>
                    <button onclick="editPassword('${site}')" class="btn btn-warning btn-sm">Edit</button>
                </div>
            </div>
        `;
        passwordsContainer.appendChild(passwordCard);
    });
}

function editPassword(site) {
    const newPassword = prompt("Enter new password for " + site + ":");
    if (newPassword) {
        fetch('/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site, password: newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Password updated successfully');
                loadPasswords();
            }
        });
    }
}