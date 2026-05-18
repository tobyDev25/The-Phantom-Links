import { db } from "../firebase-config.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   APP STATE (SOURCE OF TRUTH)
========================= */

const state = {
    users: {},      // userId → user data
    trips: {},      // userId → [trips]
    expanded: {},   // userId → boolean
    stats: {
        users: 0,
        trips: 0,
        inProgress: 0,
        ready: 0
    }
};

let tripListeners = {};

/* =========================
   SUBSCRIBE TO TRIPS
========================= */

function subscribeToTrips(userId, container) {

    const tripsRef = collection(db, "users", userId, "trips");

    // 🔥 prevent duplicate listeners
    if (tripListeners[userId]) {
        tripListeners[userId]();
    }

    tripListeners[userId] = onSnapshot(tripsRef, (snapshot) => {

        // reset state safely
        state.trips[userId] = [];

        if (snapshot.empty) {
            container.innerHTML = "<p style='opacity:0.6'>No trips yet</p>";
            return;
        }

        snapshot.forEach(docSnap => {

            const trip = docSnap.data();

            state.trips[userId].push({
                id: docSnap.id,
                ...trip
            });
        });

        renderTrips(userId, container);
    });
}

/* =========================
   RENDER TRIPS
========================= */

function renderTrips(userId, container) {

    const trips = state.trips[userId];

    container.innerHTML = "";

    trips.forEach(trip => {

        const status = trip.status || "planned";

        const div = document.createElement("div");
        div.className = `trip-item ${status}`;
        div.dataset.id = trip.id;
        div.dataset.status = status;

        div.innerHTML = `
            <div class="trip-top">

                <div class="trip-info">

                    <div class="editable"
                        data-field="name"
                        data-id="${trip.id}"
                        data-user="${userId}">
                        <strong>${trip.name}</strong>
                    </div>

                    <div class="editable"
                        data-field="location"
                        data-id="${trip.id}"
                        data-user="${userId}">
                        📍 ${trip.location}
                    </div>

                    <div class="editable"
                        data-field="date"
                        data-id="${trip.id}"
                        data-user="${userId}">
                        📅 ${trip.date}
                    </div>

                </div>

                <select class="status-select ${status}"
                    data-id="${trip.id}"
                    data-user="${userId}"
                    data-status="${status}">

                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="ready">Ready</option>
                </select>

            </div>

            <div class="trip-actions">
                <button class="delete-btn"
                    data-id="${trip.id}"
                    data-user="${userId}">
                    Delete
                </button>

                <button class="itinerary-toggle"
                    data-trip="${trip.id}">
                    View Itinerary
                </button>
            </div>

            <div class="add-itinerary-form">
                <input placeholder="Title" id="title-${trip.id}">
                <input placeholder="Day (e.g. Day 1)" id="day-${trip.id}">
                <input placeholder="Time (optional)" id="time-${trip.id}">
                <button class="add-itinerary-btn"
                    data-trip="${trip.id}"
                    data-user="${userId}">
                    + Add Item
                </button>
            </div>

            <div id="itinerary-${trip.id}" class="itinerary-box">
                Loading...
            </div>
        `;

        container.appendChild(div);

        const select = div.querySelector("select");
        if (select) select.value = status;

        loadItinerary(userId, trip.id);
    });
}

/* =========================
   TOAST
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
   LOAD STATS
========================= */
function subscribeToStats() {

    const usersRef = collection(db, "users");

    onSnapshot(usersRef, async (usersSnap) => {

        let totalUsers = usersSnap.size;
        let totalTrips = 0;
        let inProgress = 0;
        let ready = 0;

        // 🔥 loop users BUT still reactive (only runs on change)
        for (const userDoc of usersSnap.docs) {

            const tripsSnap = await getDocs(
                collection(db, "users", userDoc.id, "trips")
            );

            tripsSnap.forEach(t => {
                const trip = t.data();

                totalTrips++;

                if (trip.status === "in-progress") inProgress++;
                if (trip.status === "ready") ready++;
            });
        }

        // update UI instantly
        document.getElementById("statUsers").innerText = totalUsers;
        document.getElementById("statTrips").innerText = totalTrips;
        document.getElementById("statInProgress").innerText = inProgress;
        document.getElementById("statReady").innerText = ready;
    });
}

