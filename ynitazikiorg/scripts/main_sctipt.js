const STORAGE_USER = "ynitaziki_user";
const STORAGE_SESSION = "ynitaziki_session";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USER));
  } catch (error) {
    return null;
  }
};

const setMessage = (element, message, isError = false) => {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("error", isError);
};

const updateHeaderAuth = () => {
  const avatar = document.querySelector("[data-avatar]");
  const username = localStorage.getItem(STORAGE_SESSION);

  if (username) {
    document.body.classList.add("is-auth");
    if (avatar) {
      avatar.textContent = username.charAt(0).toUpperCase();
      avatar.setAttribute("title", username);
    }
  } else {
    document.body.classList.remove("is-auth");
    if (avatar) {
      avatar.textContent = "";
      avatar.removeAttribute("title");
    }
  }
};

const initLoginForm = () => {
  const form = document.getElementById("login-form");
  if (!form) {
    return;
  }

  const message = form.querySelector("[data-message]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const loginValue = String(formData.get("login") || "").trim();
    const password = String(formData.get("password") || "");
    const user = getStoredUser();

    if (!user) {
      setMessage(message, "No account found. Please register.", true);
      return;
    }

    const isMatch =
      (loginValue.toLowerCase() === user.email.toLowerCase() ||
        loginValue.toLowerCase() === user.username.toLowerCase()) &&
      password === user.password;

    if (!isMatch) {
      setMessage(message, "Incorrect login or password.", true);
      return;
    }

    localStorage.setItem(STORAGE_SESSION, user.username);
    setMessage(message, "Welcome back!", false);
    window.location.href = "index.html";
  });
};

const initRegisterForm = () => {
  const form = document.getElementById("register-form");
  if (!form) {
    return;
  }

  const message = form.querySelector("[data-message]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");

    if (!username || !email || !password) {
      setMessage(message, "Fill in all fields.", true);
      return;
    }

    if (password.length < 6) {
      setMessage(message, "Password must be at least 6 characters.", true);
      return;
    }

    if (password !== confirm) {
      setMessage(message, "Passwords do not match.", true);
      return;
    }

    const user = { username, email, password };
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_SESSION, username);

    setMessage(message, "Account created!", false);
    window.location.href = "index.html";
  });
};
const initSupportModal = () => {
  const modal = document.querySelector("[data-support-modal]");
  if (!modal) {
    return;
  }

  const openers = document.querySelectorAll("[data-support-open]");
  const closers = modal.querySelectorAll("[data-support-close]");

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  openers.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openModal();
    });
  });

  closers.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  if (document.body.dataset.openSupport === "true") {
    openModal();
  }
};

const initAddToCartButtons = () => {
  const buttons = document.querySelectorAll("[data-add-to-cart]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("is-added")) {
        return;
      }

      const original = button.textContent;
      button.textContent = "Added";
      button.classList.add("is-added");

      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove("is-added");
      }, 1200);
    });
  });
};

const initSupportForm = () => {
  const form = document.getElementById("support-form");
  if (!form) {
    return;
  }

  const message = form.querySelector("[data-message]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setMessage(message, "Thanks! We'll reply soon.", false);
    form.reset();
  });
};
updateHeaderAuth();
initLoginForm();
initRegisterForm();
initSupportModal();
initSupportForm();
initAddToCartButtons();
