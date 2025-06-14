window.uploadBackground = function () {
  const fileInput = document.getElementById('bg-file');
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const url = e.target.result;
      document.body.style.backgroundImage = `url('${url}')`;
      localStorage.setItem('customBackground', url);
    };

    reader.readAsDataURL(file);
  }
};

window.clearCustomBackground = function () {
  document.body.style.backgroundImage = '';
  localStorage.removeItem('customBackground');
};
