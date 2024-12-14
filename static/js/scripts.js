// Global variables for the map and markers
let map;
let markers = []; // Array to hold all markers

document.addEventListener("DOMContentLoaded", function () {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("start-date").setAttribute("min", today);

    document.getElementById("itineraryForm").addEventListener("submit", function (event) {
        event.preventDefault();
        startItineraryStream();
    });
});

function startItineraryStream() {
    const destination = document.getElementById("destination").value;
    const startDate = document.getElementById("start-date").value;
    const tripDays = document.getElementById("trip-days").value;
    const interests = document.getElementById("interests").value;

    if (!destination || !startDate || !tripDays || !interests) {
        alert("Please fill in all fields.");
        return;
    }

    const tabs = document.getElementById("itineraryTabs");
    const tabContent = document.getElementById("itineraryTabContent");
    tabs.innerHTML = "";
    tabContent.innerHTML = "";

    const loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.add("active");

    const queryString = `?destination=${encodeURIComponent(destination)}&start_date=${startDate}&trip_days=${tripDays}&interests=${encodeURIComponent(interests)}`;
    const eventSource = new EventSource(`/itinerary_stream${queryString}`);

    eventSource.onmessage = function (event) {
        if (!event.data) return;

        console.log("Raw Event Data:", event.data);

        try {
            const cleanData = cleanJsonString(event.data);
            console.log("Cleaned JSON Data:", cleanData);

            const data = JSON.parse(cleanData);

            if (data.day) {
                processDayData(data.day);
            }
        } catch (err) {
            console.error("Error parsing event data:", err.message);
            console.error("Faulty Raw Data:", event.data);
            alert("An error occurred while generating the itinerary. Please try again.");
        }
    };

    eventSource.onerror = function () {
        alert("Error while generating itinerary. Please try again.");
        eventSource.close();
        loadingOverlay.classList.remove("active");
    };

    eventSource.addEventListener("close", () => {
        loadingOverlay.classList.remove("active");
        eventSource.close();
    });
}

function cleanJsonString(jsonString) {
    return jsonString
        .replace(/\/\/.*$/gm, "") // Remove comments
        .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
        .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
        .replace(/\s*\/\/.*$/gm, "") // Remove inline comments
        .replace(/“|”/g, '"') // Replace curly double quotes with straight quotes
        .replace(/‘|’/g, "'") // Replace curly single quotes with straight quotes
        .replace(/\\u([\dA-F]{4})/gi, (match, group1) =>
            String.fromCharCode(parseInt(group1, 16))
        ) // Decode Unicode escape sequences
        .trim();
}

function processDayData(day) {
    console.log("Processing Day Data:", day);

    const tabs = document.getElementById("itineraryTabs");
    const tabContent = document.getElementById("itineraryTabContent");
    const dayNumber = tabs.children.length + 1;

    const mapLocations = [];
    if (day.morning?.lat && day.morning?.lng) {
        mapLocations.push({
            lat: day.morning.lat,
            lng: day.morning.lng,
            title: `Morning: ${day.morning.activity}`,
            description: day.morning.description,
        });
    }
    if (day.afternoon?.lat && day.afternoon?.lng) {
        mapLocations.push({
            lat: day.afternoon.lat,
            lng: day.afternoon.lng,
            title: `Afternoon: ${day.afternoon.activity}`,
            description: day.afternoon.description,
        });
    }
    if (day.evening?.lat && day.evening?.lng) {
        mapLocations.push({
            lat: day.evening.lat,
            lng: day.evening.lng,
            title: `Evening: ${day.evening.activity}`,
            description: day.evening.description,
        });
    }
    (day.recommendations?.food || []).forEach((item) => {
        if (item.lat && item.lng) {
            mapLocations.push({
                lat: item.lat,
                lng: item.lng,
                title: `Food: ${item.name}`,
                description: item.description,
            });
        }
    });
    (day.recommendations?.accommodations || []).forEach((item) => {
        if (item.lat && item.lng) {
            mapLocations.push({
                lat: item.lat,
                lng: item.lng,
                title: `Accommodation: ${item.name}`,
                description: item.description,
            });
        }
    });

    const tabIndex = dayNumber - 1;
    tabs.innerHTML += `<li onclick="updateMap(${tabIndex})">Day ${dayNumber} - ${day.day}</li>`;
    tabContent.innerHTML += `
        <li class="tab-pane" data-locations='${JSON.stringify(mapLocations)}'>
            <div class="card">
                <h3>Map of Activities</h3>
                <div id="map-container-${dayNumber}" class="map-container"></div>
            </div>
            <div class="card">
                <h3>Morning</h3>
                <p>${day.morning?.activity || "No activity available for this time."}</p>
                <p>${day.morning?.description || "No details available for this time."}</p>
            </div>
            <div class="card">
                <h3>Afternoon</h3>
                <p>${day.afternoon?.activity || "No activity available for this time."}</p>
                <p>${day.afternoon?.description || "No details available for this time."}</p>
            </div>
            <div class="card">
                <h3>Evening</h3>
                <p>${day.evening?.activity || "No activity available for this time."}</p>
                <p>${day.evening?.description || "No details available for this time."}</p>
            </div>
            <div class="card">
                <h3>Recommendations</h3>
                <h4>Food</h4>
                <ul>${(day.recommendations?.food || [])
                    .map(
                        (item) =>
                            `<li><strong>${item.name}</strong>: ${item.description || "No description available."}</li>`
                    )
                    .join("")}</ul>
                <h4>Accommodations</h4>
                <ul>${(day.recommendations?.accommodations || [])
                    .map(
                        (item) =>
                            `<li><strong>${item.name}</strong>: ${item.description || "No description available."}</li>`
                    )
                    .join("")}</ul>
            </div>
        </li>
    `;

    if (dayNumber === 1) {
        initializeMap(mapLocations, `map-container-${dayNumber}`);
    }
}

function initializeMap(locations, mapContainerId) {
    const mapContainer = document.getElementById(mapContainerId);
    if (!mapContainer) return;

    map = new google.maps.Map(mapContainer, {
        zoom: 12,
        center: locations[0],
    });

    updateMarkers(locations);
}

function updateMarkers(locations) {
    markers.forEach((marker) => marker.setMap(null));
    markers = [];

    locations.forEach((location) => {
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.title,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${location.title}</h3><p>${location.description}</p>`,
        });

        marker.addListener("click", () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });

    if (locations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        locations.forEach((location) => bounds.extend({ lat: location.lat, lng: location.lng }));
        map.fitBounds(bounds);
    } else {
        map.setCenter({ lat: 0, lng: 0 });
        map.setZoom(2);
    }
}

function updateMap(tabIndex) {
    const tabs = document.getElementById("itineraryTabs").children;
    const panes = document.getElementById("itineraryTabContent").children;

    Array.from(tabs).forEach((tab) => tab.classList.remove("active"));
    Array.from(panes).forEach((pane) => pane.classList.remove("active"));

    tabs[tabIndex].classList.add("active");
    panes[tabIndex].classList.add("active");

    const pane = document.getElementById("itineraryTabContent").children[tabIndex];
    const locations = JSON.parse(pane.getAttribute("data-locations"));

    const mapContainerId = `map-container-${tabIndex + 1}`;
    initializeMap(locations, mapContainerId);

    updateMarkers(locations);
}
