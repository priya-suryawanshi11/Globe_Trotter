
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");
    const pageTitle = document.getElementById("pageTitle");
    const toast = document.getElementById("toast");

    const destinationForm = document.getElementById("destinationForm");
    const destinationMessage = document.getElementById("destinationMessage");
    const destinationTableBody = document.getElementById("destinationTableBody");
    const destinationSearch = document.getElementById("destinationSearch");

    const tripTableBody = document.getElementById("tripTableBody");
    const tripSearch = document.getElementById("tripSearch");

    const DESTINATIONS_KEY = "globetrotterAdminDestinations";

    const defaultDestinations = [
        { id: "goa", name: "Goa", state: "Goa", budget: 8000, emoji: "🏖️" },
        { id: "manali", name: "Manali", state: "Himachal Pradesh", budget: 12000, emoji: "🏔️" },
        { id: "jaipur", name: "Jaipur", state: "Rajasthan", budget: 7000, emoji: "🏰" },
        { id: "kerala", name: "Kerala", state: "Kerala", budget: 15000, emoji: "🌴" },
        { id: "mumbai", name: "Mumbai", state: "Maharashtra", budget: 9000, emoji: "🌆" },
        { id: "rishikesh", name: "Rishikesh", state: "Uttarakhand", budget: 6000, emoji: "🌊" }
    ];

    function readJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        } catch (error) {
            console.error("Could not read " + key, error);
            return fallback;
        }
    }

    function loadDestinations() {
        const saved = readJSON(DESTINATIONS_KEY, null);

        if (Array.isArray(saved)) {
            return saved;
        }

        localStorage.setItem(
            DESTINATIONS_KEY,
            JSON.stringify(defaultDestinations)
        );

        return [...defaultDestinations];
    }

    function saveDestinations(destinations) {
        localStorage.setItem(
            DESTINATIONS_KEY,
            JSON.stringify(destinations)
        );
    }

    function loadTrips() {
        const trips = readJSON("globetrotterTrips", []);
        return Array.isArray(trips) ? trips : [];
    }

    function destinationOf(trip) {
        return trip.destination || trip.place || trip.city || "Your Adventure";
    }

    function daysOf(trip) {
        const days = Number(trip.days || trip.duration || 0);
        return Number.isFinite(days) && days > 0 ? days : 0;
    }

    function budgetOf(trip) {
        const budget = Number(trip.budget || 0);
        return Number.isFinite(budget) && budget > 0 ? budget : 0;
    }

    function travellersOf(trip) {
        const count = Number(trip.travellers || trip.travelers || 1);
        return Number.isFinite(count) && count > 0 ? count : 1;
    }

    function formatCurrency(amount) {
        return "₹" + amount.toLocaleString("en-IN");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    function getEmoji(name) {
        const place = name.toLowerCase();

        if (place.includes("goa")) return "🏖️";
        if (place.includes("manali")) return "🏔️";
        if (place.includes("jaipur")) return "🏰";
        if (place.includes("kerala")) return "🌴";
        if (place.includes("mumbai")) return "🌆";
        if (place.includes("rishikesh")) return "🌊";

        return "📍";
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        window.clearTimeout(showToast.timer);

        showToast.timer = window.setTimeout(function () {
            toast.classList.remove("show");
        }, 2600);
    }

    // SIDEBAR NAVIGATION

    const sectionTitles = {
        overview: "Dashboard Overview",
        destinations: "Destination Management",
        trips: "Saved Trip Management"
    };

    function openSection(sectionId) {
        const validSections = ["overview", "destinations", "trips"];

        if (!validSections.includes(sectionId)) {
            sectionId = "overview";
        }

        document.querySelectorAll(".admin-section").forEach(function (section) {
            section.hidden = section.id !== sectionId;
        });

        document.querySelectorAll(".nav-item[data-section]").forEach(function (link) {
            link.classList.toggle(
                "active",
                link.dataset.section === sectionId
            );
        });

        pageTitle.textContent = sectionTitles[sectionId];
        sidebar.classList.remove("open");

        if (sectionId === "overview") {
            renderOverview();
        } else if (sectionId === "destinations") {
            renderDestinations();
        } else if (sectionId === "trips") {
            renderTrips();
        }

        history.replaceState(null, "", "#" + sectionId);
    }

    document.querySelectorAll(".nav-item[data-section]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            openSection(link.dataset.section);
        });
    });

    document.querySelectorAll("[data-go]").forEach(function (button) {
        button.addEventListener("click", function () {
            openSection(button.dataset.go);
        });
    });

    menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });

    document.getElementById("adminLogout").addEventListener("click", function () {
        window.location.href = "index.html";
    });

    // DASHBOARD STATISTICS

    function renderStatistics() {
        const destinations = loadDestinations();
        const trips = loadTrips();

        // This is a demo count, not authenticated or database-backed users.
        const users = readJSON("globetrotterUsers", []);

        document.getElementById("userStat").textContent =
            Array.isArray(users) ? users.length : 0;

        document.getElementById("destinationStat").textContent =
            destinations.length;

        document.getElementById("tripStat").textContent =
            trips.length;

        const combinedBudget = trips.reduce(function (sum, trip) {
            return sum + budgetOf(trip);
        }, 0);

        document.getElementById("budgetStat").textContent =
            formatCurrency(combinedBudget);
    }

    function renderOverview() {
        renderStatistics();

        const trips = loadTrips();
        const overviewTrips = document.getElementById("overviewTrips");

        if (trips.length === 0) {
            overviewTrips.innerHTML = `
                <div class="no-records">
                    <div style="font-size:30px;margin-bottom:8px">🧳</div>
                    No saved trips yet.<br>
                    Create a trip using the Trip Planner to see it here.
                </div>
            `;
            return;
        }

        overviewTrips.innerHTML = trips.slice(-4).reverse().map(function (trip) {
            const destination = destinationOf(trip);
            const budget = budgetOf(trip);

            return `
                <div class="overview-trip-row">
                    <div class="overview-trip-emoji">
                        ${getEmoji(destination)}
                    </div>

                    <div class="overview-trip-info">
                        <strong>${escapeHTML(destination)}</strong>
                        <small>${daysOf(trip) || "Flexible"} day(s)
                            · ${travellersOf(trip)} traveller(s)</small>
                    </div>

                    <span class="overview-trip-budget">
                        ${budget ? formatCurrency(budget) : "No budget"}
                    </span>
                </div>
            `;
        }).join("");
    }

    // DESTINATION MANAGEMENT

    function renderDestinations() {
        const destinations = loadDestinations();
        const search = destinationSearch.value.trim().toLowerCase();

        const filtered = destinations.filter(function (destination) {
            return (
                destination.name.toLowerCase().includes(search) ||
                destination.state.toLowerCase().includes(search)
            );
        });

        document.getElementById("destinationListCount").textContent =
            destinations.length;

        destinationTableBody.innerHTML = filtered.map(function (destination) {
            return `
                <tr>
                    <td>
                        <div class="destination-cell">
                            <span>${escapeHTML(destination.emoji || "📍")}</span>
                            ${escapeHTML(destination.name)}
                        </div>
                    </td>

                    <td class="region-cell">
                        ${escapeHTML(destination.state)}
                    </td>

                    <td class="budget-cell">
                        ${formatCurrency(Number(destination.budget) || 0)}
                    </td>

                    <td>
                        <button class="delete-button"
                                type="button"
                                data-delete-destination="${escapeHTML(destination.id)}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        document.getElementById("noDestinations").hidden =
            filtered.length !== 0;

        renderStatistics();
    }

    destinationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("destinationName").value.trim();
        const state = document.getElementById("destinationState").value.trim();
        const budget = Number(document.getElementById("destinationBudget").value);
        const emoji = document.getElementById("destinationEmoji").value;

        if (!name || !state || !Number.isFinite(budget) || budget <= 0) {
            destinationMessage.textContent =
                "Please enter valid destination details.";
            return;
        }

        const destinations = loadDestinations();

        const alreadyExists = destinations.some(function (destination) {
            return destination.name.toLowerCase() === name.toLowerCase();
        });

        if (alreadyExists) {
            destinationMessage.textContent =
                "This destination already exists in the admin list.";
            return;
        }

        destinations.push({
            id: "destination-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 7),
            name: name,
            state: state,
            budget: budget,
            emoji: emoji
        });

        saveDestinations(destinations);
        destinationForm.reset();

        destinationMessage.textContent =
            "Destination added to the admin list successfully.";

        renderDestinations();
        showToast("Destination added successfully.");
    });

    destinationSearch.addEventListener("input", renderDestinations);

    destinationTableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-delete-destination]");

        if (!button) return;

        const id = button.dataset.deleteDestination;
        const destinations = loadDestinations();
        const destination = destinations.find(function (item) {
            return item.id === id;
        });

        if (!destination) return;

        if (!window.confirm("Remove " + destination.name + " from the admin list?")) {
            return;
        }

        saveDestinations(destinations.filter(function (item) {
            return item.id !== id;
        }));

        destinationMessage.textContent =
            "Destination removed from the admin list.";

        renderDestinations();
        showToast("Destination removed.");
    });

    // SAVED TRIP MANAGEMENT

    function renderTrips() {
        const trips = loadTrips();
        const search = tripSearch.value.trim().toLowerCase();

        const filtered = trips.map(function (trip, index) {
            return { trip: trip, index: index };
        }).filter(function (item) {
            return destinationOf(item.trip).toLowerCase().includes(search);
        });

        document.getElementById("tripListCount").textContent = trips.length;

        tripTableBody.innerHTML = filtered.map(function (item) {
            const trip = item.trip;
            const index = item.index;
            const destination = destinationOf(trip);
            const budget = budgetOf(trip);

            return `
                <tr>
                    <td>
                        <div class="destination-cell">
                            <span>${getEmoji(destination)}</span>
                            ${escapeHTML(destination)}
                        </div>
                    </td>

                    <td>${daysOf(trip) || "Flexible"} day(s)</td>
                    <td>${travellersOf(trip)}</td>

                    <td class="budget-cell">
                        ${budget ? formatCurrency(budget) : "Not set"}
                    </td>

                    <td>
                        <button class="delete-button"
                                type="button"
                                data-delete-trip="${index}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        document.getElementById("noTrips").hidden = filtered.length !== 0;

        renderStatistics();
    }

    tripSearch.addEventListener("input", renderTrips);

    tripTableBody.addEventListener("click", function (event) {
        const button = event.target.closest("[data-delete-trip]");

        if (!button) return;

        const index = Number(button.dataset.deleteTrip);
        const trips = loadTrips();

        if (!Number.isInteger(index) || index < 0 || index >= trips.length) {
            return;
        }

        if (!window.confirm(
            "Delete the saved trip to " + destinationOf(trips[index]) + "?"
        )) {
            return;
        }

        trips.splice(index, 1);

        localStorage.setItem("globetrotterTrips", JSON.stringify(trips));

        renderTrips();
        showToast("Saved trip deleted.");
    });

    // Refresh demo statistics when returning to this browser tab.
    window.addEventListener("storage", function (event) {
        if (
            event.key === "globetrotterTrips" ||
            event.key === DESTINATIONS_KEY ||
            event.key === "globetrotterUsers"
        ) {
            renderStatistics();
            renderOverview();
            renderDestinations();
            renderTrips();
        }
    });

    // Open the requested section when a dashboard hash is present.
    const initialSection = window.location.hash.slice(1);
    openSection(initialSection || "overview");
});
