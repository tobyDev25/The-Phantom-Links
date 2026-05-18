import { auth, db } from "../../../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   GET TRIP ID
========================= */
const params = new URLSearchParams(window.location.search);
const tripId = params.get("tripId");

/* =========================
   STATUS HELPERS
========================= */
function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status) {
    switch (status) {
        case "planned": return "#3498db";
        case "in-progress": return "#f39c12";
        case "ready": return "#2ecc71";
        default: return "#999";
    }
}

/* =========================
   AUTH
========================= */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../login/index.html";
        return;
    }

    if (!tripId) {
        alert("No trip ID found");
        return;
    }

    const tripRef = doc(db, "users", user.uid, "trips", tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
        alert("Trip not found");
        return;
    }

    const trip = tripSnap.data();

    /* =========================
       SET DATA
    ========================= */
    document.getElementById("tripName").innerText = trip.name;
    document.getElementById("tripLocation").innerText = "📍 " + trip.location;
    document.getElementById("tripDate").innerText = "📅 " + trip.date;
    document.getElementById("tripPeople").innerText = "👥 " + (trip.people || 0);

    const status = (trip.status || "planned").toLowerCase();

    const badge = document.getElementById("tripStatus");
    badge.innerText = formatStatus(status);
    badge.style.background = getStatusColor(status);

    /* =========================
       DROPDOWN
    ========================= */
    const select = document.getElementById("statusSelect");

    select.innerHTML = `
        <option value="planned">Planned</option>
        <option value="in-progress">In Progress</option>
        <option value="ready">Ready</option>
    `;

    select.value = status;

    select.addEventListener("change", async () => {

        const newStatus = select.value;

        await updateDoc(tripRef, {
            status: newStatus
        });

        badge.innerText = formatStatus(newStatus);
        badge.style.background = getStatusColor(newStatus);
    });

    /* =========================
       DELETE
    ========================= */
    document.getElementById("deleteBtn").addEventListener("click", async () => {

        if (!confirm("Delete this trip?")) return;

        await deleteDoc(tripRef);

        window.location.href = "../dashboard/index.html";
    });

});

/* =========================
   BACK
========================= */
document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
});

/* =========================
   LOAD ITINERARY
========================= */

const itineraryContainer = document.getElementById("itineraryList");

const itineraryRef = collection(
    db,
    "users",
    user.uid,
    "trips",
    tripId,
    "itinerary"
);

const itinerarySnap = await getDocs(itineraryRef);

if (itinerarySnap.empty) {
    itineraryContainer.innerHTML = "<p>No plans yet</p>";
} else {

    const items = [];

    itinerarySnap.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
    });

    // sort by day + time (simple version)
    items.sort((a, b) => {
        return (a.day || "").localeCompare(b.day || "") ||
               (a.time || "").localeCompare(b.time || "");
    });

    items.forEach(item => {

        const el = document.createElement("div");
        el.classList.add("itinerary-item");

        el.innerHTML = `
            <div class="itinerary-day">${item.day || ""}</div>
            <div class="itinerary-title">${item.title}</div>
            <div class="itinerary-time">${item.time || ""}</div>
            <div class="itinerary-notes">${item.notes || ""}</div>
        `;

        itineraryContainer.appendChild(el);
    });
}