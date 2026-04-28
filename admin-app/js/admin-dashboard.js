import { db } from "../firebase-config.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   GLOBAL STATE
========================= */
let selectedUserId = null;
let selectedUserName = null;
let expandedUsers = {};

/* =========================
   STATS
========================= */

async function loadStats() {

    let totalUsers = 0;
    let totalTrips = 0;
    let inProgress = 0;
    let ready = 0;

    try {

        const usersSnap = await getDocs(collection(db, "users"));
        totalUsers = usersSnap.size;

        for (const userDoc of usersSnap.docs) {

            const tripsSnap = await getDocs(
                collection(db, "users", userDoc.id, "trips")
            );

            tripsSnap.forEach(tripDoc => {

                const trip = tripDoc.data();

                totalTrips++;

                if (trip.status === "in-progress") inProgress++;
                if (trip.status === "ready") ready++;
            });
        }

        // UPDATE UI
        document.getElementById("statUsers").innerText = totalUsers;
        document.getElementById("statTrips").innerText = totalTrips;
        document.getElementById("statInProgress").innerText = inProgress;
        document.getElementById("statReady").innerText = ready;

    } catch (err) {
        console.error(err);
        showToast("Failed to load stats", "error");
    }
}

/* =========================
   TOAST SYSTEM
========================= */
function showToast(message, type = "info") {

    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

/* =========================
   LOAD USERS
========================= */
document.addEventListener("DOMContentLoaded", async () => {

    const usersContainer = document.getElementById("usersContainer");

    if (!usersContainer) {
        showToast("Users container not found", "error");
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "users"));
        usersContainer.innerHTML = "";

        snapshot.forEach((docSnap) => {

            const user = docSnap.data();
            const userId = docSnap.id;

            const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.email ||
                "Unknown user";

            /* =========================
               USER ROW
            ========================= */
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${fullName}</td>
                <td>${user.email || "—"}</td>
                <td>${user.phone || "—"}</td>
                <td>
                    <button class="table-btn"
                        onclick="event.stopPropagation(); selectUser('${userId}', '${fullName}')">
                        Create Trip
                    </button>
                </td>
            `;

            /* expand trips */
            row.addEventListener("click", () => toggleTrips(userId));

            usersContainer.appendChild(row);

            /* =========================
               TRIPS ROW
            ========================= */
            const tripRow = document.createElement("tr");
            tripRow.id = `trips-${userId}`;
            tripRow.style.display = "none";

            tripRow.innerHTML = `
                <td colspan="4">
                    <div id="tripContainer-${userId}" class="trip-sublist"></div>
                </td>
            `;

            usersContainer.appendChild(tripRow);
        });

        showToast("Users loaded", "success");

    } catch (err) {
        console.error(err);
        showToast("Failed to load users", "error");
    }

    /* =========================
       SEARCH USERS (FIXED)
    ========================= */
    const searchInput = document.getElementById("searchUsers");

    if (searchInput) {

        searchInput.addEventListener("input", () => {

            const value = searchInput.value.toLowerCase();

            const rows = usersContainer.querySelectorAll("tr");

            rows.forEach(row => {

                const isUserRow = row.querySelector(".table-btn");

                if (!isUserRow) return;

                const text = row.innerText.toLowerCase();

                const match = text.includes(value);

                row.style.display = match ? "" : "none";

                const tripRow = row.nextElementSibling;

                if (tripRow && tripRow.id?.startsWith("trips-")) {
                    if (!match) {
                        tripRow.style.display = "none";
                    }
                }
            });
        });
    }

    loadStats();
});

/* =========================
   TOGGLE TRIPS
========================= */
window.toggleTrips = async function (userId) {

    const row = document.getElementById(`trips-${userId}`);
    const container = document.getElementById(`tripContainer-${userId}`);

    if (!row || !container) return;

    const isOpen = expandedUsers[userId];

    if (isOpen) {

        container.classList.remove("open");

        setTimeout(() => {
            row.style.display = "none";
        }, 200);

        expandedUsers[userId] = false;
        return;
    }

    row.style.display = "table-row";

    setTimeout(() => {
        container.classList.add("open");
    }, 10);

    expandedUsers[userId] = true;

    container.innerHTML = "Loading...";

    try {

        const snapshot = await getDocs(
            collection(db, "users", userId, "trips")
        );

        if (snapshot.empty) {
            container.innerHTML = "<p style='opacity:0.6'>No trips yet</p>";
            return;
        }

        container.innerHTML = "";

        snapshot.forEach((docSnap) => {

            const trip = docSnap.data();
            const tripId = docSnap.id;

            const statusClass =
                trip.status?.toLowerCase().replace(" ", "-") || "planned";

            const el = document.createElement("div");
            el.classList.add("trip-item");

            el.innerHTML = `
                <div class="editable" 
                    data-field="name" 
                    data-id="${tripId}" 
                    data-user="${userId}">
                    <strong>${trip.name}</strong>
                </div>

                <div class="editable" 
                    data-field="location" 
                    data-id="${tripId}" 
                    data-user="${userId}">
                    ${trip.location}
                </div>

                <div class="editable" 
                    data-field="date" 
                    data-id="${tripId}" 
                    data-user="${userId}">
                    ${trip.date}
                </div>

                <select class="status-select ${statusClass}"
                    data-id="${tripId}"
                    data-user="${userId}">
                    <option value="planned" ${trip.status === "planned" ? "selected" : ""}>Planned</option>
                    <option value="in-progress" ${trip.status === "in-progress" ? "selected" : ""}>In Progress</option>
                    <option value="ready" ${trip.status === "ready" ? "selected" : ""}>Ready</option>
                </select>

                <button class="delete-btn"
                    data-id="${tripId}"
                    data-user="${userId}">
                    Delete
                </button>
            `;
            container.appendChild(el);
        });

    } catch (err) {
        console.error(err);
        showToast("Failed to load trips", "error");
    }
};

/* =========================
   SELECT USER
========================= */
window.selectUser = function (userId, fullName) {

    selectedUserId = userId;
    selectedUserName = fullName;

    const modal = document.getElementById("tripModal");
    const text = document.getElementById("modalUserName");

    if (!modal || !text) return;

    text.innerText = "User: " + fullName;
    modal.style.display = "flex";
};

/* =========================
   CLOSE MODAL
========================= */
document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("tripModal").style.display = "none";
});

/* =========================
   CREATE TRIP
========================= */
document.getElementById("saveTripBtn")?.addEventListener("click", async () => {

    const message = document.getElementById("modalMessage");

    const name = document.getElementById("tripName").value;
    const location = document.getElementById("tripLocation").value;
    const date = document.getElementById("tripDate").value;
    const people = document.getElementById("tripPeople").value;
    const status = document.getElementById("tripStatus").value;

    if (!selectedUserId) {
        showToast("No user selected", "error");
        return;
    }

    if (!name || !location || !date || !people) {
        showToast("Please fill all fields", "error");
        return;
    }

    try {

        await addDoc(
            collection(db, "users", selectedUserId, "trips"),
            {
                name,
                location,
                date,
                people: Number(people),
                status,
                createdAt: new Date()
            }
        );

        showToast(`Trip created for ${selectedUserName}`, "success");

        document.getElementById("tripName").value = "";
        document.getElementById("tripLocation").value = "";
        document.getElementById("tripDate").value = "";
        document.getElementById("tripPeople").value = "";

        if (expandedUsers[selectedUserId]) {
            toggleTrips(selectedUserId);
            toggleTrips(selectedUserId);
        }

    } catch (err) {
        console.error(err);
        showToast("Failed to create trip", "error");
    }
});

/* =========================
   STATUS UPDATE
========================= */
document.addEventListener("change", async (e) => {

    if (!e.target.classList.contains("status-select")) return;

    const tripId = e.target.dataset.id;
    const userId = e.target.dataset.user;

    const newStatus = e.target.value.toLowerCase().replace(" ", "-");

    try {
        await updateDoc(
            doc(db, "users", userId, "trips", tripId),
            { status: newStatus }
        );

        e.target.className = `status-select ${newStatus}`;

        showToast("Status updated", "success");

    } catch (err) {
        console.error(err);
        showToast("Status update failed", "error");
    }
});

/* =========================
   DELETE TRIP
========================= */
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("delete-btn")) return;

    const tripId = e.target.dataset.id;
    const userId = e.target.dataset.user;

    if (!userId || !tripId) {
        showToast("Missing IDs", "error");
        return;
    }

    if (!confirm("Delete this trip?")) return;

    try {
        await deleteDoc(
            doc(db, "users", userId, "trips", tripId)
        );

        showToast("Trip deleted", "success");

        toggleTrips(userId);
        toggleTrips(userId);

    } catch (err) {
        console.error(err);
        showToast("Delete failed", "error");
    }
});

const fieldConfig = {
    name: { type: "text" },
    location: { type: "text" },
    date: { type: "date" },
    people: { type: "number" }
};

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("editable")) return;

    const el = e.target;

    if (el.querySelector("input")) return;

    const currentValue = el.innerText.trim();
    const field = el.dataset.field;
    const tripId = el.dataset.id;
    const userId = el.dataset.user;

    const config = fieldConfig[field] || { type: "text" };

    const input = document.createElement("input");
    input.type = config.type;
    input.value = currentValue;

    input.style.width = "100%";
    input.style.padding = "6px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid rgba(255,255,255,0.2)";
    input.style.background = "rgba(0,0,0,0.4)";
    input.style.color = "white";

    el.innerHTML = "";
    el.appendChild(input);
    input.focus();

    /* SAVE FUNCTION */
    const save = async () => {

        const newValue = input.value.trim();

        if (!newValue) {
            el.innerText = currentValue;
            return;
        }

        // SHOW SAVING STATE
        el.innerHTML = `<span style="opacity:0.6;">Saving...</span>`;

        try {

            await updateDoc(
                doc(db, "users", userId, "trips", tripId),
                { [field]: config.type === "number" ? Number(newValue) : newValue }
            );

            el.innerText = newValue;

            showToast("Updated", "success");

        } catch (err) {
            console.error(err);
            el.innerText = currentValue;
            showToast("Update failed", "error");
        }
    };

    /* EVENTS */
    input.addEventListener("blur", save);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
        if (e.key === "Escape") el.innerText = currentValue;
    });
});