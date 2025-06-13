<script>
  // === FIREBASE INIT ===
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // === TAB SWITCHING ===
  function showTab(tabId) {
    document.querySelectorAll('.tab-section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
  }

  // === AUTH FUNCTIONS ===
  function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        document.getElementById('auth-status').textContent = `Signed up as ${email}`;
      })
      .catch(error => {
        alert(error.message);
      });
  }

  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        document.getElementById('auth-status').textContent = `Logged in as ${email}`;
      })
      .catch(error => {
        alert(error.message);
      });
  }

  function logout() {
    auth.signOut()
      .then(() => {
        document.getElementById('auth-status').textContent = 'Logged out';
      });
  }

  auth.onAuthStateChanged(user => {
    const status = document.getElementById('auth-status');
    if (user) {
      status.textContent = `Logged in as ${user.email}`;
    } else {
      status.textContent = 'Not logged in';
    }
  });

  // === THEME HANDLING ===
  function applyTheme(theme) {
    document.body.className = ''; // Clear old themes
    if (theme && theme !== 'Default') {
      document.body.classList.add(`theme-${theme}`);
    }
  }

  function handleThemeChange(event) {
    const selectedTheme = event.target.value;
    localStorage.setItem('crzyclanTheme', selectedTheme);
    applyTheme(selectedTheme);
  }

  // === BACKGROUND IMAGE HANDLING ===
  function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const imageUrl = e.target.result;
      document.body.style.backgroundImage = `url('${imageUrl}')`;
      localStorage.setItem('crzyclanBackground', imageUrl);
    };
    reader.readAsDataURL(file);
  }

  // === ON LOAD ===
  window.addEventListener('DOMContentLoaded', () => {
    // Load theme
    const savedTheme = localStorage.getItem('crzyclanTheme') || 'Default';
    applyTheme(savedTheme);

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = savedTheme;
      themeSelect.addEventListener('change', handleThemeChange);
    }

    // Load background
    const savedBackground = localStorage.getItem('crzyclanBackground');
    if (savedBackground) {
      document.body.style.backgroundImage = `url('${savedBackground}')`;
    }

    const bgInput = document.getElementById('bg-upload');
    if (bgInput) {
      bgInput.addEventListener('change', handleBackgroundUpload);
    }

    showTab('home');
  });
</script>
