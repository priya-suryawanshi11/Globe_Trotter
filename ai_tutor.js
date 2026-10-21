
const travelForm = document.getElementById("travelForm");

const destinationData = {
  Goa: {
    styles: ["relaxation", "food", "adventure"],
    description: "A coastal escape with beaches, local food, sunset views and laid-back evenings.",
    icon: "🌊",
    activities: [
      ["Beach exploration", "Explore the coastline and enjoy the sea views."],
      ["Local food trail", "Try regional dishes and discover local cafés."],
      ["Sunset experience", "End the day with a relaxing sunset stop."]
    ],
    baseCost: 1800
  },

  Manali: {
    styles: ["nature", "adventure", "relaxation"],
    description: "A mountain getaway with pine forests, scenic viewpoints and fresh mountain air.",
    icon: "🏔️",
    activities: [
      ["Mountain viewpoints", "Discover scenic views and photograph the landscape."],
      ["Nature walk", "Explore peaceful paths surrounded by greenery."],
      ["Local market", "Browse local shops and sample regional food."]
    ],
    baseCost: 2500
  },

  Jaipur: {
    styles: ["culture", "food"],
    description: "A colourful heritage destination filled with historic architecture, markets and Rajasthani flavours.",
    icon: "🏛️",
    activities: [
      ["Heritage exploration", "Visit a historic fort or palace."],
      ["Local bazaar", "Explore traditional crafts, textiles and souvenirs."],
      ["Rajasthani food", "Discover local cuisine and traditional flavours."]
    ],
    baseCost: 1500
  },

  Kerala: {
    styles: ["nature", "relaxation", "food"],
    description: "A green escape featuring peaceful landscapes, backwaters and regional cuisine.",
    icon: "🌴",
    activities: [
      ["Scenic nature stop", "Enjoy lush landscapes and take photographs."],
      ["Backwater experience", "Explore a backwater area where available."],
      ["Regional food", "Taste local Kerala dishes and refreshments."]
    ],
    baseCost: 3000
  },

  Mumbai: {
    styles: ["culture", "food", "adventure"],
    description: "A lively city break with waterfront walks, local food, markets and famous city sights.",
    icon: "🌆",
    activities: [
      ["City landmarks", "Explore a well-known public landmark."],
      ["Street-food discovery", "Try popular local snacks from reputable vendors."],
      ["Waterfront walk", "Enjoy the city's coastal atmosphere."]
    ],
    baseCost: 2200
  },

  Rishikesh: {
    styles: ["nature", "adventure", "relaxation"],
    description: "A riverside retreat known for scenic landscapes, yoga culture and outdoor experiences.",
    icon: "🌿",
    activities: [
      ["Riverside visit", "Enjoy the river views from permitted public areas."],
      ["Nature exploration", "Discover scenic paths and nearby viewpoints."],
      ["Relaxation session", "Make time for a peaceful break or yoga session."]
    ],
    baseCost: 1400
  }
};

const styleDestinations = {
  nature: ["Manali", "Kerala", "Rishikesh"],
  adventure: ["Rishikesh", "Manali", "Goa"],
  culture: ["Jaipur", "Mumbai"],
  food: ["Jaipur", "Mumbai", "Goa"],
  relaxation: ["Kerala", "Goa", "Rishikesh"]
};

let currentSuggestion = null;

