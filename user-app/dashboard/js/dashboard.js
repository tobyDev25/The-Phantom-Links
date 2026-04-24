import { auth, db } from "../../firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

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
        return;
    }

    const data = docSnap.data();

    nameEl.innerText = data.firstName || "No name";
    emailEl.innerText = data.email || user.email;
    phoneEl.innerText = data.phone || "No phone";



    const tripsContainer = document.getElementById("tripsContainer");

    const tripsRef = collection(db, "users", user.uid, "trips");
    const snapshot = await getDocs(tripsRef);

    tripsContainer.innerHTML = "";

    if (snapshot.empty) {
        tripsContainer.innerHTML = "<p>No trips yet</p>";
    } else {
        snapshot.forEach((doc) => {
            const trip = doc.data();

            const card = document.createElement("div");
            card.classList.add("trip-card");

            card.innerHTML = `
                <h4>${trip.name}</h4>
                <p>📍 ${trip.location}</p>
                <p>📅 ${trip.date}</p>
                <p>Status: ${trip.status}</p>
            `;

            tripsContainer.appendChild(card);
        });
    }
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