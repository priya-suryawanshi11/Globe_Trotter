
const hotelForm = document.getElementById("hotelSearch");
const hotelDestination = document.getElementById("hotelDestination");
const maxPrice = document.getElementById("maxPrice");
const hotelCards = document.querySelectorAll(".hotel-card");
const noHotels = document.getElementById("noHotels");
const listingCount = document.getElementById("listingCount");

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

function filterHotels(event) {
    if (event) event.preventDefault();

    const destination = hotelDestination.value;
    const maximum = maxPrice.value === "all"
        ? Infinity
        : Number(maxPrice.value);

    let visible = 0;

    hotelCards.forEach(card => {
        const correctDestination =
            destination === "all" ||
            card.dataset.destination === destination;

        const correctPrice = Number(card.dataset.price) <= maximum;
        const show = correctDestination && correctPrice;

        card.hidden = !show;

        if (show) visible++;
    });

    noHotels.hidden = visible !== 0;
    listingCount.textContent = `${visible} ${visible === 1 ? "stay" : "stays"}`;
}

hotelForm.addEventListener("submit", filterHotels);
hotelDestination.addEventListener("change", filterHotels);
maxPrice.addEventListener("change", filterHotels);

const attractions = {
    Goa: [
        ["Baga Beach", "Popular beach for seaside walks and activities."],
        ["Fort Aguada", "Historic fort with coastal views."],
        ["Old Goa", "Historic churches and heritage architecture."]
    ],
    Manali: [
        ["Hadimba Temple", "Woodland temple and cultural attraction."],
        ["Solang Valley", "Mountain scenery and seasonal activities."],
        ["Old Manali", "Cafés, local streets and mountain atmosphere."]
    ],
    Jaipur: [
        ["Amber Fort", "Historic fort known for its architecture."],
        ["Hawa Mahal", "Famous palace façade in Jaipur."],
        ["City Palace", "Royal history and museum collections."]
    ],
    Kerala: [
        ["Alleppey Backwaters", "Waterways and scenic landscapes."],
        ["Munnar", "Tea gardens and mountain views."],
        ["Fort Kochi", "Heritage streets and coastal culture."]
    ],
    Mumbai: [
        ["Gateway of India", "Recognisable waterfront landmark."],
        ["Marine Drive", "Seaside promenade and city views."],
        ["Chhatrapati Shivaji Maharaj Vastu Sangrahalaya", "Art, history and museum collections."]
    ],
    Rishikesh: [
        ["Lakshman Jhula area", "Well-known riverside area; check current access."],
        ["Triveni Ghat", "Popular riverfront and evening ceremonies."],
        ["Beatles Ashram", "Historic ashram site and art."]
    ]
};

const nearbyDestination = document.getElementById("nearbyDestination");
const nearbyList = document.getElementById("nearbyList");

function showNearbyPlaces() {
    const selected = attractions[nearbyDestination.value] || [];
    nearbyList.replaceChildren();

    selected.forEach(([name, description]) => {
        const card = document.createElement("article");
        card.className = "nearby-item";

        const heading = document.createElement("h3");
        heading.textContent = name;

        const paragraph = document.createElement("p");
        paragraph.textContent = description;

        card.append(heading, paragraph);
        nearbyList.appendChild(card);
    });
}

nearbyDestination.addEventListener("change", showNearbyPlaces);
showNearbyPlaces();
filterHotels();
