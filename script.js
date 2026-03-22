// SKILLS SLIDER
const track = document.querySelector(".skills-track");
const cards = Array.from(track.children);
const pagination = document.querySelector(".skills-pagination");

let currentPage = 0;
const cardsPerPage = 4; // number of cards visible at a time
const totalPages = Math.ceil(cards.length / cardsPerPage);

// create pagination dots
for(let i=0;i<totalPages;i++){
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if(i===0) dot.classList.add("active");
    dot.addEventListener("click", ()=>{
        currentPage=i;
        updateSlider();
    });
    pagination.appendChild(dot);
}

function updateSlider(){
    const offset = -currentPage * (cards[0].offsetWidth + 15) * cardsPerPage / cardsPerPage;
    track.style.transform = `translateX(${offset}px)`;

    // update active dot
    const dots = document.querySelectorAll(".skills-pagination .dot");
    dots.forEach(d => d.classList.remove("active"));
    dots[currentPage].classList.add("active");
}


// EXPERIENCE CARDS PAGINATION
const expTrack = document.querySelector(".experience-cards");
const expCards = Array.from(expTrack.children);
const expPagination = document.querySelector(".experience-pagination");

let currentExpPage = 0;
const expPerPage = 1; // one card at a time
const totalExpPages = expCards.length;

// create pagination indicators
for(let i=0;i<totalExpPages;i++){
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if(i===0) dot.classList.add("active");
    dot.addEventListener("click", ()=>{
        currentExpPage = i;
        updateExpSlider();
    });
    expPagination.appendChild(dot);
}

function updateExpSlider(){
    const offset = -currentExpPage * (expCards[0].offsetWidth + 20);
    expTrack.style.transform = `translateX(${offset}px)`;

    const dots = document.querySelectorAll(".experience-pagination .dot");
    dots.forEach(d => d.classList.remove("active"));
    dots[currentExpPage].classList.add("active");
}


// PROJECTS CARDS PAGINATION
const projTrack = document.querySelector(".projects-cards");
const projCards = Array.from(projTrack.children);
const projPagination = document.querySelector(".projects-pagination");

let currentProjPage = 0;
const projPerPage = 1; // one card at a time
const totalProjPages = projCards.length;

// create pagination indicators
for(let i=0;i<totalProjPages;i++){
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if(i===0) dot.classList.add("active");
    dot.addEventListener("click", ()=>{
        currentProjPage = i;
        updateProjSlider();
    });
    projPagination.appendChild(dot);
}

function updateProjSlider(){
    const offset = -currentProjPage * (projCards[0].offsetWidth + 20);
    projTrack.style.transform = `translateX(${offset}px)`;

    const dots = document.querySelectorAll(".projects-pagination .dot");
    dots.forEach(d => d.classList.remove("active"));
    dots[currentProjPage].classList.add("active");
}

document.querySelectorAll('nav a').forEach(link=>{
    link.addEventListener('click', e=>{
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({behavior:'smooth'});
    });
});



// DARK/LIGHT MODE TOGGLE
const toggleModeBtn = document.getElementById("toggle-mode");

toggleModeBtn.addEventListener("click", ()=>{
    document.body.classList.toggle("light-mode");
    if(document.body.classList.contains("light-mode")){
        toggleModeBtn.textContent = "Dark Mode";
    } else {
        toggleModeBtn.textContent = "Light Mode";
    }
});

// LANGUAGE SWITCH (simple placeholder)
const langSE = document.getElementById("lang-se");
const langUS = document.getElementById("lang-us");

langSE.addEventListener("click", ()=>{
    alert("Switching to Swedish content...");
    // TODO: implement content translation
});

langUS.addEventListener("click", ()=>{
    alert("Switching to English content...");
    // TODO: implement content translation
});