
const tripForm = document.getElementById("tripForm");
const resultSection = document.getElementById("resultSection");
const itinerary = document.getElementById("itinerary");
const saveMessage = document.getElementById("saveMessage");

const places = {
    Goa: {
        nature: ["Explore a scenic beach", "Watch the sunset by the sea"],
        adventure: ["Try a suitable water activity", "Explore the coastline"],
        culture: ["Visit Old Goa churches", "Explore a local heritage area"],
        food: ["Try Goan cuisine", "Explore a local market"],
        relaxation: ["Relax on a quiet beach", "Enjoy a peaceful sunset"]
    },
    Manali: {
        nature: ["Explore Solang Valley", "Enjoy mountain viewpoints"],
        adventure: ["Explore adventure activities", "Take a guided nature walk"],
        culture: ["Visit Hadimba Temple", "Explore the local market"],
        food: ["Try Himachali food", "Visit a local café"],
        relaxation: ["Enjoy mountain views", "Spend time in a peaceful garden"]
    },
    Jaipur: {
        nature: ["Visit a garden", "Enjoy a scenic viewpoint"],
        adventure: ["Explore a historic fort", "Walk through the old city"],
        culture: ["Visit Amber Fort", "Explore Hawa Mahal surroundings"],
        food: ["Try Rajasthani cuisine", "Explore local bazaars"],
        relaxation: ["Enjoy a heritage café", "Take a relaxed old-city walk"]
    },
    Kerala: {
        nature: ["Explore a tea garden", "Enjoy a backwater viewpoint"],
        adventure: ["Take a guided nature walk", "Explore a local outdoor activity"],
        culture: ["Visit a cultural attraction", "Explore local traditions"],
        food: ["Try Kerala cuisine", "Visit a local food market"],
        relaxation: ["Enjoy a peaceful backwater area", "Relax in a green landscape"]
    },
    Mumbai: {
        nature: ["Walk along Marine Drive", "Visit a seaside viewpoint"],
        adventure: ["Explore a new neighbourhood on foot", "Visit a city attraction"],
        culture: ["Visit the Gateway of India", "Explore a heritage district"],
        food: ["Try Mumbai street food", "Explore a local market"],
        relaxation: ["Enjoy a seaside walk", "Relax at a public garden"]
    },
    Rishikesh: {
        nature: ["Enjoy a riverside walk", "Explore nearby viewpoints"],
        adventure: ["Choose a guided outdoor activity", "Explore a nature trail"],
        culture: ["Visit a local temple", "Attend an appropriate evening Ganga Aarti"],
        food: ["Try local vegetarian food", "Explore a café"],
        relaxation: ["Enjoy a quiet riverside area", "Try a peaceful yoga session"]
    }
};

const interestNames = {
    nature: "Nature & scenic views",
    adventure: "Adventure & activities",
    culture: "History & culture",
    food: "Local food & shopping",
    relaxation: "Relaxation & peaceful places"
};

// Read destination from links such as
// trip_planner.html?destination=Goa
const params = new URLSearchParams(window.location.search);
const requestedDestination = params.get("destination");
const destinationSelect = document.getElementById("destination");

if (
    requestedDestination &&
    [...destinationSelect.options].some(
        option => option.value.toLowerCase() === requestedDestination.toLowerCase()
    )
) {
    destinationSelect.value = [...destinationSelect.options]
        .find(option => option.value.toLowerCase() === requestedDestination.toLowerCase())
        .value;
}

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

function formatRupees(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

tripForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const destination = destinationSelect.value;
    const days = Number(document.getElementById("days").value);
    const budget = Number(document.getElementById("budget").value);
    const travellers = Number(document.getElementById("travellers").value);
    const interest = document.getElementById("interest").value;

    if (
        !places[destination] ||
        !Number.isInteger(days) || days < 1 || days > 14 ||
        !Number.isFinite(budget) || budget < 500 ||
        !Number.isInteger(travellers) || travellers < 1 || travellers > 20 ||
        !places[destination][interest]
    ) {
        alert("Please enter valid trip details.");
        return;
    }

    const perDayPerPerson = budget / (days * travellers);
    const activities = places[destination][interest];

    document.getElementById("resultTitle").textContent =
        `${days}-Day Trip to ${destination}`;

    document.getElementById("resultSummary").textContent =
        `${travellers} traveller(s) · ${interestNames[interest]} · Total budget ${formatRupees(budget)}`;

    const estimatedDailySpend = budget / days;
    const foodEstimate = budget * 0.25;
    const remainingEstimate = budget * 0.75;

    document.getElementById("budgetSummary").replaceChildren(
        createBudgetItem("Total budget", formatRupees(budget)),
        createBudgetItem("Average per day", formatRupees(estimatedDailySpend)),
        createBudgetItem("Per person / day", formatRupees(perDayPerPerson))
    );

    itinerary.replaceChildren();

    for (let day = 1; day <= days; day++) {
        const card = document.createElement("article");
        card.className = "day-card";

        const heading = document.createElement("h3");
        heading.textContent = `Day ${day} — ${destination}`;

        const list = document.createElement("ul");

        const morning = document.createElement("li");
        morning.textContent = activities[(day - 1) % activities.length];

        const afternoon = document.createElement("li");
        afternoon.textContent = activities[day % activities.length];

        const evening = document.createElement("li");
        evening.textContent = day === days
            ? "Enjoy free time and prepare for your return journey"
            : "Explore nearby areas and enjoy the local atmosphere";

        list.append(morning, afternoon, evening);
        card.append(heading, list);
        itinerary.appendChild(card);
    }

    // Store the current plan temporarily for the Save Trip button.
    window.currentGlobeTrotterTrip = {
        id: Date.now(),
        destination,
        days,
        budget,
        travellers,
        interest,
        createdAt: new Date().toISOString()
    };

    saveMessage.textContent = "";
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

function createBudgetItem(label, value) {
    const item = document.createElement("div");
    item.className = "budget-item";

    const title = document.createElement("span");
    title.textContent = label;

    const amount = document.createElement("strong");
    amount.textContent = value;

    item.append(title, amount);
    return item;
}

document.getElementById("saveTrip").addEventListener("click", function () {
    const trip = window.currentGlobeTrotterTrip;

    if (!trip) {
        saveMessage.textContent = "Generate a trip before saving.";
        return;
    }

    try {
        const savedTrips = JSON.parse(
            localStorage.getItem("globetrotterTrips") || "[]"
        );

        savedTrips.push(trip);

        localStorage.setItem(
            "globetrotterTrips",
            JSON.stringify(savedTrips)
        );

        saveMessage.textContent =
            "Trip saved in this browser! Database syncing is not connected yet.";
    } catch (error) {
        saveMessage.textContent =
            "Could not save the trip in this browser. Check browser storage settings.";
    }
});

document.getElementById("printTrip").addEventListener("click", function () {
    window.print();
});
