import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
        window.location.href = "../login/login.html";
        return;
    }

    console.log("USER LOGGED IN:", user.uid);

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    console.log("DOC EXISTS:", docSnap.exists());

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
       LOAD TRIPS
    ========================= */
    const tripsContainer = document.getElementById("tripsContainer");

    const tripsRef = collection(db, "users", user.uid, "trips");
    const snapshot = await getDocs(tripsRef);

    tripsContainer.innerHTML = "";

    if (snapshot.empty) {
        tripsContainer.innerHTML = "<p>No trips yet</p>";
        return;
    }

    snapshot.forEach((doc) => {
        const trip = doc.data();

        const status = (trip.status || "unknown").toLowerCase();

        const card = document.createElement("div");
        card.classList.add("trip-card");

        const statusColor = getStatusColor(status);

        card.innerHTML = `
            <div class="trip-title">${trip.name}</div>
            <div class="trip-meta">📍 ${trip.location}</div>
            <div class="trip-meta">📅 ${trip.date}</div>
            <div class="trip-meta">👥 ${trip.people || 0} people</div>

            <div class="status" style="background:${statusColor}">
                ${formatStatus(status)}
            </div>
        `;

        tripsContainer.appendChild(card);
    });
});

/* =========================
   LOGOUT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "../login/login.html";
        });
    }
});