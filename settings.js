document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById('custom-bg');
  const clearBtn = document.getElementById('clear-bg');

  if (fileInput) {
    fileInput.addEventListener("change", event => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        localStorage.setItem("customBackground", e.target.result);
        document.body.style.backgroundImage = `url('${e.target.result}')`;
      };
      reader.readAsDataURL(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem("customBackground");
      document.body.style.backgroundImage = "none";
    });
  }
});
