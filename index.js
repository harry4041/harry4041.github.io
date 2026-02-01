// ================================================================
//  INDEX PAGE LOGIC
// ================================================================

// ── event data (shared source of truth; event.js reads the same) ──
const EVENTS = [
  {
    id: "downtown-crawl",
    title: "Downtown Pub Crawl",
    date: "Friday, May 27",
    time: "7:00 PM",
    location: "High Street → Metro Plaza",
    stops: 4,
    description: "A classic crawl through the best pubs downtown. Live music at the first stop, craft beers mid-route, and dancing to finish the night.",
    url: "event.html?event=downtown-crawl"
  },
  {
    id: "brewery-tour",
    title: "Brewery Tour Night",
    date: "Saturday, June 3",
    time: "6:30 PM",
    location: "Northern Quarter",
    stops: 3,
    description: "Guided tours of three local microbreweries with tastings at each. A more chilled vibe — perfect if you want to actually taste what you're drinking.",
    url: "event.html?event=brewery-tour"
  }
];

// Make EVENTS available to event.js when it needs to look up by id
window.EVENTS = EVENTS;

// ================================================================
//  ON LOAD
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  renderNav();
  renderActiveStrip();
  renderEventCards();
});

// ================================================================
//  NAV
// ================================================================
function renderNav() {
  const container = document.getElementById("nav-right");
  const user = authUser();

  if (user) {
    container.innerHTML = `
      <div class="nav-avatar" onclick="openAuthModal()">
        <img src="${user.photo}" alt="${user.name}" />
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-nav-login" onclick="openAuthModal()">Log in</button>
    `;
  }
}

// ================================================================
//  AUTH MODAL
// ================================================================
function openAuthModal() {
  document.getElementById("auth-modal").classList.remove("hidden");
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.add("hidden");
  clearAuthError();
}

function toggleAuthPanel(which) {
  document.getElementById("auth-signup-panel").classList.toggle("hidden", which !== "signup");
  document.getElementById("auth-login-panel").classList.toggle("hidden",  which !== "login");
  clearAuthError();
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearAuthError() {
  document.getElementById("auth-error").classList.add("hidden");
}

function handleSignUp() {
  clearAuthError();
  const err = authSignUp(
    document.getElementById("signup-name").value.trim(),
    document.getElementById("signup-email").value.trim().toLowerCase(),
    document.getElementById("signup-password").value
  );
  if (err) return showAuthError(err);
  closeAuthModal();
  renderNav();
  renderActiveStrip();
  renderEventCards(); // re-render so "joined" badges update
}

function handleLogIn() {
  clearAuthError();
  const err = authLogIn(
    document.getElementById("login-email").value.trim().toLowerCase(),
    document.getElementById("login-password").value
  );
  if (err) return showAuthError(err);
  closeAuthModal();
  renderNav();
  renderActiveStrip();
  renderEventCards();
}

// ================================================================
//  ACTIVE-USERS STRIP
// ================================================================
function renderActiveStrip() {
  const container = document.getElementById("strip-avatars");
  // Show all users who are attending at least one event
  const activeEmails = [...new Set(Object.values(DB.attendees).flat())];
  const activeUsers  = activeEmails.map(e => DB.users[e]).filter(Boolean);

  container.innerHTML = activeUsers.map(u => `
    <div class="strip-avatar" title="${u.name}">
      <img src="${u.photo}" alt="${u.name}" />
      <span class="strip-dot"></span>
    </div>
  `).join("");
}

// ================================================================
//  EVENT CARDS
// ================================================================
function renderEventCards() {
  const container = document.getElementById("event-cards");

  container.innerHTML = EVENTS.map(ev => {
    const count   = eventAttendeeCount(ev.id);
    const joined  = eventIsJoined(ev.id);
    const avatars = eventAttendees(ev.id).slice(0, 4); // show max 4 avatars

    const avatarHTML = avatars.map(u =>
      `<img src="${u.photo}" alt="${u.name}" class="card-avatar" />`
    ).join("");

    const overflow = count > 4
      ? `<span class="card-avatar-more">+${count - 4}</span>`
      : "";

    const badge = joined
      ? `<span class="card-badge joined">Joined ✓</span>`
      : "";

    return `
      <a href="${ev.url}" class="event-card">
        <div class="card-top">
          <div class="card-meta">
            <span class="card-date">${ev.date}</span>
            <span class="card-time">${ev.time}</span>
          </div>
          ${badge}
        </div>
        <h3 class="card-title">${ev.title}</h3>
        <p class="card-location">📍 ${ev.location} · ${ev.stops} stops</p>
        <p class="card-desc">${ev.description}</p>
        <div class="card-footer">
          <div class="card-avatars">
            ${avatarHTML}
            ${overflow}
          </div>
          <span class="card-going">${count} going</span>
        </div>
      </a>
    `;
  }).join("");
}

// ================================================================
//  SCROLL HELPER
// ================================================================
function scrollToEvents() {
  document.getElementById("events-feed").scrollIntoView({ behavior: "smooth" });
}
