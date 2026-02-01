// ================================================================
//  EVENT PAGE LOGIC
// ================================================================

// ── pub stop data (keyed by event id for future multi-event support) ──
const PUB_DATA = {
  "downtown-crawl": [
    { name:"O'Malley's Tavern", position:{lat:53.3498,lng:-6.2603}, desc:"Traditional Irish pub with live music.", address:"12 High Street",  time:"7:00 PM" },
    { name:"The Tipsy Pint",    position:{lat:53.3489,lng:-6.2587}, desc:"Craft beers and outdoor seating.",        address:"45 River Road",   time:"8:00 PM" },
    { name:"The Brew House",    position:{lat:53.3479,lng:-6.2569}, desc:"Local brews and pub food.",               address:"88 Market Lane",  time:"9:00 PM" },
    { name:"Club Metro",        position:{lat:53.3465,lng:-6.2552}, desc:"Late-night drinks and dancing.",          address:"3 Metro Plaza",   time:"10:00 PM" }
  ],
  "brewery-tour": [
    { name:"The Malt Works",     position:{lat:53.4801,lng:-2.2422}, desc:"Small-batch ales brewed on site.",       address:"14 Cheetham Hill Rd", time:"6:30 PM" },
    { name:"Northern Hops Co.",  position:{lat:53.4812,lng:-2.2398}, desc:"IPAs and pale ales in a converted warehouse.", address:"7 Whitworth St",     time:"7:45 PM" },
    { name:"Barrel & Rye",       position:{lat:53.4825,lng:-2.2370}, desc:"Finish the night with craft cocktails.", address:"22 Swan St",          time:"9:00 PM" }
  ]
};

// ── resolve current event from URL ──────────────────────────────
function getCurrentEventId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("event") || "downtown-crawl"; // fallback
}

let currentEventId;
let pubs; // the active stop array

// ================================================================
//  ON LOAD
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  currentEventId = getCurrentEventId();
  pubs = PUB_DATA[currentEventId] || PUB_DATA["downtown-crawl"];

  // Pull event metadata from the shared EVENTS list (defined in index.js / window.EVENTS)
  // If we landed here directly (no index.js), define a minimal fallback
  if (!window.EVENTS) {
    window.EVENTS = [
      { id:"downtown-crawl", title:"Downtown Pub Crawl", date:"Friday, May 27", time:"7:00 PM", location:"High Street → Metro Plaza" },
      { id:"brewery-tour",   title:"Brewery Tour Night", date:"Saturday, June 3", time:"6:30 PM", location:"Northern Quarter" }
    ];
  }

  const eventMeta = window.EVENTS.find(e => e.id === currentEventId) || window.EVENTS[0];

  document.title = eventMeta.title;
  document.getElementById("event-title").textContent = eventMeta.title;
  document.getElementById("event-meta").textContent  = `${eventMeta.date} · ${eventMeta.time} · ${eventMeta.location}`;

  renderNav();
  renderSchedule();
  renderProfiles();
  updateJoinButton();
});

