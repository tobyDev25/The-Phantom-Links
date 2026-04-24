import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

/* =========================
   GLOBAL STATE
========================= */
let selectedUserId = null;
let selectedUserName = null;

/* =========================
   LOAD USERS
========================= */
document.addEventListener("DOMContentLoaded", async () => {

    const usersContainer = document.getElementById("usersContainer");

    if (!usersContainer) {
        console.error("usersContainer not found");
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "users"));

        usersContainer.innerHTML = "";

        snapshot.forEach((docSnap) => {

            const user = docSnap.data();
            const userId = docSnap.id;

            const firstName = user.firstName || "";
            const lastName = user.lastName || "";

            const fullName =
                `${firstName} ${lastName}`.trim() ||
                user.email ||
                "Unknown user";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${fullName}</td>
                <td>${user.email || "—"}</td>
                <td>${user.phone || "—"}</td>
                <td>
                    <button class="table-btn" onclick="selectUser('${userId}', '${fullName}')">
                        Create Trip
                    </button>
                </td>
            `;

            usersContainer.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading users:", err);
        usersContainer.innerHTML = "<p>Error loading users</p>";
    }

});

/* =========================
   OPEN MODAL
========================= */
window.selectUser = function (userId, fullName) {

    selectedUserId = userId;
    selectedUserName = fullName;

    const modal = document.getElementById("tripModal");
    const nameText = document.getElementById("modalUserName");

    if (!modal || !nameText) {
        console.error("Modal elements missing");
        return;
    }

    nameText.innerText = "User: " + fullName;
    modal.style.display = "flex";
};

/* =========================
   CLOSE MODAL
========================= */
document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("tripModal").style.display = "none";
});

/* =========================
   CREATE TRIP (MODAL)
========================= */
document.getElementById("saveTripBtn")?.addEventListener("click", async () => {

    const message = document.getElementById("modalMessage");

    const name = document.getElementById("tripName").value;
    const location = document.getElementById("tripLocation").value;
    const date = document.getElementById("tripDate").value;
    const people = document.getElementById("tripPeople").value;
    const status = document.getElementById("tripStatus").value;

    /* VALIDATION */
    if (!selectedUserId) {
        message.innerText = "No user selected";
        message.style.color = "red";
        return;
    }

    if (!name || !location || !date || !people) {
        message.innerText = "Please fill in all fields";
        message.style.color = "red";
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

        /* SUCCESS UI */
        message.innerText = `Trip created for ${selectedUserName}`;
        message.style.color = "#00e07a";

        /* RESET FORM */
        document.getElementById("tripName").value = "";
        document.getElementById("tripLocation").value = "";
        document.getElementById("tripDate").value = "";
        document.getElementById("tripPeople").value = "";

        /* CLOSE MODAL AFTER DELAY */
        setTimeout(() => {
            document.getElementById("tripModal").style.display = "none";
            message.innerText = "";
        }, 2000);

    } catch (err) {
        console.error("Error creating trip:", err);
        message.innerText = "Failed to create trip";
        message.style.color = "red";
    }

});