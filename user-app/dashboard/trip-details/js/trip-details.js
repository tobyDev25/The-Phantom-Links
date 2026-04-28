import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   GET TRIP ID FROM URL
========================= */
const params = new URLSearchParams(window.location.search);
const tripId = params.get("tripId");

/* =========================
   AUTH CHECK
========================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login/login.html";
        return;
    }

    if (!tripId) {
        alert("No trip ID found");
        return;
    }

    try {
        const tripRef = doc(db, "users", user.uid, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (!tripSnap.exists()) {
            alert("Trip not found");
            return;
        }

        const trip = tripSnap.data();

        document.getElementById("tripName").innerText = trip.name;
        document.getElementById("tripLocation").innerText = "📍 " + trip.location;
        document.getElementById("tripDate").innerText = "📅 " + trip.date;
        document.getElementById("tripPeople").innerText = "👥 " + (trip.people || 0);
        document.getElementById("tripStatus").innerText = "Status: " + trip.status;

    } catch (err) {
        console.error(err);
        alert("Failed to load trip");
    }
});

/* =========================
   BACK BUTTON
========================= */
document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
});