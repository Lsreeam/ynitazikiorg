const STORAGE_USER = "ynitaziki_user";
const STORAGE_SESSION = "ynitaziki_session";
const STORAGE_PROFILE = "ynitaziki_profile";
const COOKIE_CART = "ynitaziki_cart";
const COOKIE_FAVES = "ynitaziki_faves";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

const setCookie = (name, value, days = 30) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

const clearCookie = (name) => {
  setCookie(name, "", -1);
};

const readCookieJSON = (name, fallback) => {
  try {
    const raw = getCookie(name);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeCookieJSON = (name, value) => {
  setCookie(name, JSON.stringify(value));
};

const getProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PROFILE)) || {};
  } catch (error) {
    return {};
  }
};

const saveProfile = (profile) => {
  localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
};

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
  const profile = getProfile();

  if (username) {
    document.body.classList.add("is-auth");
    if (avatar) {
      if (profile.avatar) {
        avatar.textContent = "";
        avatar.style.backgroundImage = `url(${profile.avatar})`;
      } else {
        avatar.textContent = username.charAt(0).toUpperCase();
        avatar.style.backgroundImage = "";
      }
      avatar.setAttribute("title", username);
    }
  } else {
    document.body.classList.remove("is-auth");
    if (avatar) {
      avatar.textContent = "";
      avatar.style.backgroundImage = "";
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

const getProductData = (card) => {
  return {
    id: card.dataset.productId,
    name: card.dataset.productName,
    price: Number(card.dataset.productPrice || 0),
    image: card.dataset.productImage || "",
  };
};

const getCartItems = () => readCookieJSON(COOKIE_CART, []);
const getFavoriteItems = () => readCookieJSON(COOKIE_FAVES, []);
const saveCartItems = (items) => writeCookieJSON(COOKIE_CART, items);
const saveFavoriteItems = (items) => writeCookieJSON(COOKIE_FAVES, items);

const addToCart = (product) => {
  const items = getCartItems();
  const existing = items.find((item) => item.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    items.push({ ...product, qty: 1 });
  }

  saveCartItems(items);
};

const initFavoriteButtons = () => {
  const buttons = document.querySelectorAll("[data-fave-toggle]");
  if (!buttons.length) {
    return;
  }

  const favorites = getFavoriteItems();

  buttons.forEach((button) => {
    const card = button.closest("[data-product-id]");
    if (!card) {
      return;
    }

    const product = getProductData(card);
    const isActive = favorites.some((item) => item.id === product.id);
    button.classList.toggle("is-active", isActive);

    button.addEventListener("click", () => {
      const current = getFavoriteItems();
      const exists = current.some((item) => item.id === product.id);

      const next = exists
        ? current.filter((item) => item.id !== product.id)
        : [...current, product];

      saveFavoriteItems(next);
      button.classList.toggle("is-active", !exists);
    });
  });
};

const initAddToCartButtons = () => {
  const buttons = document.querySelectorAll("[data-add-to-cart]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("is-added")) {
        return;
      }

      const card = button.closest("[data-product-id]");
      if (card) {
        addToCart(getProductData(card));
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

const renderCartItems = (list, items) => {
  list.innerHTML = items
    .map(
      (item) => `
      <article class="cart-item" data-cart-id="${item.id}">
        <div class="cart-thumb">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="cart-details">
          <h3>${item.name}</h3>
          <p class="cart-price">$${item.price}</p>
          <div class="cart-meta">
            <div class="cart-qty-controls">
              <button class="qty-btn" type="button" data-qty-decrease>-</button>
              <span class="cart-qty">${item.qty}</span>
              <button class="qty-btn" type="button" data-qty-increase>+</button>
            </div>
            <span class="cart-line">$${(item.qty * item.price).toFixed(2)}</span>
            <button class="cart-remove" type="button" data-cart-remove>Remove</button>
          </div>
        </div>
      </article>
    `
    )
    .join("");
};

const renderFavoriteItems = (list, items) => {
  list.innerHTML = items
    .map(
      (item) => `
      <article class="favorite-item" data-fave-id="${item.id}">
        <div class="favorite-thumb">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="favorite-details">
          <h3>${item.name}</h3>
          <p class="cart-price">$${item.price}</p>
        </div>
        <button class="add-btn add-btn--compact" type="button" data-fave-add>Add to cart</button>
      </article>
    `
    )
    .join("");
};

const initCartPage = () => {
  const cartList = document.querySelector("[data-cart-list]");
  if (!cartList) {
    return;
  }

  const cartEmpty = document.querySelector("[data-cart-empty]");
  const favoritesList = document.querySelector("[data-favorites-list]");
  const favoritesEmpty = document.querySelector("[data-favorites-empty]");
  const summaryQty = document.querySelector("[data-cart-qty]");
  const summaryTotal = document.querySelector("[data-cart-total]");

  const refresh = () => {
    const cartItems = getCartItems();
    renderCartItems(cartList, cartItems);
    if (cartEmpty) {
      cartEmpty.hidden = cartItems.length !== 0;
    }

    if (favoritesList) {
      const favoriteItems = getFavoriteItems().filter(
        (item) => !cartItems.some((cartItem) => cartItem.id === item.id)
      );
      renderFavoriteItems(favoritesList, favoriteItems);
      if (favoritesEmpty) {
        favoritesEmpty.hidden = favoriteItems.length !== 0;
      }
    }

    if (summaryQty && summaryTotal) {
      const qty = cartItems.reduce((sum, item) => sum + item.qty, 0);
      const total = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);
      summaryQty.textContent = qty.toString();
      summaryTotal.textContent = `$${total.toFixed(2)}`;
    }
  };

  cartList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-cart-remove]");
    const increaseButton = event.target.closest("[data-qty-increase]");
    const decreaseButton = event.target.closest("[data-qty-decrease]");

    if (increaseButton || decreaseButton) {
      const item = event.target.closest("[data-cart-id]");
      if (!item) {
        return;
      }
      const id = item.dataset.cartId;
      const items = getCartItems();
      const entry = items.find((cartItem) => cartItem.id === id);
      if (!entry) {
        return;
      }
      if (increaseButton) {
        entry.qty += 1;
      }
      if (decreaseButton) {
        entry.qty = Math.max(1, entry.qty - 1);
      }
      saveCartItems(items);
      refresh();
      return;
    }

    if (!removeButton) {
      return;
    }

    const item = removeButton.closest("[data-cart-id]");
    if (!item) {
      return;
    }

    const id = item.dataset.cartId;
    const next = getCartItems().filter((entry) => entry.id !== id);
    saveCartItems(next);
    refresh();
  });

  if (favoritesList) {
    favoritesList.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-fave-add]");
      if (!addButton) {
        return;
      }

      const item = addButton.closest("[data-fave-id]");
      if (!item) {
        return;
      }

      const favorite = getFavoriteItems().find((entry) => entry.id === item.dataset.faveId);
      if (favorite) {
        addToCart(favorite);
        refresh();
      }
    });
  }

  refresh();
  window.refreshCartUI = refresh;
};

