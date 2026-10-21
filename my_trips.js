
document.addEventListener("DOMContentLoaded", () => {
    const tripsList = document.getElementById("tripsList");
    const emptyTrips = document.getElementById("emptyTrips");
    const tripCount = document.getElementById("tripCount");
    const destinationCount = document.getElementById("destinationCount");
    const totalBudget = document.getElementById("totalBudget");
    const sortTrips = document.getElementById("sortTrips");

    let trips = [];

    function destinationOf(trip) {
        return trip.destination || trip.destination_name ||
            trip.trip_name || "Your Adventure";
    }

    function daysOf(trip) {
        if (trip.start_date && trip.end_date) {
            const start = new Date(trip.start_date);
            const end = new Date(trip.end_date);

            if (!Number.isNaN(start.getTime()) &&
                !Number.isNaN(end.getTime())) {
                return Math.max(
                    1,
                    Math.round((end - start) / 86400000) + 1
                );
            }
        }

        return Number(trip.days || trip.duration || 0);
    }

    function budgetOf(trip) {
        const value = Number(trip.budget || 0);
        return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function travellersOf(trip) {
        return Number(trip.travellers || trip.travelers || 1);
    }

    function formatCurrency(amount) {
        return "₹" + amount.toLocaleString("en-IN");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function emojiOf(destination) {
        const place = destination.toLowerCase();

        if (place.includes("goa")) return "🏖️";
        if (place.includes("manali")) return "🏔️";
        if (place.includes("jaipur")) return "🏰";
        if (place.includes("kerala")) return "🌴";

        return "✈️";
    }

    async function loadTrips() {
        tripsList.innerHTML = "<p>Loading your trips...</p>";
        emptyTrips.style.display = "none";

        try {
            const response = await fetch("/api/trips", {
                method: "GET",
                credentials: "same-origin"
            });

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load trips.");
            }

            trips = Array.isArray(data.trips) ? data.trips : [];
            renderTrips();
        } catch (error) {
            console.error("Load trips error:", error);
            tripsList.innerHTML =
                "<p>Unable to load trips. Please check your server.</p>";
        }
    }

    function renderTrips() {
        tripCount.textContent = trips.length;

        destinationCount.textContent = new Set(
            trips.map(trip =>
                String(destinationOf(trip)).toLowerCase()
            )
        ).size;

        totalBudget.textContent = formatCurrency(
            trips.reduce((sum, trip) => sum + budgetOf(trip), 0)
        );

        if (trips.length === 0) {
            tripsList.innerHTML = "";
            emptyTrips.style.display = "block";
            return;
        }

        emptyTrips.style.display = "none";

        const sortedTrips = [...trips];

        switch (sortTrips.value) {
            case "budget-low":
                sortedTrips.sort((a, b) => budgetOf(a) - budgetOf(b));
                break;

            case "budget-high":
                sortedTrips.sort((a, b) => budgetOf(b) - budgetOf(a));
                break;

            case "days":
                sortedTrips.sort((a, b) => daysOf(a) - daysOf(b));
                break;

            default:
                sortedTrips.sort((a, b) =>
                    new Date(b.created_at || 0) -
                    new Date(a.created_at || 0)
                );
        }

        tripsList.innerHTML = sortedTrips.map(trip => {
            const destination = destinationOf(trip);
            const days = daysOf(trip);
            const budget = budgetOf(trip);
            const travellers = travellersOf(trip);
            const id = Number(trip.trip_id);

            return `
                <article class="saved-trip-card">
                    <div class="saved-trip-cover">
                        <span class="trip-number">TRIP</span>
                        <span aria-hidden="true">${emojiOf(destination)}</span>
                    </div>

                    <div class="saved-trip-content">
                        <h3>${escapeHTML(destination)}</h3>

                        <div class="trip-meta">
                            <p>🗓️ ${days || "Flexible"} day(s)</p>
                            <p>👥 ${travellers} traveller(s)</p>
                        </div>

                        <div class="trip-budget">
                            <span>Planned budget</span>
                            <strong>${budget ? formatCurrency(budget) : "Not set"}</strong>
                        </div>

                        <div class="trip-card-actions">
                            <a class="view-trip-btn"
                               href="trip_planner.html">
                               Plan Again
                            </a>

                            <button class="delete-trip-btn"
                                    type="button"
                                    data-id="${id}">
                                Delete
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    sortTrips.addEventListener("change", renderTrips);

    tripsList.addEventListener("click", async event => {
        const button = event.target.closest(".delete-trip-btn");
        if (!button) return;

        const id = Number(button.dataset.id);
        const trip = trips.find(item => Number(item.trip_id) === id);

        if (!trip) return;

        if (!window.confirm(
            `Delete the saved trip "${destinationOf(trip)}"?`
        )) return;

        button.disabled = true;

        try {
            const response = await fetch(`/api/trips/${id}`, {
                method: "DELETE",
                credentials: "same-origin"
            });

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not delete trip.");
            }

            await loadTrips();
        } catch (error) {
            console.error("Delete trip error:", error);
            alert(error.message || "Unable to delete this trip.");
            button.disabled = false;
        }
    });

    loadTrips();
});
