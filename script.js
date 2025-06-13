// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.firebasestorage.app",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Tabs
function showTab(tabId) {
  document.querySelectorAll('section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById(tabId).style.display = 'block';
}

// Show Home tab on load
document.addEventListener("DOMContentLoaded", () => {
  showTab("home");

  // Load saved theme and background
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) applyTheme(savedTheme);

  const savedBg = localStorage.getItem("customBackground");
  if (savedBg) document.body.style.backgroundImage = `url(${savedBg})`;

  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("signupForm").style.display = "none";
      document.getElementById("logoutSection").style.display = "block";
      document.getElementById("userEmail").textContent = user.email;
    } else {
      document.getElementById("loginForm").style.display = "block";
      document.getElementById("signupForm").style.display = "none";
      document.getElementById("logoutSection").style.display = "none";
    }
  });
});

// Authentication
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Logged in!"))
    .catch(err => alert(err.message));
}

function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Account created!"))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

// Toggle login/signup forms
function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

function showLogin() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// Theme selection
document.getElementById("themeSelect").addEventListener("change", (e) => {
  const theme = e.target.value;
  applyTheme(theme);
  localStorage.setItem("theme", theme);
});

function applyTheme(theme) {
  switch (theme) {
    case "Red Mist":
      document.body.style.backgroundColor = "#1a0000";
      document.body.style.color = "#ffcccc";
      break;
    case "Black & White":
      document.body.style.backgroundColor = "#fff";
      document.body.style.color = "#000";
      break;
    default:
      document.body.style.backgroundColor = "#0a0a0a";
      document.body.style.color = "#e6e6e6";
  }
}

// Background image upload
document.getElementById("bgUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imageUrl = reader.result;
    document.body.style.backgroundImage = `url(${imageUrl})`;
    localStorage.setItem("customBackground", imageUrl);
  };
  reader.readAsDataURL(file);
});