const initCartClear = () => {
  const clearBtn = document.querySelector("[data-cart-clear]");
  if (!clearBtn) {
    return;
  }

  clearBtn.addEventListener("click", () => {
    saveCartItems([]);
    if (window.refreshCartUI) {
      window.refreshCartUI();
    }
  });
};

const validateDeliveryForm = (form, messageEl) => {
  if (!form) {
    return true;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    setMessage(messageEl, "Please fill delivery details correctly.", true);
    return false;
  }

  const fullName = form.querySelector("input[name='fullName']")?.value.trim() || "";
  const phone = form.querySelector("input[name='phone']")?.value.trim() || "";
  const region = form.querySelector("input[name='region']")?.value.trim() || "";
  const city = form.querySelector("input[name='city']")?.value.trim() || "";
  const address = form.querySelector("input[name='address']")?.value.trim() || "";

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) {
    setMessage(messageEl, "Please enter full name.", true);
    return false;
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    setMessage(messageEl, "Please enter a valid phone number.", true);
    return false;
  }

  if (region.length < 3 || city.length < 2 || address.length < 5) {
    setMessage(messageEl, "Please enter a full delivery address.", true);
    return false;
  }

  setMessage(messageEl, "", false);
  return true;
};

const initCheckoutModal = () => {
  const modal = document.querySelector("[data-checkout-modal]");
  if (!modal) {
    return;
  }

  const closers = modal.querySelectorAll("[data-checkout-close]");
  const deliveryForm = document.querySelector("[data-delivery-form]");
  const deliveryMessage = document.querySelector("[data-delivery-message]");
  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  closers.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  const confirmBtn = document.querySelector("[data-cart-confirm]");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (!validateDeliveryForm(deliveryForm, deliveryMessage)) {
        return;
      }
      const items = getCartItems();
      if (!items.length) {
        return;
      }
      openModal();
      saveCartItems([]);
      if (window.refreshCartUI) {
        window.refreshCartUI();
      }
    });
  }
};

const initAddressSuggestions = () => {
  const regionInput = document.querySelector("[data-region-input]");
  const cityInput = document.querySelector("[data-city-input]");
  if (!regionInput && !cityInput) {
    return;
  }

  const regionDatalist = document.getElementById("region-suggestions");
  const cityDatalist = document.getElementById("city-suggestions");

  const regions = [
    "Київська область",
    "Львівська область",
    "Одеська область",
    "Харківська область",
    "Дніпропетровська область",
    "Вінницька область",
    "Полтавська область",
    "Черкаська область"
  ];

  const cities = [
    "Київ",
    "Львів",
    "Одеса",
    "Харків",
    "Дніпро",
    "Вінниця",
    "Полтава",
    "Черкаси"
  ];

  const fillDatalist = (datalist, items) => {
    if (!datalist) {
      return;
    }
    datalist.innerHTML = items
      .map((item) => `<option value="${item}"></option>`)
      .join("");
  };

  fillDatalist(regionDatalist, regions);
  fillDatalist(cityDatalist, cities);
};

