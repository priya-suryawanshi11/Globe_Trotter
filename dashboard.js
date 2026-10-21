
document.addEventListener("DOMContentLoaded", async function () {
    const userName = document.getElementById("userName");
    const totalTrips = document.getElementById("totalTrips");
    const totalDestinations = document.getElementById("totalDestinations");
    const totalDays = document.getElementById("totalDays");
    const recentTrips = document.getElementById("recentTrips");
    const emptyTrips = document.getElementById("emptyTrips");
    const logoutBtn = document.getElementById("logoutBtn");

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    // Verify the current login session.
    async function loadUser() {
        const response = await fetch("/api/auth/me");

        if (response.status === 401) {
            window.location.replace("login.html");
            return null;
        }

        if (!response.ok) {
            throw new Error("Could not verify your login.");
        }

        const data = await response.json();

        if (!data.success || !data.user) {
            window.location.replace("login.html");
            return null;
        }

        userName.textContent =
            data.user.fullName || data.user.username || "Traveller";

        return data.user;
    }

    function getDestination(trip) {
        return trip.destination ||
            trip.place ||
            trip.city ||
            trip.trip_name ||
            "Your Adventure";
    }

    function getDays(trip) {
        if (Number(trip.days || trip.duration) > 0) {
            return Number(trip.days || trip.duration);
        }

        if (trip.start_date && trip.end_date) {
            const start = new Date(
                String(trip.start_date).slice(0, 10) + "T00:00:00Z"
            );
            const end = new Date(
                String(trip.end_date).slice(0, 10) + "T00:00:00Z"
            );

            const difference = Math.round(
                (end - start) / 86400000
            );

            return difference >= 0 ? difference + 1 : 0;
        }

        return 0;
    }

    function getEmoji(destination) {
        const place = destination.toLowerCase();

        if (place.includes("goa")) return "🏖️";
        if (place.includes("manali")) return "🏔️";
        if (place.includes("jaipur")) return "🏰";
        if (place.includes("kerala")) return "🌴";
        if (place.includes("mumbai")) return "🌆";
        if (place.includes("rishikesh")) return "🌊";

        return "✈️";
    }

    // Fetch trips from MySQL through the authenticated API.
    async function loadTrips() {
        const response = await fetch("/api/trips");

        if (!response.ok) {
            throw new Error("Could not load trips from the server.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.trips)) {
            throw new Error("The server returned invalid trip data.");
        }

        return data.trips;
    }

    function renderTrips(trips) {
        totalTrips.textContent = trips.length;

        const destinations = new Set(
            trips.map(trip => getDestination(trip).toLowerCase())
        );
        totalDestinations.textContent = destinations.size;

        totalDays.textContent = trips.reduce(
            (sum, trip) => sum + getDays(trip), 0
        );

        if (trips.length === 0) {
            recentTrips.innerHTML = "";
            emptyTrips.style.display = "block";
            return;
        }

        emptyTrips.style.display = "none";

        recentTrips.innerHTML = trips.slice(0, 3).map(trip => {
            const destination = getDestination(trip);
            const days = getDays(trip);
            const travellers = Number(trip.travellers || 1);
            const budget = Number(trip.budget || 0);

            const budgetText = budget > 0
                ? "₹" + budget.toLocaleString("en-IN")
                : "Not specified";

            return `
                <article class="trip-card">
                    <div class="trip-card-image">
                        ${getEmoji(destination)}
                    </div>
                    <div class="trip-card-body">
                        <h3>${escapeHTML(destination)}</h3>
                        <p>🗓️ ${days || "Flexible"} day(s)</p>
                        <p>👥 ${travellers} traveller(s)</p>
                        <p>💰 Budget: ${escapeHTML(budgetText)}</p>
                        <div class="trip-card-footer">
                            <span>${escapeHTML(trip.status || "planned")}</span>
                            <a href="my_trips.html">View Trips →</a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    // Log out through the server.
    logoutBtn?.addEventListener("click", async function (event) {
        event.preventDefault();
        logoutBtn.disabled = true;

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            window.location.replace("login.html");
        } catch (error) {
            console.error(error);
            alert("Could not log out. Please try again.");
            logoutBtn.disabled = false;
        }
    });

    try {
        const user = await loadUser();

        if (!user) return;

        const trips = await loadTrips();
        renderTrips(trips);
    } catch (error) {
        console.error("Dashboard error:", error);

        if (emptyTrips) {
            emptyTrips.style.display = "block";
            emptyTrips.textContent =
                "Unable to load your trips. Please refresh the page.";
        }
    }
});
