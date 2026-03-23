window.addEventListener("scroll", function () {
    const centerText = document.getElementById("hero-text");
    const scrollY = window.scrollY;
    let opacity = 1 - scrollY / 500;
    opacity = Math.max(0, Math.min(1, opacity));
    centerText.style.opacity = opacity;
});

window.addEventListener("scroll", function () {
    const centerText = document.getElementById("arrow");
    const scrollY = window.scrollY;
    let opacity = 1 - scrollY / 500;
    opacity = Math.max(0, Math.min(1, opacity));
    centerText.style.opacity = opacity;
});

window.addEventListener("scroll", function () {
    const centerText = document.getElementById("hero-sub-text");
    const scrollY = window.scrollY;
    let opacity = 1 - scrollY / 500;
    opacity = Math.max(0, Math.min(1, opacity));
    centerText.style.opacity = opacity;
});

window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".menu-bar");
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

