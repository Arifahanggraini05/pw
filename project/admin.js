const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginStatus.textContent = "Login gagal: " + error.message;
  } else {
    loginStatus.textContent = "Login berhasil!";
    window.location.href = "dashboard.html";
  }
});