function formatRupees(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

function getTripCost(destination, days, travellers) {
  const dailyRate = destinationData[destination].baseCost;

  // Approximate per-person daily planning estimate.
  const perPerson = dailyRate * days;

  return {
    stay: Math.round(perPerson * 0.35 * travellers),
    food: Math.round(perPerson * 0.25 * travellers),
    transport: Math.round(perPerson * 0.20 * travellers),
    activities: Math.round(perPerson * 0.20 * travellers)
  };
}

function chooseDestination(style, preference, budget, days, travellers) {
  if (preference !== "any") {
    return preference;
  }

  const options = styleDestinations[style] || Object.keys(destinationData);

  // Prefer an option whose illustrative estimate fits the user's budget.
  const fitting = options.find(name => {
    const cost = getTripCost(name, days, travellers);
    const total = cost.stay + cost.food + cost.transport + cost.activities;
    return total <= budget;
  });

  return fitting || options[0];
}

function renderActivities(destination, days) {
  const activityList = document.getElementById("activityList");
  const activities = destinationData[destination].activities;

  activityList.innerHTML = "";

  for (let i = 0; i < Math.min(days, 7); i++) {
    const activity = activities[i % activities.length];
    const card = document.createElement("article");
    card.className = "activity-item";

    const day = document.createElement("div");
    day.className = "activity-day";
    day.textContent = "DAY " + (i + 1);

    const content = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = activity[0];

    const description = document.createElement("p");
    description.textContent = activity[1];

    content.append(heading, description);
    card.append(day, content);
    activityList.appendChild(card);
  }

  if (days > 7) {
    const note = document.createElement("p");
    note.className = "result-disclaimer";
    note.textContent = "Showing highlights for the first 7 days. Extend the itinerary in the Trip Planner.";
    activityList.appendChild(note);
  }
}

function showTripSuggestion(event) {
  event.preventDefault();

  const style = document.getElementById("travelStyle").value;
  const budget = Number(document.getElementById("budget").value);
  const days = Number(document.getElementById("days").value);
  const travellers = Number(document.getElementById("travellers").value);
  const preference = document.getElementById("destinationPreference").value;

  if (!style || !Number.isFinite(budget) || budget < 1000) {
    alert("Please select your travel style and enter a budget of at least ₹1,000.");
    return;
  }

  const destination = chooseDestination(style, preference, budget, days, travellers);
  const details = destinationData[destination];
  const costs = getTripCost(destination, days, travellers);
  const total = costs.stay + costs.food + costs.transport + costs.activities;

  currentSuggestion = {
    destination,
    style,
    budget,
    days,
    travellers,
    startingPoint: document.getElementById("startingPoint").value.trim(),
    estimatedTotal: total,
    costs,
    createdAt: new Date().toISOString()
  };

  document.getElementById("emptyState").hidden = true;
  document.getElementById("tripResult").hidden = false;

  document.getElementById("resultDestination").textContent =
    details.icon + " " + destination;

  document.getElementById("resultDescription").textContent =
    details.description;

  document.getElementById("resultDays").textContent =
    days + (days === 1 ? " day" : " days");

  document.getElementById("resultTravellers").textContent =
    travellers + (travellers === 1 ? " person" : " people");

  document.getElementById("resultBudget").textContent =
    formatRupees(budget);

  document.getElementById("stayCost").textContent = formatRupees(costs.stay);
  document.getElementById("foodCost").textContent = formatRupees(costs.food);
  document.getElementById("transportCost").textContent = formatRupees(costs.transport);
  document.getElementById("activityCost").textContent = formatRupees(costs.activities);
  document.getElementById("totalCost").textContent = formatRupees(total);

  renderActivities(destination, days);

  const plannerLink = document.getElementById("openPlanner");
  plannerLink.href =
    "trip_planner.html?destination=" + encodeURIComponent(destination);

  const saveMessage = document.getElementById("saveMessage");
  saveMessage.textContent =
    total > budget
      ? "This estimate exceeds your budget. Try fewer days, fewer travellers, or another destination."
      : "This is an illustrative estimate, not a live quote.";

  document.getElementById("resultPanel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function saveSuggestedTrip() {
  if (!currentSuggestion) {
    return;
  }

  let savedTrips = [];

  try {
    savedTrips = JSON.parse(localStorage.getItem("globetrotterTrips")) || [];
    if (!Array.isArray(savedTrips)) savedTrips = [];
  } catch (error) {
    savedTrips = [];
  }

  savedTrips.push({
    ...currentSuggestion,
    id: Date.now(),
    name: currentSuggestion.destination + " getaway",
    source: "AI Travel Guide prototype"
  });

  localStorage.setItem("globetrotterTrips", JSON.stringify(savedTrips));

  document.getElementById("saveMessage").textContent =
    "Trip saved in this browser! Database syncing will be added with the backend.";
}

travelForm.addEventListener("submit", showTripSuggestion);

document.getElementById("saveSuggestion").addEventListener("click", saveSuggestedTrip);
