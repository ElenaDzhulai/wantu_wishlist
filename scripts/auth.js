export const authModule = {
  addSignUpFormAndControls() {
    this.createModal();
    this.addOpenModalButton();
  },
  addOpenModalButton() {
    const signUpButton = document.createElement("button");
    signUpButton.innerText = "Sign Up";
    signUpButton.addEventListener("click", () => {
      document.getElementById("registerModal").classList.remove("hidden");
    });

    document.querySelector("main").prepend(signUpButton);
  },
  createModal() {
    const registerModal = document.createElement("div");
    registerModal.id = "registerModal";
    registerModal.className = "registerModal hidden";

    const modalSignUp = document.createElement("div");
    modalSignUp.className = "modalSignUp";

    const closeButton = document.createElement("button");
    closeButton.innerText = "x";
    closeButton.addEventListener("click", () => {
      registerModal.classList.add("hidden");
    });

    const signUpForm = document.createElement("form");
    signUpForm.id = "signUpForm";

    const title = document.createElement("h2");
    title.innerText = "Sign Up";

    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "signUpEmail";
    inputEmail.placeholder = "Email";
    inputEmail.setAttribute("required", true);

    const inputPassword = document.createElement("input");
    inputPassword.type = "password";
    inputPassword.id = "signUpPassword";
    inputPassword.placeholder = "Password";
    inputPassword.setAttribute("required", true);

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.innerText = "Sign Up";

    const signupMessage = document.createElement("p");
    signupMessage.id = "signupMessage";

    const googleSignInButton = document.createElement("button");
    googleSignInButton.id = "googleSignIn";
    googleSignInButton.className = "google-btn";

    const googleLogo = document.createElement("img");
    googleLogo.src = "https://developers.google.com/identity/images/g-logo.png";
    googleLogo.alt = "Google logo";

    googleSignInButton.innerText = "Sign in with Google";
    googleSignInButton.prepend(googleLogo);

    signUpForm.appendChild(title);
    signUpForm.appendChild(inputEmail);
    signUpForm.appendChild(inputPassword);
    signUpForm.appendChild(submitButton);

    modalSignUp.appendChild(closeButton);
    modalSignUp.appendChild(signUpForm);
    modalSignUp.appendChild(signupMessage);
    modalSignUp.appendChild(googleSignInButton);

    registerModal.appendChild(modalSignUp);
    document.querySelector("body").appendChild(registerModal);
  },
};

// document.getElementById("googleSignIn").addEventListener("click", async () => {
//   const { error } = await supabaseClient.auth.signInWithOAuth({
//     provider: "google",
//   });

//   if (error) {
//     console.error("Ошибка входа:", error.message);
//   }
// });

// const {
//   data: { user },
// } = await supabaseClient.auth.getUser();
// console.log("Текущий пользователь:", user);

// // export const signUpForm = {
// document.getElementById("signupForm").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const email = document.getElementById("signupEmail").value;
//   const password = document.getElementById("signupPassword").value;

//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//   });

//   const message = document.getElementById("signupMessage");
//   if (error) {
//     message.textContent = "Ошибка: " + error.message;
//   } else {
//     message.textContent = "Проверь почту для подтверждения.";
//   }
// });
// // }
