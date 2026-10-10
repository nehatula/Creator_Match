
"use strict";

/* ==================================================
   CREATORMATCH — APP LOGIC
   Demo storage: browser localStorage + sessionStorage
   ================================================== */

const STORAGE = {
  users: "cm_users",
  messages: "cm_messages",
  saved: "cm_saved_creators",
  session: "cm_user_id"
};

const NICHES = [
  "Lifestyle", "Fashion", "Beauty", "Food", "Travel",
  "Technology", "Fitness", "Education", "Gaming", "Other"
];

/* ---------- STORAGE HELPERS ---------- */

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getUsers() {
  return readStorage(STORAGE.users, []);
}

function saveUsers(users) {
  localStorage.setItem(STORAGE.users, JSON.stringify(users));
}

function getMessages() {
  return readStorage(STORAGE.messages, []);
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE.messages, JSON.stringify(messages));
}

function getSaved() {
  return readStorage(STORAGE.saved, {});
}

function saveSaved(saved) {
  localStorage.setItem(STORAGE.saved, JSON.stringify(saved));
}

function getCurrentUser() {
  const id = sessionStorage.getItem(STORAGE.session);
  return getUsers().find(user => user.id === id) || null;
}

function makeId(prefix) {
  return prefix + "_" + Date.now() + "_" +
    Math.random().toString(36).slice(2, 9);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/* ---------- HOME PAGE NAVIGATION ---------- */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("hidden", page.id !== pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showNotice(message, isError = false) {
  const notice = document.getElementById("dashboardMessage");
  if (!notice) return;

  notice.textContent = message;
  notice.className = isError ? "notice error" : "notice";
}

function goToLogin(role, email = "") {
  showPage(role + "Login");

  const field = document.getElementById(role + "LoginEmail");
  if (field && email) field.value = email;
}

/* ---------- REGISTRATION ---------- */

function register(event, role) {
  event.preventDefault();

  const prefix = role === "creator" ? "creator" : "brand";
  const name = document.getElementById(prefix + "RegName").value.trim();
  const email = document.getElementById(prefix + "RegEmail")
    .value.trim().toLowerCase();
  const password = document.getElementById(prefix + "RegPassword").value;
  const confirm = document.getElementById(prefix + "RegConfirm").value;
  const error = document.getElementById(prefix + "RegError");

  error.textContent = "";

  if (!name) {
    error.textContent = "Please enter your name or brand name.";
    return;
  }

  if (!validEmail(email)) {
    error.textContent = "Please enter a valid email address.";
    return;
  }

  if (password.length < 8) {
    error.textContent = "Password must contain at least 8 characters.";
    return;
  }

  if (password !== confirm) {
    error.textContent = "Passwords do not match.";
    return;
  }

  const users = getUsers();

  if (users.some(user => user.email.toLowerCase() === email)) {
    error.textContent =
      "This email is already registered. Please log in instead.";
    return;
  }

  const user = {
    id: makeId(role),
    role,
    name,
    email,
    password,
    profile: {
      name,
      location: "",
      niche: role === "creator" ? "Lifestyle" : "Other",
      link: "",
      about: ""
    },
    createdAt: new Date().toISOString()
  };

  users.push(user);
  saveUsers(users);

  // Registration and login are separate steps.
  sessionStorage.removeItem(STORAGE.session);

  event.target.reset();

  alert("Account created successfully! Please log in.");
  goToLogin(role, email);
}

/* ---------- LOGIN: CREATOR AND BRAND ---------- */

function login(event, role) {
  event.preventDefault();

  const prefix = role === "creator" ? "creator" : "brand";
  const email = document.getElementById(prefix + "LoginEmail")
    .value.trim().toLowerCase();
  const password = document.getElementById(prefix + "LoginPassword").value;
  const error = document.getElementById(prefix + "LoginError");

  error.textContent = "";

  if (!validEmail(email)) {
    error.textContent = "Please enter a valid email address.";
    return;
  }

  if (!password) {
    error.textContent = "Please enter your password.";
    return;
  }

  const user = getUsers().find(item =>
    item.email.toLowerCase() === email &&
    item.password === password &&
    item.role === role
  );

  if (!user) {
    error.textContent =
      "Login failed. Check your email, password and account type.";
    return;
  }

  // Create the session before navigating to the dashboard.
  sessionStorage.setItem(STORAGE.session, user.id);

  window.location.href = "dashboard.html";
}

/* ---------- LOGOUT ---------- */

function logout() {
  sessionStorage.removeItem(STORAGE.session);
  window.location.href = "index.html";
}

/* ---------- PROFILE MANAGEMENT ---------- */

function renderProfile() {
  const user = getCurrentUser();
  const container = document.getElementById("dashboardContent");

  if (!user || !container) return;

  const profile = user.profile || {};
  const isBrand = user.role === "brand";

  container.innerHTML = `
    <section class="dash-section">
      <p class="eyebrow">YOUR PERSONAL SPACE</p>
      <h2>My Profile</h2>
      <p>Tell the community who you are and what makes you unique.</p>

      <form id="profileForm" class="profile-form">
        <label for="profileName">${isBrand ? "Brand name" : "Full name"}</label>
        <input id="profileName" required maxlength="100"
          value="${escapeHTML(profile.name || user.name)}">

        <label for="profileLocation">Location</label>
        <input id="profileLocation" required maxlength="100"
          placeholder="e.g. Warangal, Telangana"
          value="${escapeHTML(profile.location || "")}">

        <label for="profileNiche">${isBrand ? "Brand category" : "Creator niche"}</label>
        <select id="profileNiche">
          ${NICHES.map(niche => `
            <option value="${niche}"
              ${profile.niche === niche ? "selected" : ""}>
              ${niche}
            </option>
          `).join("")}
        </select>

        <label for="profileLink">Website or social profile URL</label>
        <input id="profileLink" type="url"
          placeholder="https://example.com"
          value="${escapeHTML(profile.link || "")}">

        <label for="profileAbout">About you</label>
        <textarea id="profileAbout" rows="4" maxlength="1000"
          placeholder="Share your story, interests and collaboration goals...">${escapeHTML(profile.about || "")}</textarea>

        <button class="btn" type="submit">Save changes ↗</button>
        <p id="profileSaveMessage" class="form-message" aria-live="polite"></p>
      </form>
    </section>
  `;

  document.getElementById("profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("profileName").value.trim();
    const location = document.getElementById("profileLocation").value.trim();
    const niche = document.getElementById("profileNiche").value;
    const link = document.getElementById("profileLink").value.trim();
    const about = document.getElementById("profileAbout").value.trim();
    const message = document.getElementById("profileSaveMessage");

    message.className = "form-message";

    if (!name || !location) {
      message.textContent = "Name and location are required.";
      message.classList.add("error");
      return;
    }

    if (link) {
      try {
        const url = new URL(link);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        message.textContent = "Enter a valid URL beginning with https:// or http://.";
        message.classList.add("error");
        return;
      }
    }

    const users = getUsers();
    const index = users.findIndex(item => item.id === user.id);

    if (index === -1) {
      message.textContent = "Account not found. Please log in again.";
      message.classList.add("error");
      return;
    }

    users[index].name = name;
    users[index].profile = { name, location, niche, link, about };
    saveUsers(users);

    updateDashboardIdentity(users[index]);

    message.textContent = "Your profile has been saved successfully!";
    message.classList.add("success");
  });
}

/* ---------- DASHBOARD IDENTITY ---------- */

function updateDashboardIdentity(user) {
  const name = user.profile?.name || user.name;

  const welcome = document.getElementById("welcomeUser");
  const sidebarName = document.getElementById("sidebarName");
  const sidebarRole = document.getElementById("sidebarRole");
  const avatar = document.getElementById("userAvatar");
  const discoverLabel = document.getElementById("discoverLabel");
  const savedNav = document.getElementById("savedNav");

  if (welcome) welcome.textContent = "Welcome, " + name;
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarRole) sidebarRole.textContent =
    user.role === "brand" ? "Brand account" : "Creator account";
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();

  if (discoverLabel) {
    discoverLabel.textContent =
      user.role === "brand" ? "Discover Creators" : "Discover Brands";
  }

  if (savedNav) {
    savedNav.classList.toggle("hidden", user.role !== "brand");
  }
}

