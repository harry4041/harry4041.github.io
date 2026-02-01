let map;
let directionsService;
let directionsRenderer;

const pubs = [
  {
    name: "O'Malley's Tavern",
    position: { lat: 53.3498, lng: -6.2603 },
    desc: "Traditional Irish pub with live music.",
    address: "12 High Street"
  },
  {
    name: "The Tipsy Pint",
    position: { lat: 53.3489, lng: -6.2587 },
    desc: "Craft beers and outdoor seating.",
    address: "45 River Road"
  },
  {
    name: "The Brew House",
    position: { lat: 53.3479, lng: -6.2569 },
    desc: "Local brews and pub food.",
    address: "88 Market Lane"
  },
  {
    name: "Club Metro",
    position: { lat: 53.3465, lng: -6.2552 },
    desc: "Late-night drinks and dancing.",
    address: "3 Metro Plaza"
  }
];

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: pubs[0].position
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
  directionsRenderer.setMap(map);

  pubs.forEach((pub, i) => {
    const marker = new google.maps.Marker({
      position: pub.position,
      map,
      label: `${i + 1}`
    });

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

// ✅ Updated to show profile picture
function openProfile(el) {
  showModal(`
    <img src="${el.dataset.img}" alt="${el.dataset.name}">
    <h2>${el.dataset.name}</h2>
    <p><strong>Age:</strong> ${el.dataset.age}</p>
    <p>${el.dataset.bio}</p>
  `);
}

function showModal(html) {
  document.getElementById("modal-content").innerHTML = html;
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

// ──────────────────────────────
// Join / Create Profile flow
// ──────────────────────────────

const AVATAR_POOL = [
  "https://i.pravatar.cc/100?img=4",
  "https://i.pravatar.cc/100?img=5",
  "https://i.pravatar.cc/100?img=6",
  "https://i.pravatar.cc/100?img=7",
  "https://i.pravatar.cc/100?img=8",
  "https://i.pravatar.cc/100?img=9",
  "https://i.pravatar.cc/100?img=10",
  "https://i.pravatar.cc/100?img=11",
  "https://i.pravatar.cc/100?img=12"
];

let selectedAvatar = AVATAR_POOL[0];
let hasJoined = false;

// Build avatar picker on page load
(function initAvatarPicker() {
  const container = document.getElementById("avatar-picker");
  AVATAR_POOL.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Avatar option";
    img.className = "avatar-option" + (i === 0 ? " selected" : "");
    img.onclick = () => {
      document.querySelectorAll(".avatar-option").forEach(el => el.classList.remove("selected"));
      img.classList.add("selected");
      selectedAvatar = src;
    };
    container.appendChild(img);
  });
})();

function openJoinModal() {
  if (hasJoined) return;
  document.getElementById("join-modal-overlay").classList.remove("hidden");
}

function closeJoinModal() {
  document.getElementById("join-modal-overlay").classList.add("hidden");
}

function submitJoin() {
  const name = document.getElementById("join-name").value.trim();
  const age  = document.getElementById("join-age").value.trim();
  const bio  = document.getElementById("join-bio").value.trim() || "Ready for a great night out!";

  if (!name) { shake("join-name"); return; }
  if (!age)  { shake("join-age");  return; }

  // Create the profile card
  const profilesContainer = document.querySelector(".profiles");
  const card = document.createElement("div");
  card.className = "profile";
  card.dataset.name = name;
  card.dataset.age  = age;
  card.dataset.bio  = bio;
  card.dataset.img  = selectedAvatar;
  card.onclick      = () => openProfile(card);
  card.innerHTML    = `<img src="${selectedAvatar}" alt="${name}"><span>${name}</span>`;

  // Animate in
  card.style.opacity = "0";
  card.style.transform = "translateY(12px)";
  profilesContainer.appendChild(card);
  requestAnimationFrame(() => {
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  });

  // Update button state
  hasJoined = true;
  const btn = document.getElementById("join-btn");
  btn.textContent = "Joined ✓";
  btn.classList.add("joined");
  btn.style.cursor = "default";

  closeJoinModal();
}

function shake(id) {
  const el = document.getElementById(id);
  el.classList.add("shake");
  el.focus();
  setTimeout(() => el.classList.remove("shake"), 400);
}