/* =========================
   INIT USERS
========================= */
document.addEventListener("DOMContentLoaded", async () => {

    const usersContainer = document.getElementById("usersContainer");

    if (!usersContainer) return;

    try {
        const snapshot = await getDocs(collection(db, "users"));
        usersContainer.innerHTML = "";

        snapshot.forEach(userDoc => {

            const user = userDoc.data();
            const userId = userDoc.id;

            const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.email ||
                "Unknown";

            const row = document.createElement("tr");
            row.dataset.userId = userId;

            row.innerHTML = `
                <td>${fullName}</td>
                <td>${user.email || "—"}</td>
                <td>${user.phone || "—"}</td>
                <td>
                    <button class="table-btn id="createTripBtn"
                        onclick="event.stopPropagation(); selectUser('${userId}', '${fullName}')">
                        Create Trip
                    </button>
                </td>
            `;

            row.addEventListener("click", () => toggleTrips(userId));

            usersContainer.appendChild(row);

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

        subscribeToStats();

    } catch (err) {
        console.error(err);
    }
});


/* =========================
   TOGGLE TRIPS (FIXED)
========================= */
window.toggleTrips = function (userId) {

    const row = document.getElementById(`trips-${userId}`);
    const container = document.getElementById(`tripContainer-${userId}`);

    if (!row || !container) return;

    const isOpen = state.expanded[userId];

    // CLOSE
    if (isOpen) {
        row.style.display = "none";
        state.expanded[userId] = false;
        return;
    }

    // OPEN
    row.style.display = "table-row";
    state.expanded[userId] = true;

    container.classList.add("open");

    container.innerHTML = "Loading...";

    subscribeToTrips(userId, container);
};

/* =========================
   STATUS UPDATE
========================= */
document.addEventListener("change", async (e) => {

    if (!e.target.classList.contains("status-select")) return;

    const tripId = e.target.dataset.id;
    const userId = e.target.dataset.user;
    const newStatus = e.target.value;

    try {
        await updateDoc(
            doc(db, "users", userId, "trips", tripId),
            { status: newStatus }
        );

        // update STATE first
        const trips = state.trips[userId];

        if (trips) {
            const trip = trips.find(t => t.id === tripId);
            if (trip) trip.status = newStatus;
        }

        // update UI directly (safe now because state is source of truth)
        const card = document.querySelector(`.trip-item[data-id="${tripId}"]`);

        if (card) {
            card.classList.remove("planned", "in-progress", "ready");
            card.classList.add(newStatus);
        }

        e.target.classList.remove("planned", "in-progress", "ready");
        e.target.classList.add(newStatus);

        showToast("Updated", "success");

        // stats will come in Step 3 (don’t touch yet)

    } catch (err) {
        console.error(err);
        showToast("Update failed", "error");
    }
});

/* =========================
   DELETE TRIP (FIXED IMPORT ISSUE SAFE)
========================= */
document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("delete-btn")) return;

    const userId = e.target.dataset.user;
    const tripId = e.target.dataset.id;

    if (!confirm("Delete trip?")) return;

    try {
        await deleteDoc(
            doc(db, "users", userId, "trips", tripId)
        );

        showToast("Deleted", "success");
        toggleTrips(userId);

    } catch (err) {
        console.error(err);
        showToast("Delete failed", "error");
    }
});

/* =========================
   SELECT USER
========================= */
window.selectUser = function (userId, name) {
    selectedUserId = userId;
    selectedUserName = name;

    document.getElementById("tripModal").style.display = "flex";
    document.getElementById("modalUserName").innerText = name;
};

/* =========================
   ITINERARY TOGGLE
========================= */

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("itinerary-toggle")) return;

    const tripId = e.target.dataset.trip;
    const box = document.getElementById(`itinerary-${tripId}`);

    if (!box) return;

    box.classList.toggle("open");

    e.target.innerText = box.classList.contains("open")
        ? "Hide Itinerary"
        : "View Itinerary";
});

/* =========================
   ITINERARY LOADER
========================= */

async function loadItinerary(userId, tripId) {

    const container = document.getElementById(`itinerary-${tripId}`);
    if (!container) return;

    try {
        const snap = await getDocs(
            collection(db, "users", userId, "trips", tripId, "itinerary")
        );

        if (snap.empty) {
            container.innerHTML = "<p style='opacity:0.6'>No itinerary yet</p>";
            return;
        }

        container.innerHTML = "";

        snap.forEach(docSnap => {

            const item = docSnap.data();

            const el = document.createElement("div");
            el.className = "itinerary-item";

            el.innerHTML = `
                <strong>${item.title}</strong>
                <div class="itinerary-meta">
                    ${item.day} ${item.time || ""}
                </div>
            `;

            container.appendChild(el);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "Error loading itinerary";
    }
}

/* =========================
   ITINERARY TASK ADDER
========================= */

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("add-itinerary-btn")) return;

    const tripId = e.target.dataset.trip;
    const userId = e.target.dataset.user;

    const title = document.getElementById(`title-${tripId}`).value;
    const day = document.getElementById(`day-${tripId}`).value;
    const time = document.getElementById(`time-${tripId}`).value;

    if (!title || !day) {
        showToast("Title and day required", "error");
        return;
    }

    try {
        await addDoc(
            collection(db, "users", userId, "trips", tripId, "itinerary"),
            {
                title,
                day,
                time: time || "",
                createdAt: new Date()
            }
        );

        showToast("Itinerary item added", "success");

        // CLEAR INPUTS
        document.getElementById(`title-${tripId}`).value = "";
        document.getElementById(`day-${tripId}`).value = "";
        document.getElementById(`time-${tripId}`).value = "";

        // RELOAD LIST
        loadItinerary(userId, tripId);

    } catch (err) {
        console.error(err);
        showToast("Failed to add item", "error");
    }
});

