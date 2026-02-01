// ================================================================
//  SHARED AUTH & USER LAYER
//  Both index.html and event.html load this first.
//  In production swap the DB object's reads/writes for fetch() calls.
// ================================================================

const DB = {
  users: {},       // email → { name, email, passwordHash, photo, bio, age }
  session: null,   // currently logged-in email | null
  attendees: {}    // eventId → [email, ...]
};

// ================================================================
//  PERSISTENCE  (localStorage)
//  persist() is called after every mutation.
//  restore() runs once after seeding so saved data merges on top.
// ================================================================
const STORAGE_KEY = "pubcrawl_db";

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      users:     DB.users,
      session:   DB.session,
      attendees: DB.attendees
    }));
  } catch (e) {
    // silently ignore (e.g. quota exceeded)
  }
}

function restore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    // Merge saved users on top of seeds (so demo accounts stay,
    // but any real accounts or edits to demos are preserved)
    if (saved.users)     Object.assign(DB.users, saved.users);
    if (saved.attendees) Object.assign(DB.attendees, saved.attendees);
    if (saved.session)   DB.session = saved.session;
  } catch (e) {
    // corrupted data — start fresh
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ── seed demo users ────────────────────────────────────────────
(function seedDemos() {
  [
    { name:"Sarah",  email:"sarah@demo.com",  photo:"https://i.pravatar.cc/100?img=1", age:28, bio:"First pub crawl — excited 🍻" },
    { name:"Mike",   email:"mike@demo.com",   photo:"https://i.pravatar.cc/100?img=2", age:31, bio:"Craft beer fan and pub quiz legend." },
    { name:"Laura",  email:"laura@demo.com",  photo:"https://i.pravatar.cc/100?img=3", age:26, bio:"Just here for a good night out" }
  ].forEach(u => {
    DB.users[u.email] = { ...u, passwordHash:"demo" };
  });
  DB.attendees["downtown-crawl"] = ["sarah@demo.com","mike@demo.com","laura@demo.com"];
  DB.attendees["brewery-tour"]   = ["sarah@demo.com","mike@demo.com"];
})();

// load any previously saved state on top of the seeds
restore();

// ── tiny hash (demo only) ──────────────────────────────────────
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

// ── default avatar from initials ───────────────────────────────
function getDefaultAvatar(name) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const colors  = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f39c12","#1abc9c","#e67e22"];
  const c       = colors[name.charCodeAt(0) % colors.length];
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' rx='50' fill='${encodeURIComponent(c)}'/%3E%3Ctext x='50' y='62' text-anchor='middle' fill='white' font-size='42' font-family='system-ui'%3E${encodeURIComponent(initial)}%3C/text%3E%3C/svg%3E`;
}

// ================================================================
//  AUTH ACTIONS
// ================================================================
function authSignUp(name, email, password) {
  if (!name)                          return "Please enter your name.";
  if (!email || !email.includes("@")) return "Please enter a valid email.";
  if (password.length < 6)            return "Password must be at least 6 characters.";
  if (DB.users[email])                return "An account with that email already exists.";

  DB.users[email] = {
    name, email,
    passwordHash: simpleHash(password),
    photo: getDefaultAvatar(name),
    bio: "",
    age: null
  };
  DB.session = email;
  persist();
  return null;
}

function authLogIn(email, password) {
  if (!email || !email.includes("@")) return "Please enter a valid email.";
  if (!password)                      return "Please enter your password.";
  const user = DB.users[email];
  if (!user || user.passwordHash !== simpleHash(password))
    return "Email or password is incorrect.";
  DB.session = email;
  persist();
  return null;
}

function authLogOut() { DB.session = null; persist(); }

function authUser() { return DB.session ? DB.users[DB.session] : null; }

// ================================================================
//  PROFILE ACTIONS
// ================================================================
function profileSave({ name, age, bio, photo }) {
  if (!DB.session) return;
  const user   = DB.users[DB.session];
  user.name    = name  || user.name;
  user.age     = age   ? parseInt(age, 10) : null;
  user.bio     = bio   || "";
  user.photo   = photo || user.photo;
  persist();
}

// ================================================================
//  EVENT ATTENDEE ACTIONS
// ================================================================
function eventJoin(eventId) {
  if (!DB.session) return;
  if (!DB.attendees[eventId]) DB.attendees[eventId] = [];
  if (!DB.attendees[eventId].includes(DB.session))
    DB.attendees[eventId].push(DB.session);
  persist();
}

function eventIsJoined(eventId) {
  return DB.session && DB.attendees[eventId] && DB.attendees[eventId].includes(DB.session);
}

function eventAttendees(eventId) {
  return (DB.attendees[eventId] || []).map(e => DB.users[e]).filter(Boolean);
}

function eventAttendeeCount(eventId) {
  return (DB.attendees[eventId] || []).length;
}