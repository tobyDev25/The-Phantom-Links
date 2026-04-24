import { db } from "../../firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

    console.log("Create Trip Page Loaded");

    const selectedUserId = localStorage.getItem("selectedUser");
    const selectedUserName = localStorage.getItem("selectedUserName");

    const userText = document.getElementById("selectedUserText");

    if (userText) {
        userText.innerText = selectedUserName || "Unknown user";
    }

    if (!selectedUserId) {
        alert("No user selected. Redirecting...");
        window.location.href = "/index.html";
        return;
    }

    const btn = document.getElementById("createTripBtn");
    const message = document.getElementById("message");

    btn?.addEventListener("click", async () => {

        const name = document.getElementById("tripName").value;
        const location = document.getElementById("tripLocation").value;
        const date = document.getElementById("tripDate").value;
        const people = document.getElementById("tripPeople").value;
        const status = document.getElementById("tripStatus").value;

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

            message.innerText = `Trip created for ${selectedUserName}`;
            message.style.color = "#00e07a";

            // wait 3 seconds THEN redirect
            setTimeout(() => {
                window.location.href = "/index.html";
            }, 3000);

            // reset form
            document.getElementById("tripName").value = "";
            document.getElementById("tripLocation").value = "";
            document.getElementById("tripDate").value = "";
            document.getElementById("tripPeople").value = "";

        } catch (err) {
            console.error(err);
            message.innerText = "Failed to create trip";
            message.style.color = "red";
        }
    });

});