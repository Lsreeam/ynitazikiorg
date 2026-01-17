const STORAGE_USER = "ynitaziki_user";
const STORAGE_SESSION = "ynitaziki_session";
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
            <span class="cart-qty">Qty: ${item.qty}</span>
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
      if (deliveryForm && !deliveryForm.checkValidity()) {
        deliveryForm.reportValidity();
        setMessage(deliveryMessage, "Заповніть контактні дані коректно.", true);
        return;
      }

      setMessage(deliveryMessage, "", false);
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
