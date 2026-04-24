import { db } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
    }
});

/* =========================
   SELECT USER
========================= */
window.selectUser = function (userId, fullName) {

    console.log("Selected:", userId, fullName);

    localStorage.setItem("selectedUser", userId);
    localStorage.setItem("selectedUserName", fullName || "Unknown user");

    window.location.href = "/admin-app/create-trip/index.html";
};