/* ---------- DISCOVER CREATORS / BRANDS ---------- */

function renderDiscover() {
  const user = getCurrentUser();
  const container = document.getElementById("dashboardContent");

  if (!user || !container) return;

  const isBrand = user.role === "brand";
  const heading = isBrand ? "Discover Creators" : "Discover Brands";
  const intro = isBrand
    ? "Find creators whose location and interests fit your brand."
    : "Explore brands, learn about their work and reach out to start a conversation.";

  container.innerHTML = `
    <section class="dash-section">
      <p class="eyebrow">FIND YOUR MATCH</p>
      <h2>${heading}</h2>
      <p>${intro}</p>

      <form id="searchForm" class="filter-bar">
        <input id="searchLocation" placeholder="Filter by location">
        <select id="searchNiche">
          <option value="">All categories</option>
          ${NICHES.map(niche => `<option value="${niche}">${niche}</option>`).join("")}
        </select>
        <button class="btn" type="submit">Search</button>
      </form>

      <div id="discoverResults" class="result-grid"></div>
    </section>
  `;

  document.getElementById("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    showDiscoverResults();
  });

  showDiscoverResults();
}

function showDiscoverResults() {
  const current = getCurrentUser();
  const results = document.getElementById("discoverResults");

  if (!current || !results) return;

  const location = document.getElementById("searchLocation")
    .value.trim().toLowerCase();
  const niche = document.getElementById("searchNiche").value;
  const targetRole = current.role === "brand" ? "creator" : "brand";

  const matches = getUsers().filter(user => {
    if (user.role !== targetRole || user.id === current.id) return false;

    const profile = user.profile || {};

    // Only show complete, discoverable profiles.
    if (!profile.location) return false;

    const locationMatches = !location ||
      profile.location.toLowerCase().includes(location);

    const nicheMatches = !niche || profile.niche === niche;

    return locationMatches && nicheMatches;
  });

  if (!matches.length) {
    results.innerHTML = `
      <p class="empty-message">
        No matching profiles found yet. Try another filter or check back later.
      </p>`;
    return;
  }

  results.innerHTML = matches.map(person => profileCard(person)).join("");
}

