// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.appspot.com",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('logoutSection').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
  } else {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('logoutSection').style.display = 'none';
  }
});

// Login Function
function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
}

// Signup Function
function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert('Signup successful!');
      showLogin();
    })
    .catch(err => alert(err.message));
}

// Logout
function logout() {
  auth.signOut().catch(err => alert(err.message));
}

// Toggle Login/Signup
function showSignup() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'block';
}
function showLogin() {
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

// Tab Navigation
function showSection(id) {
  const sections = document.querySelectorAll("section");
  sections.forEach(section => {
    section.style.display = section.id === id ? "block" : "none";
  });
}

// Theme Application
function applyTheme(theme) {
  document.body.classList.remove("theme-default", "theme-redmist", "theme-blackwhite");

  if (theme === "Red Mist") {
    document.body.classList.add("theme-redmist");
  } else if (theme === "Black & White") {
    document.body.classList.add("theme-blackwhite");
  } else {
    document.body.classList.add("theme-default");
  }
}

// Load saved settings
function loadSettings() {
  const savedTheme = localStorage.getItem("theme");
  const background = localStorage.getItem("backgroundImage");

  if (savedTheme) {
    applyTheme(savedTheme);
    document.getElementById("themeSelect").value = savedTheme;
  }

  if (background) {
    document.body.style.backgroundImage = `url(${background})`;
  }
}

// Save user settings
function saveSettings() {
  const selectedTheme = document.getElementById("themeSelect").value;
  const fileInput = document.getElementById("bgUpload");
  applyTheme(selectedTheme);
  localStorage.setItem("theme", selectedTheme);

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      localStorage.setItem("backgroundImage", dataUrl);
      document.body.style.backgroundImage = `url(${dataUrl})`;
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    localStorage.removeItem("backgroundImage");
    document.body.style.backgroundImage = "";
  }

  alert("Settings saved!");
}

// Navigation Events
document.addEventListener("DOMContentLoaded", () => {
  showSection("home");
  loadSettings();

  document.querySelectorAll("nav a[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.getAttribute("href").substring(1);
      showSection(target);
    });
  });

  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);
});
