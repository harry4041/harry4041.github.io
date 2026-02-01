// ================================================================
//  IN-MEMORY "DATABASE"
//  In production, replace every read/write here with fetch() calls
//  to your backend API. The rest of the app needs zero changes.
// ================================================================
const DB = {
  users: {},          // email → { name, email, passwordHash, photo, bio, age }
  session: null,      // currently logged-in email, or null
  attendees: []       // emails of people who have joined this event
};

// Seed with the three demo attendees so the page isn't empty on first load
(function seedDemoUsers() {
  const demos = [
    { name: "Sarah",  email: "sarah@demo.com",  photo: "https://i.pravatar.cc/100?img=1", age: 28, bio: "First pub crawl — excited 🍻" },
    { name: "Mike",   email: "mike@demo.com",   photo: "https://i.pravatar.cc/100?img=2", age: 31, bio: "Craft beer fan and pub quiz legend." },
    { name: "Laura",  email: "laura@demo.com",  photo: "https://i.pravatar.cc/100?img=3", age: 26, bio: "Just here for a good night out" }
  ];
  demos.forEach(u => {
    DB.users[u.email] = { ...u, passwordHash: "demo" };
    DB.attendees.push(u.email);
  });
})();

// ── tiny hash so passwords aren't in plain text (demo only) ──
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// ================================================================
//  DEFAULT AVATAR (generated from initials)
// ================================================================
function getDefaultAvatar(name) {
  const initials = (name || "?").charAt(0).toUpperCase();
  // Return a data-URI SVG circle with the initial
  const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f39c12","#1abc9c","#e67e22"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' rx='50' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50' y='62' text-anchor='middle' fill='white' font-size='42' font-family='system-ui'%3E${encodeURIComponent(initials)}%3C/text%3E%3C/svg%3E`;
}

// ================================================================
//  AUTH FLOW
// ================================================================
function toggleForm(which) {
  document.getElementById("signup-form").classList.toggle("hidden", which !== "signup");
  document.getElementById("login-form").classList.toggle("hidden",  which !== "login");
  clearError();
}

function showError(msg) {
  const el = document.getElementById("auth-error");
  el.textContent = msg;
  el.classList.remove("hidden");
}
function clearError() {
  document.getElementById("auth-error").classList.add("hidden");
}

function handleSignUp() {
  clearError();
  const name     = document.getElementById("signup-name").value.trim();
  const email    = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;

  if (!name)                          return showError("Please enter your name.");
  if (!email || !email.includes("@")) return showError("Please enter a valid email.");
  if (password.length < 6)            return showError("Password must be at least 6 characters.");
  if (DB.users[email])                return showError("An account with that email already exists.");

  // Create account
  DB.users[email] = {
    name,
    email,
    passwordHash: simpleHash(password),
    photo: getDefaultAvatar(name),
    bio:   "",
    age:   null
  };

  // Auto-log in
  DB.session = email;
  onLogin();
}

function handleLogIn() {
  clearError();
  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  if (!email || !email.includes("@")) return showError("Please enter a valid email.");
  if (!password)                      return showError("Please enter your password.");

  const user = DB.users[email];
  if (!user || user.passwordHash !== simpleHash(password)) {
    return showError("Email or password is incorrect.");
  }

  DB.session = email;
  onLogin();
}

function onLogin() {
  // Switch screens
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("main-screen").classList.remove("hidden");

  // Update header avatar
  const user = DB.users[DB.session];
  document.getElementById("header-avatar").src = user.photo;

  // Update join button state
  updateJoinButton();

  // Render attendee profiles
  renderProfiles();
}

function logOut() {
  DB.session = null;
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
  // Clear form fields
  ["signup-name","signup-email","signup-password","login-email","login-password"].forEach(id => {
    document.getElementById(id).value = "";
  });
  clearError();
  closeModal();
}

// ================================================================
//  JOIN EVENT
// ================================================================
function handleJoinClick() {
  if (!DB.session) return;
  if (DB.attendees.includes(DB.session)) return; // already joined

  DB.attendees.push(DB.session);
  updateJoinButton();
  renderProfiles();
}

function updateJoinButton() {
  const btn = document.getElementById("join-btn");
  if (DB.attendees.includes(DB.session)) {
    btn.textContent = "Joined ✓";
    btn.classList.add("joined");
  } else {
    btn.textContent = "Join";
    btn.classList.remove("joined");
  }
}

// ================================================================
//  RENDER ATTENDEE PROFILES
// ================================================================
function renderProfiles() {
  const container = document.getElementById("profiles-container");
  container.innerHTML = "";

  DB.attendees.forEach(email => {
    const user = DB.users[email];
    if (!user) return;

    const card = document.createElement("div");
    card.className = "profile";
    card.onclick   = () => openProfileView(email);
    card.innerHTML = `<img src="${user.photo}" alt="${user.name}"><span>${user.name}</span>`;
    container.appendChild(card);
  });
}

// ================================================================
//  PROFILE VIEW MODAL  (read-only, for other people's profiles)
// ================================================================
function openProfileView(email) {
  const user = DB.users[email];
  if (!user) return;

  const isMe  = (email === DB.session);
  const age   = user.age  ? `<p><strong>Age:</strong> ${user.age}</p>` : "";
  const bio   = user.bio  ? `<p class="profile-bio">${user.bio}</p>`   : "";
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
//  PROFILE EDITOR MODAL  (edit own profile)
// ================================================================
let editorPhotoPreview = null; // holds base64 while editing

function openProfileEditor() {
  const user = DB.users[DB.session];
  editorPhotoPreview = user.photo; // snapshot current photo

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
      <button class="btn-ghost btn-logout" onclick="logOut()">Log Out</button>
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
  // Reset so the same file can be re-selected
  event.target.value = "";
}

function saveProfile() {
  const name = document.getElementById("editor-name").value.trim();
  const age  = document.getElementById("editor-age").value.trim();
  const bio  = document.getElementById("editor-bio").value.trim();

  if (!name) return; // silently ignore empty name

  const user       = DB.users[DB.session];
  user.name        = name;
  user.age         = age  ? parseInt(age, 10) : null;
  user.bio         = bio;
  user.photo       = editorPhotoPreview;

  // Update header avatar
  document.getElementById("header-avatar").src = user.photo;

  // Re-render attendees (in case name changed)
  renderProfiles();

  closeModal();
}

// ================================================================
//  PUB DATA & MAP
// ================================================================
let map;
let directionsService;
let directionsRenderer;

const pubs = [
  { name: "O'Malley's Tavern", position: { lat: 53.3498, lng: -6.2603 }, desc: "Traditional Irish pub with live music.", address: "12 High Street" },
  { name: "The Tipsy Pint",    position: { lat: 53.3489, lng: -6.2587 }, desc: "Craft beers and outdoor seating.",        address: "45 River Road" },
  { name: "The Brew House",    position: { lat: 53.3479, lng: -6.2569 }, desc: "Local brews and pub food.",               address: "88 Market Lane" },
  { name: "Club Metro",        position: { lat: 53.3465, lng: -6.2552 }, desc: "Late-night drinks and dancing.",          address: "3 Metro Plaza" }
];

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

function openPub(index) {
  const pub = pubs[index];
  showModal(`
    <h2>${pub.name}</h2>
    <p><strong>Address:</strong> ${pub.address}</p>
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