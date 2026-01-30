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
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true
  });
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
      waypoints: pubs.slice(1, -1).map(p => ({
        location: p.position,
        stopover: true
      })),
      travelMode: google.maps.TravelMode.WALKING
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
      }
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

function openProfile(el) {
  showModal(`
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
