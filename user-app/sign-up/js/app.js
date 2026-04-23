import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { auth, db } from "../../firebase-config.js";

/* =========================
   PASSWORD STRENGTH + RULES
========================= */
function checkStrength() {
    const password = document.getElementById("password").value;

    const bar1 = document.getElementById("bar1");
    const bar2 = document.getElementById("bar2");
    const bar3 = document.getElementById("bar3");
    const text = document.getElementById("strengthText");

    const ruleLength = document.getElementById("rule-length");
    const ruleUpper = document.getElementById("rule-upper");
    const ruleNumber = document.getElementById("rule-number");
    const ruleSpecial = document.getElementById("rule-special");

    if (!bar1 || !bar2 || !bar3 || !text) return;

    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    // helper
    const toggleRule = (el, ok) => {
        if (!el) return;
        el.classList.remove("valid", "invalid");
        el.classList.add(ok ? "valid" : "invalid");
    };

    // update rules
    toggleRule(ruleLength, hasLength);
    toggleRule(ruleUpper, hasUpper);
    toggleRule(ruleNumber, hasNumber);
    toggleRule(ruleSpecial, hasSpecial);

    // score
    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    // reset bars
    bar1.style.background = "rgba(255,255,255,0.2)";
    bar2.style.background = "rgba(255,255,255,0.2)";
    bar3.style.background = "rgba(255,255,255,0.2)";

    if (score === 1) {
        bar1.style.background = "red";
        text.innerText = "Weak password";
    } 
    else if (score === 2) {
        bar1.style.background = "orange";
        bar2.style.background = "orange";
        text.innerText = "Medium password";
    } 
    else if (score >= 3) {
        bar1.style.background = "green";
        bar2.style.background = "green";
        bar3.style.background = "green";
        text.innerText = "Strong password";
    } 
    else {
        text.innerText = "Password strength";
    }
}

/* =========================
   SIGNUP
========================= */
async function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const phone = document.getElementById("phone").value;

    const hasRules =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!firstName || !lastName || !email || !phone) {
        alert("Please fill in all fields");
        return;
    }

    if (!hasRules) {
        alert("Password does not meet requirements");
        return;
    }

    if (password !== confirm) {
        alert("Passwords do not match");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const user = userCredential.user;

        console.log("USER CREATED:", user.uid);

        await setDoc(doc(db, "users", user.uid), {
            firstName,
            lastName,
            email,
            phone
        });

        window.location.href = "../dashboard/dashboard.html";

    } catch (err) {
        alert(err.message);
    }
}

/* =========================
   PASSWORD TOGGLE
========================= */
window.togglePassword = function () {
    const input = document.getElementById("password");
    const icon = document.getElementById("pwIcon");

    if (!input || !icon) return;

    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    if (isHidden) {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

window.toggleConfirmPassword = function () {
    const input = document.getElementById("confirmPassword");
    const icon = document.getElementById("cpwIcon");

    if (!input || !icon) return;

    const isHidden = input.type === "password";

    input.type = isHidden ? "text" : "password";

    if (isHidden) {
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
};

/* =========================
   EVENT BINDING
========================= */
document.addEventListener("DOMContentLoaded", () => {

    const passwordInput = document.getElementById("password");
    const signupButton = document.getElementById("signupBtn");

    if (passwordInput) {
        passwordInput.addEventListener("input", checkStrength);
    }

    if (signupButton) {
        signupButton.addEventListener("click", signup);
    }

});


document.addEventListener("DOMContentLoaded", () => {
    const pwIcon = document.getElementById("pwIcon");
    const cpwIcon = document.getElementById("cpwIcon");

    if (pwIcon) pwIcon.classList.add("fa-eye");
    if (cpwIcon) cpwIcon.classList.add("fa-eye");
});