/* ---------- PROFILE CARD ---------- */

function profileCard(person) {
  const profile = person.profile || {};
  const current = getCurrentUser();
  const saved = getSaved();
  const savedIds = saved[current.id] || [];
  const isSaved = savedIds.includes(person.id);
  const isBrandViewingCreator =
    current.role === "brand" && person.role === "creator";

  const website = profile.link && /^https?:\/\//i.test(profile.link)
    ? `<p><a href="${escapeHTML(profile.link)}" target="_blank" rel="noopener noreferrer">Visit website ↗</a></p>`
    : "";

  return `
    <article class="creator-card">
      <div class="avatar">${escapeHTML((profile.name || person.name).charAt(0).toUpperCase())}</div>
      <p class="eyebrow">${person.role === "brand" ? "BRAND PROFILE" : "CREATOR PROFILE"}</p>
      <h3>${escapeHTML(profile.name || person.name)}</h3>
      <p>📍 ${escapeHTML(profile.location || "Location not provided")}</p>
      <p><strong>${escapeHTML(profile.niche || "Other")}</strong></p>
      <p>${escapeHTML(profile.about || "This member hasn't added a description yet.")}</p>
      ${website}
      <div class="card-actions">
        ${isBrandViewingCreator ? `
          <button type="button" class="btn btn-outline"
            data-action="save" data-id="${escapeHTML(person.id)}">
            ${isSaved ? "♥ Saved" : "♡ Save creator"}
          </button>` : ""}
        <button type="button" class="btn"
          data-action="message" data-id="${escapeHTML(person.id)}">
          Message ↗
        </button>
      </div>
    </article>
  `;
}

/* ---------- SAVED CREATORS ---------- */

function toggleSavedCreator(creatorId) {
  const current = getCurrentUser();

  if (!current || current.role !== "brand") {
    showNotice("Only brand accounts can save creators.", true);
    return;
  }

  const creator = getUsers().find(user =>
    user.id === creatorId && user.role === "creator"
  );

  if (!creator) {
    showNotice("Creator profile not found.", true);
    return;
  }

  const saved = getSaved();

  if (!saved[current.id]) saved[current.id] = [];

  if (saved[current.id].includes(creatorId)) {
    saved[current.id] = saved[current.id].filter(id => id !== creatorId);
    showNotice("Creator removed from your saved list.");
  } else {
    saved[current.id].push(creatorId);
    showNotice("Creator saved successfully.");
  }

  saveSaved(saved);

  const active = document.querySelector(".side-link.active")?.dataset.view;

  if (active === "saved") renderSaved();
  else renderDiscover();
}

function renderSaved() {
  const current = getCurrentUser();
  const container = document.getElementById("dashboardContent");

  if (!current || !container) return;

  if (current.role !== "brand") {
    container.innerHTML = `
      <section class="dash-section">
        <h2>Saved Creators</h2>
        <p>This feature is available for brand accounts.</p>
      </section>`;
    return;
  }

  const saved = getSaved();
  const ids = saved[current.id] || [];
  const creators = getUsers().filter(user =>
    ids.includes(user.id) && user.role === "creator"
  );

  container.innerHTML = `
    <section class="dash-section">
      <p class="eyebrow">YOUR SHORTLIST</p>
      <h2>Saved Creators</h2>
      <p>Keep promising creator profiles together for future collaborations.</p>
      <div id="savedResults" class="result-grid"></div>
    </section>
  `;

  const results = document.getElementById("savedResults");

  if (!creators.length) {
    results.innerHTML = `
      <p class="empty-message">
        Your saved list is empty. Discover creators and select “Save creator”.
      </p>`;
    return;
  }

  results.innerHTML = creators.map(creator => profileCard(creator)).join("");
}

