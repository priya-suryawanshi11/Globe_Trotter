
document.addEventListener("DOMContentLoaded", function () {
    const tripsList = document.getElementById("tripsList");
    const emptyTrips = document.getElementById("emptyTrips");
    const tripCount = document.getElementById("tripCount");
    const destinationCount = document.getElementById("destinationCount");
    const totalBudget = document.getElementById("totalBudget");
    const sortTrips = document.getElementById("sortTrips");

    function loadTrips() {
        try {
            const trips = JSON.parse(
                localStorage.getItem("globetrotterTrips") || "[]"
            );

            return Array.isArray(trips) ? trips : [];
        } catch (error) {
            console.error("Could not load trips:", error);
            return [];
        }
    }

    function saveTrips(trips) {
        localStorage.setItem("globetrotterTrips", JSON.stringify(trips));
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
        const travellers = Number(trip.travellers || trip.travelers || 1);
        return Number.isFinite(travellers) && travellers > 0
            ? travellers
            : 1;
    }

    function emojiOf(destination) {
        const place = destination.toLowerCase();

        if (place.includes("goa")) return "🏖️";
        if (place.includes("manali")) return "🏔️";
        if (place.includes("jaipur")) return "🏰";
        if (place.includes("kerala")) return "🌴";
        if (place.includes("mumbai")) return "🌆";
        if (place.includes("rishikesh")) return "🌊";

        return "✈️";
    }

    function formatCurrency(amount) {
        return "₹" + amount.toLocaleString("en-IN");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return replacements[character];
        });
    }

    function renderTrips() {
        const trips = loadTrips();

        tripCount.textContent = trips.length;

        const uniqueDestinations = new Set(
            trips.map(trip => destinationOf(trip).toLowerCase())
        );

        destinationCount.textContent = uniqueDestinations.size;

        const combinedBudget = trips.reduce(
            (sum, trip) => sum + budgetOf(trip),
            0
        );

        totalBudget.textContent = formatCurrency(combinedBudget);

        if (trips.length === 0) {
            tripsList.innerHTML = "";
            emptyTrips.style.display = "block";
            return;
        }

        emptyTrips.style.display = "none";

        const indexedTrips = trips.map((trip, index) => ({
            trip,
            index
        }));

        switch (sortTrips.value) {
            case "budget-low":
                indexedTrips.sort(
                    (a, b) => budgetOf(a.trip) - budgetOf(b.trip)
                );
                break;

            case "budget-high":
                indexedTrips.sort(
                    (a, b) => budgetOf(b.trip) - budgetOf(a.trip)
                );
                break;

            case "days":
                indexedTrips.sort(
                    (a, b) => daysOf(a.trip) - daysOf(b.trip)
                );
                break;

            default:
                indexedTrips.reverse();
        }

        tripsList.innerHTML = indexedTrips.map(({ trip, index }, displayIndex) => {
            const destination = destinationOf(trip);
            const days = daysOf(trip);
            const travellers = travellersOf(trip);
            const budget = budgetOf(trip);

            return `
                <article class="saved-trip-card">
                    <div class="saved-trip-cover">
                        <span class="trip-number">TRIP ${displayIndex + 1}</span>
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
                               href="trip_planner.html?destination=${encodeURIComponent(destination)}">
                               Plan Again
                            </a>

                            <button class="delete-trip-btn"
                                    type="button"
                                    data-index="${index}">
                                Delete
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    sortTrips.addEventListener("change", renderTrips);

    tripsList.addEventListener("click", function (event) {
        const button = event.target.closest(".delete-trip-btn");

        if (!button) return;

        const index = Number(button.dataset.index);

        if (!Number.isInteger(index)) return;

        const trips = loadTrips();

        if (index < 0 || index >= trips.length) return;

        const destination = destinationOf(trips[index]);
        const confirmed = window.confirm(
            `Delete the saved trip to ${destination}?`
        );

        if (!confirmed) return;

        trips.splice(index, 1);
        saveTrips(trips);
        renderTrips();
    });

    renderTrips();
});