/* =========================
   INLINE EDIT SCRIPT
========================= */

const fieldConfig = {
    name: { type: "text" },
    location: { type: "text" },
    date: { type: "date" }
};

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("editable")) return;

    const el = e.target;

    if (el.querySelector("input")) return;

    const field = el.dataset.field;
    const tripId = el.dataset.id;
    const userId = el.dataset.user;

    const currentValue = el.innerText.replace(/📍|📅/g, "").trim();

    const config = fieldConfig[field] || { type: "text" };

    const input = document.createElement("input");
    input.type = config.type;
    input.value = currentValue;

    input.style.width = "100%";

    el.innerHTML = "";
    el.appendChild(input);
    input.focus();

    const save = async () => {

        const newValue = input.value.trim();

        if (!newValue) {
            el.innerText = currentValue;
            return;
        }

        el.innerText = "Saving...";

        try {
            await updateDoc(
                doc(db, "users", userId, "trips", tripId),
                { [field]: newValue }
            );

            // Restore icons
            if (field === "location") el.innerText = "📍 " + newValue;
            else if (field === "date") el.innerText = "📅 " + newValue;
            else el.innerText = newValue;

            showToast("Updated", "success");

        } catch (err) {
            console.error(err);
            el.innerText = currentValue;
            showToast("Update failed", "error");
        }
    };

    input.addEventListener("blur", save);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
        if (e.key === "Escape") el.innerText = currentValue;
    });
});

/* =========================
   SEARCH BAR
========================= */
const searchInput = document.getElementById("searchUsers");

if (searchInput) {
    searchInput.addEventListener("input", () => {

        const query = searchInput.value.toLowerCase().trim();

        const rows = document.querySelectorAll("#usersContainer tr");

        rows.forEach(row => {

            // skip trip rows
            if (row.id && row.id.startsWith("trips-")) return;

            const cells = row.querySelectorAll("td");

            if (cells.length < 3) return;

            const name = cells[0].innerText.toLowerCase();
            const email = cells[1].innerText.toLowerCase();
            const phone = cells[2].innerText.toLowerCase();

           const match =
            name.startsWith(query) || // priority
            name.includes(" " + query) || // last name match
            email.startsWith(query) ||
            phone.startsWith(query);

            row.style.display = match ? "" : "none";

            // hide trip row if user hidden
            const userId = row.dataset.userId;
            const tripRow = document.getElementById(`trips-${userId}`);

            if (!match && tripRow) {
                tripRow.style.display = "none";
            }
        });
    });
}

/* =========================
   CREATE TRIP
========================= */

// FIRESTORE WRITE

async function createTrip(userId, tripData) {

    try {
        await addDoc(
            collection(db, "users", userId, "trips"),
            {
                name: tripData.name,
                location: tripData.location,
                date: tripData.date,
                status: "planned",
                createdAt: new Date()
            }
        );

        showToast("Trip created", "success");

    } catch (err) {
        console.error(err);
        showToast("Failed to create trip", "error");
    }
}

// BUTTON HANDLER

document.getElementById("createTripBtn")?.addEventListener("click", async () => {

    const name = document.getElementById("tripName").value.trim();
    const location = document.getElementById("tripLocation").value.trim();
    const date = document.getElementById("tripDate").value;

    if (!name || !location || !date) {
        showToast("Fill in all fields", "error");
        return;
    }

    if (!selectedUserId) {
        showToast("No user selected", "error");
        return;
    }

    await createTrip(selectedUserId, {
        name,
        location,
        date
    });

    // clear inputs
    document.getElementById("tripName").value = "";
    document.getElementById("tripLocation").value = "";
    document.getElementById("tripDate").value = "";

    // close modal
    document.getElementById("tripModal").style.display = "none";
});