const initDeliveryPrefill = () => {
  const form = document.querySelector("[data-delivery-form]");
  if (!form) {
    return;
  }

  const profile = getProfile();
  const user = getStoredUser();

  const nameInput = form.querySelector("input[name='fullName']");
  const phoneInput = form.querySelector("input[name='phone']");
  const emailInput = form.querySelector("input[name='email']");
  const cityInput = form.querySelector("input[name='city']");

  if (nameInput && !nameInput.value) {
    nameInput.value = profile.name || "";
  }
  if (phoneInput && !phoneInput.value) {
    phoneInput.value = profile.phone || "";
  }
  if (emailInput && !emailInput.value) {
    emailInput.value = user?.email || "";
  }
  if (cityInput && !cityInput.value) {
    cityInput.value = profile.city || "";
  }
};

const initProfilePage = () => {
  const page = document.querySelector("[data-profile-page]");
  if (!page) {
    return;
  }

  const user = getStoredUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const profile = getProfile();
  const nameInput = page.querySelector("[data-profile-name]");
  const emailInput = page.querySelector("[data-profile-email]");
  const phoneInput = page.querySelector("[data-profile-phone]");
  const cityInput = page.querySelector("[data-profile-city]");
  const cover = page.querySelector("[data-profile-cover]");
  const avatar = page.querySelector("[data-profile-avatar]");
  const coverInput = page.querySelector("[data-profile-upload-cover]");
  const avatarInput = page.querySelector("[data-profile-upload-avatar]");
  const logoutBtn = page.querySelector("[data-profile-logout]");
  const deleteBtn = page.querySelector("[data-profile-delete]");

  if (nameInput) {
    nameInput.value = profile.name || user.username || "";
  }
  if (emailInput) {
    emailInput.value = user.email || "";
  }
  if (phoneInput) {
    phoneInput.value = profile.phone || "";
  }
  if (cityInput) {
    cityInput.value = profile.city || "";
  }
  if (cover && profile.cover) {
    cover.style.backgroundImage = `url(${profile.cover})`;
  }
  if (avatar && profile.avatar) {
    avatar.style.backgroundImage = `url(${profile.avatar})`;
  }

  const readImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  if (coverInput) {
    coverInput.addEventListener("change", () => {
      const file = coverInput.files && coverInput.files[0];
      if (!file) {
        return;
      }
      readImage(file, (src) => {
        cover.style.backgroundImage = `url(${src})`;
        saveProfile({ ...getProfile(), cover: src });
      });
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file) {
        return;
      }
      readImage(file, (src) => {
        avatar.style.backgroundImage = `url(${src})`;
        saveProfile({ ...getProfile(), avatar: src });
        updateHeaderAuth();
      });
    });
  }

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      saveProfile({ ...getProfile(), name: nameInput.value.trim() });
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      saveProfile({ ...getProfile(), phone: phoneInput.value.trim() });
    });
  }

  if (cityInput) {
    cityInput.addEventListener("input", () => {
      saveProfile({ ...getProfile(), city: cityInput.value.trim() });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_SESSION);
      updateHeaderAuth();
      window.location.href = "index.html";
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!window.confirm("Delete account permanently?")) {
        return;
      }
      localStorage.removeItem(STORAGE_USER);
      localStorage.removeItem(STORAGE_SESSION);
      localStorage.removeItem(STORAGE_PROFILE);
      clearCookie(COOKIE_CART);
      clearCookie(COOKIE_FAVES);
      updateHeaderAuth();
      window.location.href = "index.html";
    });
  }
};


const initSearchSuggestions = () => {
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  if (!input || !results) {
    return;
  }

  const products = Array.from(document.querySelectorAll("[data-product-name]")).map((card) => ({
    id: card.dataset.productId,
    name: card.dataset.productName,
  }));

  const render = (items) => {
    results.innerHTML = items
      .slice(0, 6)
      .map(
        (item) =>
          `<a class="search-item" href="#${item.id}" data-search-id="${item.id}">${item.name}</a>`
      )
      .join("");
    results.classList.toggle("is-open", items.length > 0);
  };

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.classList.remove("is-open");
      results.innerHTML = "";
      return;
    }
    const matches = products.filter((item) => item.name.toLowerCase().includes(query));
    render(matches);
  });

  results.addEventListener("click", (event) => {
    const link = event.target.closest("[data-search-id]");
    if (!link) {
      return;
    }
    event.preventDefault();
    const id = link.dataset.searchId;
    const target = document.querySelector(`[data-product-id=\"${id}\"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    results.classList.remove("is-open");
  });

  document.addEventListener("click", (event) => {
    if (!results.contains(event.target) && event.target !== input) {
      results.classList.remove("is-open");
    }
  });
};

const initScrollReveal = () => {
  const elements = document.querySelectorAll(".product-card");
  if (!elements.length) {
    return;
  }

  elements.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach((el) => observer.observe(el));
};

updateHeaderAuth();
initLoginForm();
initRegisterForm();
initSupportModal();
initSupportForm();
initFavoriteButtons();
initAddToCartButtons();
initCartPage();
initCartClear();
initCheckoutModal();
initAddressSuggestions();
initProfilePage();
initSearchSuggestions();
initScrollReveal();
initDeliveryPrefill();

