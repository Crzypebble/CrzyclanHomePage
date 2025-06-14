window.addEventListener("load", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    showTab(hash);
  } else {
    showTab("home"); // default tab
  }
});
