import { db } from "../../../firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

document.getElementById("createTripBtn").addEventListener("click", async () => {

    const userId = document.getElementById("userId").value;

    const trip = {
        name: document.getElementById("tripName").value,
        location: document.getElementById("tripLocation").value,
        date: document.getElementById("tripDate").value,
        people: Number(document.getElementById("tripPeople").value),
        status: document.getElementById("tripStatus").value
    };

    await addDoc(collection(db, "users", userId, "trips"), trip);

    alert("Trip created for user: " + userId);
});