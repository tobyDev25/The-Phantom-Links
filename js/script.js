const hamburger = document.getElementById('hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.mobile-overlay');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('show');
    overlay.classList.toggle('show');
});

overlay.addEventListener('click', () => {
    mobileMenu.classList.remove('show');
    overlay.classList.remove('show');
});


window.addEventListener("scroll", function () {
    const centerText = document.getElementById("center-text");
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
    const centerText = document.getElementById("center-text-2");
    const scrollY = window.scrollY;
    let opacity = 1 - scrollY / 500;
    opacity = Math.max(0, Math.min(1, opacity));
    centerText.style.opacity = opacity;
});

window.addEventListener("scroll", function () {
    const centerText = document.getElementById("pye-button");
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

const carouselSlide = document.querySelector('.carousel-slide');
const tripCards = document.querySelectorAll('.trip-card');
const prevBtn = document.querySelector('.carousel-prev');
const nextBtn = document.querySelector('.carousel-next');
let currentIndex = 0;
const totalCards = tripCards.length;

function updateCarousel() {
    const width = tripCards[0].clientWidth;
    carouselSlide.style.transform = `translateX(-${currentIndex * width}px)`;
}

nextBtn.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex >= totalCards) { currentIndex = 0; }
    updateCarousel();
});

prevBtn.addEventListener('click', () => {
    currentIndex--;
    if (currentIndex < 0) { currentIndex = totalCards - 1; }
    updateCarousel();
});

window.addEventListener('resize', updateCarousel);

document.addEventListener("DOMContentLoaded", function() {
    const quotes = document.querySelectorAll(".reviews-text p");
    const image = document.getElementById("review-image");
    let current = 0;
    quotes[current].classList.add("active");
    image.classList.add("active-zoom");

    setInterval(() => {
        quotes[current].classList.remove("active");
        current = (current + 1) % quotes.length;
        quotes[current].classList.add("active");
    }, 7000);
});