// ================================================================
//  NAV (same pattern as index.js)
// ================================================================
function renderNav() {
  const container = document.getElementById("nav-right");
  const user = authUser();

  if (user) {
    container.innerHTML = `
      <div class="nav-avatar" onclick="openProfileEditor()">
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
//  AUTH MODAL (same logic as index.js — duplicated so event page
//  works standalone if someone bookmarks / shares the link)
// ================================================================
let pendingAuthAction = null; // "join" | null — what to do after successful auth

function openAuthModal(action) {
  pendingAuthAction = action || null;
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
  afterAuth();
}

function handleLogIn() {
  clearAuthError();
  const err = authLogIn(
    document.getElementById("login-email").value.trim().toLowerCase(),
    document.getElementById("login-password").value
  );
  if (err) return showAuthError(err);
  afterAuth();
}

function afterAuth() {
  closeAuthModal();
  renderNav();
  // If the user was trying to join, do it now
  if (pendingAuthAction === "join") {
    eventJoin(currentEventId);
    pendingAuthAction = null;
  }
  updateJoinButton();
  renderProfiles();
}

// ================================================================
//  JOIN
// ================================================================
function handleJoinClick() {
  if (!authUser()) {
    openAuthModal("join"); // prompt login first, then join on success
    return;
  }
  eventJoin(currentEventId);
  updateJoinButton();
  renderProfiles();
}

function updateJoinButton() {
  const btn = document.getElementById("join-btn");
  if (eventIsJoined(currentEventId)) {
    btn.textContent = "Joined ✓";
    btn.classList.add("joined");
  } else {
    btn.textContent = "Join";
    btn.classList.remove("joined");
  }

  const countEl = document.getElementById("attendee-count");
  const n = eventAttendeeCount(currentEventId);
  countEl.textContent = n > 0 ? `${n} going` : "";
}

// ================================================================
//  SCHEDULE
// ================================================================
function renderSchedule() {
  const ul = document.getElementById("schedule-list");
  ul.innerHTML = pubs.map((pub, i) => `
    <li onclick="openPub(${i})">
      <span>${pub.time}</span> ${pub.name}
    </li>
  `).join("");
}

// ================================================================
//  ATTENDEE PROFILES
// ================================================================
function renderProfiles() {
  const container = document.getElementById("profiles-container");
  const attendees = eventAttendees(currentEventId);

  container.innerHTML = attendees.map(u => `
    <div class="profile" onclick="openProfileView('${u.email}')">
      <img src="${u.photo}" alt="${u.name}" />
      <span>${u.name}</span>
    </div>
  `).join("");
}

// ================================================================
//  PROFILE VIEW MODAL
// ================================================================
function openProfileView(email) {
  const user = DB.users[email];
  if (!user) return;

  const isMe   = (email === DB.session);
  const age    = user.age ? `<p><strong>Age:</strong> ${user.age}</p>` : "";
  const bio    = user.bio ? `<p class="profile-bio">${user.bio}</p>`   : "";
  const editBtn = isMe
    ? `<button class="btn-ghost btn-edit-profile" onclick="closeModal(); openProfileEditor();">Edit Profile</button>`
    : "";

  showModal(`
    <img src="${user.photo}" alt="${user.name}" />
    <h2>${user.name}</h2>
    <p class="profile-email">${user.email}</p>
    ${age}
    ${bio}
    ${editBtn}
  `);
}

// ================================================================
//  PROFILE EDITOR MODAL
// ================================================================
let editorPhotoPreview = null;

function openProfileEditor() {
  const user = authUser();
  if (!user) return;
  editorPhotoPreview = user.photo;

  showModal(`
    <div class="editor-avatar-wrap">
      <img id="editor-avatar" src="${user.photo}" alt="Preview" />
      <button class="btn-change-photo" onclick="document.getElementById('photo-upload').click()">Change Photo</button>
    </div>
    <div class="field">
      <label>Name</label>
      <input type="text" id="editor-name" value="${user.name}" />
    </div>
    <div class="field">
      <label>Age <span class="optional">(optional)</span></label>
      <input type="number" id="editor-age" value="${user.age || ''}" min="1" max="99" placeholder="e.g. 29" />
    </div>
    <div class="field">
      <label>Bio <span class="optional">(optional)</span></label>
      <input type="text" id="editor-bio" value="${user.bio || ''}" placeholder="A little about yourself…" maxlength="80" />
    </div>
    <div class="editor-actions">
      <button class="btn-primary" onclick="saveProfile()">Save</button>
      <button class="btn-ghost btn-logout" onclick="doLogOut()">Log Out</button>
    </div>
  `);
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    editorPhotoPreview = e.target.result;
    const img = document.getElementById("editor-avatar");
    if (img) img.src = editorPhotoPreview;
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function saveProfile() {
  profileSave({
    name:  document.getElementById("editor-name").value.trim(),
    age:   document.getElementById("editor-age").value.trim(),
    bio:   document.getElementById("editor-bio").value.trim(),
    photo: editorPhotoPreview
  });
  closeModal();
  renderNav();
  renderProfiles();
}

function doLogOut() {
  authLogOut();
  closeModal();
  renderNav();
  updateJoinButton();
}

// ================================================================
//  PUB DETAIL MODAL
// ================================================================
function openPub(index) {
  const pub = pubs[index];
  showModal(`
    <h2>${pub.name}</h2>
    <p><strong>Address:</strong> ${pub.address}</p>
    <p><strong>Time:</strong> ${pub.time}</p>
    <p>${pub.desc}</p>
  `);
}

// ================================================================
//  SHARED MODAL HELPERS
// ================================================================
function showModal(html) {
  document.getElementById("modal-content").innerHTML = html;
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

function handleModalBg(event) {
  if (event.target === document.getElementById("modal-overlay")) closeModal();
}

// ================================================================
//  GOOGLE MAP
// ================================================================
let map, directionsService, directionsRenderer;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: pubs[0].position
  });

  directionsService  = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
  directionsRenderer.setMap(map);

  pubs.forEach((pub, i) => {
    const marker = new google.maps.Marker({ position: pub.position, map, label: `${i + 1}` });
    marker.addListener("click", () => openPub(i));
  });

  drawRoute();
}

function drawRoute() {
  directionsService.route(
    {
      origin: pubs[0].position,
      destination: pubs[pubs.length - 1].position,
      waypoints: pubs.slice(1, -1).map(p => ({ location: p.position, stopover: true })),
      travelMode: google.maps.TravelMode.WALKING
    },
    (result, status) => {
      if (status === "OK") directionsRenderer.setDirections(result);
    }
  );
}
