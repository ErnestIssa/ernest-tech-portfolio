const projViewport = document.querySelector('[data-carousel="projects"]');
const projTrack = document.querySelector(".projects-cards");
const projCards = projTrack ? Array.from(projTrack.children) : [];
const projPagination = document.querySelector(".projects-pagination");

const header = document.querySelector("header");
const touchNavMq = window.matchMedia("(max-width: 1024px)");
const projectsCarouselMq = window.matchMedia("(max-width: 1024px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// —— Auto-hide header on scroll (tablet & phone only) ——
let lastScrollY = window.scrollY;
let navTicking = false;

function updateNavVisibility() {
    navTicking = false;
    if (!header || !touchNavMq.matches) {
        header?.classList.remove("nav-hidden");
        return;
    }
    const y = window.scrollY;
    const delta = y - lastScrollY;
    const threshold = 8;

    if (y < 32) {
        header.classList.remove("nav-hidden");
    } else if (delta > threshold) {
        header.classList.add("nav-hidden");
    } else if (delta < -threshold) {
        header.classList.remove("nav-hidden");
    }
    lastScrollY = y;
}

function onWindowScroll() {
    if (reduceMotion) {
        header?.classList.remove("nav-hidden");
        return;
    }
    if (!navTicking) {
        navTicking = true;
        requestAnimationFrame(updateNavVisibility);
    }
}

window.addEventListener("scroll", onWindowScroll, { passive: true });
touchNavMq.addEventListener("change", () => {
    if (!touchNavMq.matches) header?.classList.remove("nav-hidden");
});

// —— Projects carousel only ——
function onHorizontalScrollEnd(el, handler) {
    let t;
    const debounced = () => {
        clearTimeout(t);
        t = setTimeout(handler, 70);
    };
    el.addEventListener("scroll", debounced, { passive: true });
    el.addEventListener("scrollend", handler, { passive: true });
}

function nearestCardIndex(viewport, cards) {
    if (!viewport || !cards.length) return 0;
    const anchor = viewport.scrollLeft + viewport.clientWidth * 0.25;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft - viewport.scrollLeft);
        const d2 = Math.abs(card.offsetLeft - anchor);
        const use = Math.min(d, d2);
        if (use < bestDist) {
            bestDist = use;
            best = i;
        }
    });
    return best;
}

function rebuildProjDots() {
    if (!projPagination || !projCards.length) return;
    projPagination.innerHTML = "";
    if (!projectsCarouselMq.matches) return;

    projCards.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.classList.add("dot");
        dot.setAttribute("aria-label", `Project ${i + 1}`);
        dot.addEventListener("click", () => {
            if (!projViewport) return;
            projViewport.scrollTo({
                left: projCards[i].offsetLeft,
                behavior: reduceMotion ? "auto" : "smooth",
            });
        });
        projPagination.appendChild(dot);
    });
    syncProjDots();
}

function syncProjDots() {
    if (!projectsCarouselMq.matches || !projViewport || !projPagination) return;
    const i = nearestCardIndex(projViewport, projCards);
    projPagination.querySelectorAll(".dot").forEach((d, idx) => {
        d.classList.toggle("active", idx === i);
    });
}

function initProjectsCarousel() {
    if (!projViewport || !projCards.length) return;
    rebuildProjDots();
    if (projPagination) {
        onHorizontalScrollEnd(projViewport, () => {
            if (projectsCarouselMq.matches) syncProjDots();
        });
    }
}

let resizeTimer;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        rebuildProjDots();
        syncProjDots();
    }, 120);
});

projectsCarouselMq.addEventListener("change", () => {
    rebuildProjDots();
    syncProjDots();
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectsCarousel, { once: true });
} else {
    initProjectsCarousel();
}

window.addEventListener("load", () => {
    rebuildProjDots();
    syncProjDots();
});

// —— SMOOTH SCROLL (in-page) ——
document.querySelectorAll(".nav-links a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        const target = document.querySelector(id);
        if (target) {
            e.preventDefault();
            header?.classList.remove("nav-hidden");
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
    });
});

// —— DARK / LIGHT MODE ——
const toggleModeBtn = document.getElementById("toggle-mode");
if (toggleModeBtn) {
    toggleModeBtn.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        toggleModeBtn.textContent = document.body.classList.contains("light-mode")
            ? "Dark Mode"
            : "Light Mode";
    });
}

// —— LANGUAGE (placeholder) ——
const langSE = document.getElementById("lang-se");
const langUS = document.getElementById("lang-us");
if (langSE) {
    langSE.addEventListener("click", () => {
        alert("Switching to Swedish content...");
    });
}
if (langUS) {
    langUS.addEventListener("click", () => {
        alert("Switching to English content...");
    });
}

// —— SCROLL REVEAL ——
document.querySelectorAll("section .container").forEach((el) => {
    if (el.closest("#home")) return;
    el.classList.add("reveal");
});

if (!reduceMotion) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("reveal-visible");
                }
            });
        },
        { root: null, threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("reveal-visible"));
}
