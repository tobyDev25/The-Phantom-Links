import { auth, db } from "../../firebase-config.js";
import { 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

import { 
    doc, 
    getDoc, 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   HELPERS
========================= */
function formatStatus(status) {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status) {
    switch (status) {
        case "planned":
            return "#3498db";
        case "in-progress":
            return "#f39c12";
        case "ready":
            return "#2ecc71";
        default:
            return "#999";
    }
}

/* =========================
   AUTH + LOAD USER DATA
========================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login/index.html";
        return;
    }

    console.log("USER LOGGED IN:", user.uid);

    /* =========================
       LOAD USER PROFILE
    ========================= */
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    const nameEl = document.getElementById("name");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");

    if (!docSnap.exists()) {
        nameEl.innerText = "New User";
        emailEl.innerText = user.email;
        phoneEl.innerText = "Not set";
    } else {
        const data = docSnap.data();

        nameEl.innerText = data.firstName || "No name";
        emailEl.innerText = data.email || user.email;
        phoneEl.innerText = data.phone || "No phone";
    }

    /* =========================
       LOAD TRIPS + STATS
    ========================= */
    const tripsContainer = document.getElementById("tripsContainer");

    const tripsRef = collection(db, "users", user.uid, "trips");
    const snapshot = await getDocs(tripsRef);

    tripsContainer.innerHTML = "";

    if (snapshot.empty) {
        tripsContainer.innerHTML = "<p>No trips yet</p>";

        document.getElementById("statTotal").innerText = 0;
        document.getElementById("statUpcoming").innerText = 0;
        document.getElementById("statReady").innerText = 0;

        return;
    }

    let total = 0;
    let upcoming = 0;
    let ready = 0;

    const tripsArray = [];

    snapshot.forEach((docSnap) => {

        const trip = docSnap.data();

        total++;

        if (trip.status === "ready") ready++;

        if (trip.date) {
            const today = new Date();
            const tripDate = new Date(trip.date);

            if (tripDate >= today) upcoming++;
        }

        tripsArray.push({ id: docSnap.id, ...trip });
    });

    /* =========================
       UPDATE STATS
    ========================= */
    document.getElementById("statTotal").innerText = total;
    document.getElementById("statUpcoming").innerText = upcoming;
    document.getElementById("statReady").innerText = ready;

    /* =========================
       SORT TRIPS (NEXT FIRST)
    ========================= */
    tripsArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    /* =========================
       RENDER TRIPS
    ========================= */
    tripsArray.forEach((trip, index) => {

        const card = document.createElement("div");
        card.classList.add("trip-card");

        const status = trip.status || "unknown";

        card.innerHTML = `
            <div class="trip-title">${trip.name}</div>
            <div class="trip-meta">📍 ${trip.location}</div>
            <div class="trip-meta">📅 ${trip.date}</div>

            <div class="status" style="background:${getStatusColor(status)}">
                ${formatStatus(status)}
            </div>
        `;

        // 🔥 MAKE CLICKABLE
        card.addEventListener("click", () => {
            window.location.href = `../trip-details/index.html?tripId=${trip.id}`;
        });

        tripsContainer.appendChild(card);
    });

    /* =========================
    NEXT TRIP HERO
    ========================= */

    const nextTripCard = document.getElementById("nextTripCard");

    const upcomingTrips = tripsArray.filter(trip => {
        if (!trip.date) return false;

        const today = new Date();
        const tripDate = new Date(trip.date);

        return tripDate >= today;
    });

    if (upcomingTrips.length > 0) {

        const nextTrip = upcomingTrips[0]; // already sorted

        const title = document.getElementById("nextTripTitle");
        const details = document.getElementById("nextTripDetails");
        const countdown = document.getElementById("nextTripCountdown");

        title.innerText = nextTrip.name;
        details.innerText = `${nextTrip.location} • ${nextTrip.date}`;

        const today = new Date();
        const tripDate = new Date(nextTrip.date);

        const diffTime = tripDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            countdown.innerText = `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        } else if (diffDays === 0) {
            countdown.innerText = "Today!";
        } else {
            countdown.innerText = "Happening now";
        }

        nextTripCard.style.display = "block";

    } else {
        nextTripCard.style.display = "none";
    }

});

/* =========================
   LOGOUT
========================= */
document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {

        try {
            await signOut(auth);
            window.location.href = "../login/index.html";
        } catch (err) {
            console.error("Logout failed:", err);
        }

    });

});