/* ---------- MESSAGING ---------- */

function sendMessage(recipientId) {
  const sender = getCurrentUser();

  if (!sender) {
    showNotice("Please log in to send a message.", true);
    return;
  }

  const recipient = getUsers().find(user => user.id === recipientId);

  if (!recipient) {
    showNotice("This profile could not be found.", true);
    return;
  }

  const text = prompt(
    "Write a message to " + (recipient.profile?.name || recipient.name) + ":"
  );

  if (text === null) return;

  if (!text.trim()) {
    alert("Please enter a message before sending.");
    return;
  }

  const messages = getMessages();

  messages.push({
    id: makeId("message"),
    from: sender.id,
    to: recipient.id,
    fromName: sender.profile?.name || sender.name,
    toName: recipient.profile?.name || recipient.name,
    text: text.trim(),
    date: new Date().toISOString()
  });

  saveMessages(messages);
  showNotice("Message sent successfully.");
}

function renderMessages() {
  const current = getCurrentUser();
  const container = document.getElementById("dashboardContent");

  if (!current || !container) return;

  const messages = getMessages()
    .filter(message =>
      message.from === current.id || message.to === current.id
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = `
    <section class="dash-section">
      <p class="eyebrow">LET'S TALK</p>
      <h2>Messages</h2>
      <p>Your conversations with creators and brands appear here.</p>
      <div id="messagesList" class="message-list"></div>
    </section>
  `;

  const list = document.getElementById("messagesList");

  if (!messages.length) {
    list.innerHTML = `
      <p class="empty-message">
        No messages yet. Visit a profile and press Message to start a conversation.
      </p>`;
    return;
  }

  list.innerHTML = messages.map(message => {
    const sent = message.from === current.id;
    const otherId = sent ? message.to : message.from;
    const otherName = sent ? message.toName : message.fromName;

    return `
      <article class="message-card">
        <h3>${sent ? "You messaged" : "Message from"} ${escapeHTML(otherName)}</h3>
        <p>${escapeHTML(message.text)}</p>
        <small>${escapeHTML(new Date(message.date).toLocaleString())}</small>
        ${!sent ? `
          <p><button class="btn" type="button"
            data-action="message" data-id="${escapeHTML(otherId)}">Reply ↗</button></p>
        ` : ""}
      </article>
    `;
  }).join("");
}

/* ---------- DASHBOARD NAVIGATION ---------- */

function renderView(view) {
  const current = getCurrentUser();

  if (!current) {
    window.location.replace("index.html");
    return;
  }

  showNotice("");

  if (view === "profile") renderProfile();
  else if (view === "discover") renderDiscover();
  else if (view === "saved") renderSaved();
  else if (view === "messages") renderMessages();
}

function initializeDashboard() {
  const container = document.getElementById("dashboardContent");

  // This script is also loaded on index.html.
  if (!container) return;

  const current = getCurrentUser();

  if (!current) {
    container.innerHTML = `
      <section class="dash-section">
        <h2>Please log in</h2>
        <p>Your session is missing or has expired.</p>
        <a class="btn" href="index.html">Go to login</a>
      </section>`;
    return;
  }

  updateDashboardIdentity(current);

  document.getElementById("logoutButton")?.addEventListener("click", logout);

  document.querySelectorAll(".side-link").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".side-link").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderView(button.dataset.view);
    });
  });

  // One delegated listener handles profile-card buttons, including dynamically rendered cards.
  container.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "save") toggleSavedCreator(id);
    if (button.dataset.action === "message") sendMessage(id);
  });

  renderView("profile");
}

/* ---------- CONNECT ALL FORMS ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-show]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      showPage(button.dataset.show);
    });
  });

  document.getElementById("creatorRegisterForm")
    ?.addEventListener("submit", event => register(event, "creator"));

  document.getElementById("brandRegisterForm")
    ?.addEventListener("submit", event => register(event, "brand"));

  document.getElementById("creatorLoginForm")
    ?.addEventListener("submit", event => login(event, "creator"));

  document.getElementById("brandLoginForm")
    ?.addEventListener("submit", event => login(event, "brand"));

  // Show the homepage initially; support opening an auth section through a URL hash.
  if (!document.getElementById("dashboardContent")) {
    const allowed = [
      "home", "choose", "creatorRegister", "brandRegister",
      "creatorLogin", "brandLogin"
    ];

    const requested = window.location.hash.slice(1);
    showPage(allowed.includes(requested) ? requested : "home");
  }

  initializeDashboard();
});
