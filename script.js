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

// Always land on the hero section with the main text/buttons visible
function landAtHome() {
    const homeEl = document.getElementById("home");
    if (!homeEl) return;
    // Ignore URL hash so the page always starts at the hero.
    if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    header?.classList.remove("nav-hidden");
    // requestAnimationFrame keeps it immediate but avoids layout glitches.
    requestAnimationFrame(() => {
        homeEl.scrollIntoView({ behavior: "auto", block: "start" });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", landAtHome, { once: true });
} else {
    landAtHome();
}

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

// —— LANGUAGE EN/SE (instant swap + confirmation modal) ——
const langSE = document.getElementById("lang-se");
const langUS = document.getElementById("lang-us");

const langSuccessDialog = document.getElementById("lang-success-dialog");
const langSuccessTitle = document.getElementById("lang-success-title");
const langSuccessText = document.getElementById("lang-success-text");
const langSuccessClose = document.getElementById("lang-success-close");

const translations = {
    en: {
        navHome: "Home",
        navAbout: "About",
        navExperience: "Experience",
        navProjects: "Live Projects",
        navContact: "Contact",
        homeTitle: "Creating Digital Solutions",
        homeSubtitle:
            "In the world of code, every line tells a story, every function solves a problem, and every project makes a difference. Through software development, we don't just build code – we build the future, one commit at a time.",
        heroLinkedIn: "View LinkedIn",
        heroGitHub: "View GitHub",
        aboutTitle: "About Me",
        aboutP1:
            "I am a software developer passionate about building digital solutions and solving complex technical problems. My journey into programming started at the age of 16, and since then I have been driven by curiosity and a desire to continuously improve my technical skills.",
        aboutP2:
            "I enjoy working on challenging projects, collaborating with developers, and turning ideas into functional applications. My focus is on creating scalable, well-structured systems while constantly learning new technologies and improving my development practices.",
        aboutP3:
            "Beyond coding, I believe in sharing knowledge, learning from other developers, and contributing to projects that create meaningful impact.",
        skillsTitle: "Skills",
        experienceTitle: "Experience",
        projectsTitle: "Live Projects",
        contactTitle: "Contact Me",
        contactNamePh: "Your Name",
        contactEmailPh: "Your Email",
        contactMessagePh: "Your Message",
        contactSend: "Send Message",
        contactSuccessTitle: "Message sent",
        contactSuccessText:
            "Thank you for reaching out. I’ll get back to you as soon as I can.",
        langModalTitle: "Language updated",
        langModalText: "English is enabled.",
        langModalAlreadyTitle: "Language already enabled",
        langModalAlreadyText: "English is already active.",
    },
    se: {
        navHome: "Hem",
        navAbout: "Om",
        navExperience: "Erfarenhet",
        navProjects: "Live-projekt",
        navContact: "Kontakt",
        homeTitle: "Skapar digitala lösningar",
        homeSubtitle:
            "I kodens värld berättar varje rad en historia, varje funktion löser ett problem och varje projekt gör skillnad. Genom mjukvaruutveckling bygger vi inte bara kod – vi bygger framtiden, ett commit i taget.",
        heroLinkedIn: "Se LinkedIn",
        heroGitHub: "Se GitHub",
        aboutTitle: "Om mig",
        aboutP1:
            "Jag är en mjukvaruutvecklare som brinner för att skapa digitala lösningar och lösa komplexa tekniska utmaningar. Min resa in i programmering började när jag var 16, och sedan dess har jag drivits av nyfikenhet och en vilja att ständigt förbättra mina tekniska färdigheter.",
        aboutP2:
            "Jag trivs med att arbeta med utmanande projekt, samarbeta med utvecklare och förvandla idéer till fungerande applikationer. Mitt fokus är att skapa skalbara, väldstrukturerade system samtidigt som jag fortsätter att lära mig nya tekniker och förbättra mina utvecklingsrutiner.",
        aboutP3:
            "Utöver att koda tror jag på att dela kunskap, lära av andra utvecklare och bidra till projekt som skapar meningsfull effekt.",
        skillsTitle: "Färdigheter",
        experienceTitle: "Erfarenhet",
        projectsTitle: "Live-projekt",
        contactTitle: "Kontakta mig",
        contactNamePh: "Ditt namn",
        contactEmailPh: "Din e-post",
        contactMessagePh: "Ditt meddelande",
        contactSend: "Skicka meddelande",
        contactSuccessTitle: "Meddelande skickat",
        contactSuccessText: "Tack för att du hörde av dig. Jag återkommer så snart jag kan.",
        langModalTitle: "Språk uppdaterat",
        langModalText: "Svenska är aktiverat.",
        langModalAlreadyTitle: "Språket är redan aktivt",
        langModalAlreadyText: "Svenska är redan aktiverat.",
    },
};

let currentLang = "en";

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setPlaceholder(id, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute("placeholder", value);
}

function applyLanguage(lang) {
    const t = translations[lang] || translations.en;
    currentLang = lang;
    document.body.dataset.lang = lang;

    setText("nav-home", t.navHome);
    setText("nav-about", t.navAbout);
    setText("nav-experience", t.navExperience);
    setText("nav-projects", t.navProjects);
    setText("nav-contact", t.navContact);

    setText("home-title", t.homeTitle);
    setText("home-subtitle", t.homeSubtitle);

    setText("hero-linkedin", t.heroLinkedIn);
    setText("hero-github", t.heroGitHub);

    setText("about-title", t.aboutTitle);
    setText("about-p1", t.aboutP1);
    setText("about-p2", t.aboutP2);
    setText("about-p3", t.aboutP3);

    setText("skills-title", t.skillsTitle);
    setText("experience-title", t.experienceTitle);
    setText("projects-title", t.projectsTitle);
    setText("contact-title", t.contactTitle);

    setPlaceholder("contact-name", t.contactNamePh);
    setPlaceholder("contact-email", t.contactEmailPh);
    setPlaceholder("contact-message", t.contactMessagePh);
    setText("contact-submit-label", t.contactSend);

    // Contact success dialog copy (keep styling, only swap text).
    setText("contact-success-title", t.contactSuccessTitle);
    const successTextEl = document.querySelector(".contact-success-text");
    if (successTextEl) successTextEl.textContent = t.contactSuccessText;
}

function setLangSuccessModal(lang, alreadyEnabled) {
    const t = translations[lang] || translations.en;
    if (langSuccessTitle) {
        langSuccessTitle.textContent = alreadyEnabled
            ? t.langModalAlreadyTitle
            : t.langModalTitle;
    }
    if (langSuccessText) {
        langSuccessText.textContent = alreadyEnabled
            ? t.langModalAlreadyText
            : t.langModalText;
    }
}

function showLangSuccess(lang, alreadyEnabled) {
    if (!langSuccessDialog || !langSuccessDialog.showModal) return;
    setLangSuccessModal(lang, alreadyEnabled);
    langSuccessDialog.showModal();
}

function closeLangSuccess() {
    langSuccessDialog?.close();
}

if (langSuccessClose) {
    langSuccessClose.addEventListener("click", closeLangSuccess);
}

langSuccessDialog?.addEventListener("click", (e) => {
    if (e.target === langSuccessDialog) closeLangSuccess();
});

// Initial language
applyLanguage("en");

if (langSE) {
    langSE.addEventListener("click", () => {
        const already = currentLang === "se";
        applyLanguage("se");
        showLangSuccess("se", already);
    });
}

if (langUS) {
    langUS.addEventListener("click", () => {
        const already = currentLang === "en";
        applyLanguage("en");
        showLangSuccess("en", already);
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

// —— CONTACT FORM → email (POST /api/contact) + success modal ——
const contactForm = document.getElementById("contact-form");
const contactErrorEl = document.getElementById("contact-form-error");
const contactSubmitBtn = document.getElementById("contact-submit");
const contactSubmitLabel = contactSubmitBtn?.querySelector(".contact-submit-label");
const contactSuccessDialog = document.getElementById("contact-success-dialog");
const contactSuccessClose = document.getElementById("contact-success-close");
const contactSuccessOk = document.getElementById("contact-success-ok");

function setContactError(msg) {
    if (!contactErrorEl) return;
    if (msg) {
        contactErrorEl.textContent = msg;
        contactErrorEl.hidden = false;
    } else {
        contactErrorEl.textContent = "";
        contactErrorEl.hidden = true;
    }
}

function closeContactSuccess() {
    contactSuccessDialog?.close();
}

if (contactForm && contactSubmitBtn && contactSubmitLabel) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setContactError("");

        const name = document.getElementById("contact-name")?.value?.trim() || "";
        const email = document.getElementById("contact-email")?.value?.trim() || "";
        const message = document.getElementById("contact-message")?.value?.trim() || "";

        if (!name || !email || !message) {
            setContactError("Please fill in your name, email, and message.");
            return;
        }

        contactSubmitBtn.disabled = true;
        contactSubmitLabel.textContent = "Sending…";

        try {
            const res = await fetch(`${window.location.origin}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 404) {
                throw new Error(
                    "Contact API not found. Stop any old server on this port, then run npm start from the project folder."
                );
            }
            if (!res.ok || !data.ok) {
                throw new Error(data.error || "Could not send. Please try again.");
            }
            contactForm.reset();
            contactSuccessDialog?.showModal();
        } catch (err) {
            setContactError(err.message || "Something went wrong.");
        } finally {
            contactSubmitBtn.disabled = false;
            contactSubmitLabel.textContent = "Send Message";
        }
    });
}

contactSuccessClose?.addEventListener("click", closeContactSuccess);
contactSuccessOk?.addEventListener("click", closeContactSuccess);

contactSuccessDialog?.addEventListener("click", (e) => {
    if (e.target === contactSuccessDialog) {
        closeContactSuccess();
    }
});
