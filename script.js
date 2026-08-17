document.documentElement.classList.add("js");

const revealTargets = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

const dayTitleInput = document.querySelector("#day-title");
const dayCityInput = document.querySelector("#day-city");
const stopForm = document.querySelector("#stop-form");
const stopTypeInput = document.querySelector("#stop-type");
const stopTimeInput = document.querySelector("#stop-time");
const stopQueryInput = document.querySelector("#stop-query");
const stopNotesInput = document.querySelector("#stop-notes");
const searchButton = document.querySelector("#search-button");
const searchResults = document.querySelector("#search-results");
const resultsList = document.querySelector("#results-list");
const selectionStatus = document.querySelector("#selection-status");
const stopList = document.querySelector("#stop-list");
const timeline = document.querySelector("#timeline");
const legsList = document.querySelector("#legs-list");
const itineraryTitle = document.querySelector("#itinerary-title");
const itinerarySummary = document.querySelector("#itinerary-summary");
const loadDemoButton = document.querySelector("#load-demo");
const clearAllButton = document.querySelector("#clear-all");
const shareWhatsappBottomButton = document.querySelector("#share-whatsapp-bottom");
const shareStatus = document.querySelector("#share-status");

const state = {
  selectedResult: null,
  stops: [],
  activePlanId: null,
};

const demoStops = [
  {
    type: "Coffee",
    time: "09:00",
    name: "Motors Coffee",
    address: "7 Rue des Halles, 75001 Paris, France",
    lat: 48.8627066,
    lon: 2.3458515,
    notes: "Start with coffee and a slow breakfast.",
    websiteUrl: "https://motorscoffee.com/",
  },
  {
    type: "Museum",
    time: "10:30",
    name: "Bourse de Commerce",
    address: "2 Rue de Viarmes, 75001 Paris, France",
    lat: 48.8615473,
    lon: 2.3421071,
    notes: "Main exhibition block.",
    websiteUrl: "https://www.pinaultcollection.com/fr/boursedecommerce/infos-pratiques",
  },
  {
    type: "Lunch",
    time: "13:00",
    name: "Breizh Cafe Le Marais",
    address: "109 Rue Vieille du Temple, 75003 Paris, France",
    lat: 48.8601667,
    lon: 2.3623982,
    notes: "Crepes and cider.",
    websiteUrl: "https://en.breizhcafe.com/le-marais",
  },
  {
    type: "Store",
    time: "15:00",
    name: "Merci",
    address: "111 Boulevard Beaumarchais, 75003 Paris, France",
    lat: 48.8594512,
    lon: 2.3680815,
    notes: "Design store stop.",
    websiteUrl: "https://merci-merci.com/en",
  },
];

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function makeCitymapperLink(start, end) {
  const params = new URLSearchParams({
    startcoord: `${start.lat},${start.lon}`,
    startname: start.name,
    startaddress: start.address,
    endcoord: `${end.lat},${end.lon}`,
    endname: end.name,
    endaddress: end.address,
  });

  return `https://citymapper.com/directions?${params.toString()}`;
}

function setShareStatus(text, isActive) {
  if (!shareStatus) {
    return;
  }

  shareStatus.textContent = text;
  shareStatus.classList.toggle("is-active", isActive);
}

function getCurrentPlan() {
  return {
    id: state.activePlanId,
    dayTitle: dayTitleInput.value.trim() || "My Day",
    city: dayCityInput.value.trim(),
    stops: state.stops,
    savedAt: new Date().toISOString(),
  };
}

function applyPlan(plan) {
  state.activePlanId = plan.id || null;
  dayTitleInput.value = plan.dayTitle || "My Day";
  dayCityInput.value = plan.city || "";
  state.stops = Array.isArray(plan.stops) ? plan.stops : [];
  renderItinerary();
}

function encodePlan(plan) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(plan))));
}

function decodePlan(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

function buildShareUrl() {
  const shareUrl = new URL(window.location.href);
  const sharePlan = {
    dayTitle: dayTitleInput.value.trim() || "My Day",
    city: dayCityInput.value.trim(),
    stops: state.stops,
  };

  shareUrl.hash = `plan=${encodePlan(sharePlan)}`;
  return shareUrl.toString();
}

function normalizeWebsiteUrl(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function renderPlaceTitle(place, className = "") {
  const title = escapeHtml(place.name);
  const websiteUrl = normalizeWebsiteUrl(place.websiteUrl);
  const classes = className ? ` class="${className}"` : "";

  if (!websiteUrl) {
    return `<span${classes}>${title}</span>`;
  }

  return `<a${classes} href="${escapeHtml(websiteUrl)}" target="_blank" rel="noreferrer">${title}</a>`;
}

function updateSelectionStatus(text, isReady) {
  selectionStatus.textContent = text;
  selectionStatus.classList.toggle("is-ready", isReady);
}

function renderSearchResults(results) {
  if (results.length === 0) {
    searchResults.hidden = false;
    resultsList.innerHTML =
      '<div class="empty-state">No results found. Try a more specific place name or add the city.</div>';
    return;
  }

  const items = results
    .map((result, index) => {
      const primary = result.name || result.display_name.split(",")[0];
      return `
        <button class="result-option" type="button" data-result-index="${index}">
          <div>
            <strong>${escapeHtml(primary)}</strong>
            <span>${escapeHtml(result.display_name)}</span>
            ${
              result.websiteUrl
                ? '<span class="result-site">Website available after you add this stop.</span>'
                : ""
            }
          </div>
        </button>
      `;
    })
    .join("");

  resultsList.innerHTML = items;
  searchResults.hidden = false;
}

function renderStopList() {
  if (state.stops.length === 0) {
    stopList.innerHTML =
      '<div class="empty-state">No stops yet. Search for a place, select a result, and add it to the day.</div>';
    return;
  }

  stopList.innerHTML = state.stops
    .map(
      (stop, index) => `
        <article class="stop-card">
          <div class="stop-head">
            <div>
              <span class="stop-chip">${escapeHtml(stop.type)}</span>
              <h4>${renderPlaceTitle(stop, "place-link")}</h4>
              <div class="stop-meta">
                ${stop.time ? `${escapeHtml(stop.time)} · ` : ""}${escapeHtml(stop.address)}
              </div>
            </div>
            <div class="stop-controls">
              <button class="mini-button" type="button" data-action="move-up" data-index="${index}" ${
                index === 0 ? "disabled" : ""
              }>
                ↑
              </button>
              <button class="mini-button" type="button" data-action="move-down" data-index="${index}" ${
                index === state.stops.length - 1 ? "disabled" : ""
              }>
                ↓
              </button>
              <button class="mini-button" type="button" data-action="remove" data-index="${index}">
                ×
              </button>
            </div>
          </div>
          ${stop.notes ? `<p class="helper-note">${escapeHtml(stop.notes)}</p>` : ""}
          ${
            stop.websiteUrl
              ? `<a class="place-site-link" href="${escapeHtml(
                  normalizeWebsiteUrl(stop.websiteUrl)
                )}" target="_blank" rel="noreferrer">Open place website</a>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function renderTimeline() {
  if (state.stops.length === 0) {
    timeline.innerHTML =
      '<div class="empty-state">Your stop sequence will appear here.</div>';
    return;
  }

  timeline.innerHTML = state.stops
    .map(
      (stop, index) => `
        <article class="timeline-stop">
          <div class="timeline-head">
            <div>
              <span class="stop-chip">Stop ${index + 1}</span>
              <h4>${renderPlaceTitle(stop, "place-link")}</h4>
            </div>
            ${stop.time ? `<span class="stop-chip">${escapeHtml(stop.time)}</span>` : ""}
          </div>
          <p>${escapeHtml(stop.address)}</p>
          ${stop.notes ? `<p class="timeline-note">${escapeHtml(stop.notes)}</p>` : ""}
          ${
            stop.websiteUrl
              ? `<a class="place-site-link" href="${escapeHtml(
                  normalizeWebsiteUrl(stop.websiteUrl)
                )}" target="_blank" rel="noreferrer">Open place website</a>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function renderLegs() {
  if (state.stops.length < 2) {
    legsList.innerHTML =
      '<div class="empty-state">Add at least two stops to create Citymapper route links.</div>';
    itinerarySummary.textContent =
      "Add at least two stops to generate route legs.";
    return;
  }

  const legs = state.stops.slice(0, -1).map((stop, index) => {
    const next = state.stops[index + 1];
    const href = makeCitymapperLink(stop, next);

    return `
      <article class="leg-card">
        <div class="leg-head">
          <div>
            <span class="leg-chip">Leg ${index + 1}</span>
            <h4>${escapeHtml(stop.name)} to ${escapeHtml(next.name)}</h4>
          </div>
          <a class="button button-secondary" href="${href}" target="_blank" rel="noreferrer">
            Open in Citymapper
          </a>
        </div>
        <p class="leg-address">${escapeHtml(stop.address)}</p>
        <p class="leg-address">${escapeHtml(next.address)}</p>
      </article>
    `;
  });

  legsList.innerHTML = legs.join("");
  itinerarySummary.textContent = `${state.stops.length} stops · ${
    state.stops.length - 1
  } Citymapper legs ready.`;
}

function renderItinerary() {
  itineraryTitle.textContent = dayTitleInput.value.trim() || "My Day";
  renderStopList();
  renderTimeline();
  renderLegs();
}

function jumpToItinerary() {
  document.querySelector("#itinerary")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}


function generateShareText() {
  const plan = getCurrentPlan();
  return `${plan.dayTitle} - ${plan.city || "Day Plan"}\n${buildShareUrl()}`;
}

async function shareOnWhatsapp() {
  const text = generateShareText();
  const url = buildShareUrl();

  try {
    if (navigator.share) {
      await navigator.share({
        title: getCurrentPlan().dayTitle,
        text,
        url,
      });
      setShareStatus("Opened the phone share sheet with this itinerary link.", true);
      return;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setShareStatus("Opened WhatsApp sharing with this itinerary link.", true);
  } catch (error) {
    setShareStatus("WhatsApp sharing was cancelled or unavailable.", false);
  }
}

function loadSharedPlanFromUrl() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash.startsWith("plan=")) {
    return;
  }

  try {
    applyPlan(decodePlan(hash.slice(5)));
    setShareStatus("Loaded shared itinerary from the URL.", true);
  } catch (error) {
    setShareStatus("The shared itinerary link is invalid.", false);
  }
}

async function searchPlaces() {
  const query = stopQueryInput.value.trim();
  const city = dayCityInput.value.trim();

  if (!query) {
    updateSelectionStatus("Enter a place name or address first.", false);
    stopQueryInput.focus();
    return;
  }

  updateSelectionStatus("Searching places...", false);
  searchButton.disabled = true;
  searchButton.textContent = "Finding...";
  searchResults.hidden = true;
  resultsList.innerHTML = "";

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    q: city ? `${query}, ${city}` : query,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    limit: "5",
  }).toString();

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Place lookup failed.");
    }

    const data = await response.json();
    const normalized = data.map((item) => ({
      name:
        item.name ||
        item.display_name.split(",")[0] ||
        "Selected place",
      display_name: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
      websiteUrl: normalizeWebsiteUrl(item.extratags?.website || item.extratags?.["contact:website"] || ""),
    }));

    state.selectedResult = null;
    renderSearchResults(normalized);
    updateSelectionStatus("Choose one result to add it.", false);

    resultsList.querySelectorAll("[data-result-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.resultIndex);
        state.selectedResult = normalized[index];
        searchResults.hidden = true;
        updateSelectionStatus(
          `Selected ${state.selectedResult.name}. Ready to add this stop.`,
          true
        );
      });
    });
  } catch (error) {
    updateSelectionStatus(
      "Search failed. Try again in a moment or use a more precise address.",
      false
    );
    searchResults.hidden = false;
    resultsList.innerHTML =
      '<div class="empty-state">The place lookup request failed. This site needs browser network access to search places.</div>';
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Find";
  }
}

function addStop(event) {
  const stopId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  event.preventDefault();

  if (!state.selectedResult) {
    updateSelectionStatus("Select a place result before adding the stop.", false);
    return;
  }

  const preservedDayTitle = dayTitleInput.value;
  const preservedCity = dayCityInput.value;

  state.stops.push({
    id: stopId,
    type: stopTypeInput.value,
    time: stopTimeInput.value,
    name: state.selectedResult.name,
    address: state.selectedResult.display_name,
    lat: state.selectedResult.lat,
    lon: state.selectedResult.lon,
    notes: stopNotesInput.value.trim(),
    websiteUrl: state.selectedResult.websiteUrl || "",
  });

  stopForm.reset();
  dayTitleInput.value = preservedDayTitle;
  dayCityInput.value = preservedCity;
  stopTypeInput.value = "Coffee";
  state.selectedResult = null;
  searchResults.hidden = true;
  resultsList.innerHTML = "";
  updateSelectionStatus("Stop added. Search for the next place.", false);
  renderItinerary();
}

function moveStop(index, direction) {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= state.stops.length) {
    return;
  }

  const [item] = state.stops.splice(index, 1);
  state.stops.splice(targetIndex, 0, item);
  renderItinerary();
}

stopList.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");

  if (!trigger) {
    return;
  }

  const index = Number(trigger.dataset.index);
  const action = trigger.dataset.action;

  if (action === "move-up") {
    moveStop(index, -1);
  }

  if (action === "move-down") {
    moveStop(index, 1);
  }

  if (action === "remove") {
    state.stops.splice(index, 1);
    renderItinerary();
  }
});

searchButton.addEventListener("click", searchPlaces);

stopQueryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchPlaces();
  }
});

stopForm.addEventListener("submit", addStop);
shareWhatsappBottomButton.addEventListener("click", shareOnWhatsapp);

dayTitleInput.addEventListener("input", renderItinerary);

loadDemoButton.addEventListener("click", () => {
  dayTitleInput.value = "Saturday in Paris";
  dayCityInput.value = "Paris";
  state.stops = demoStops.map((stop) => ({
    ...stop,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  renderItinerary();
  updateSelectionStatus("Demo day loaded.", false);
});

clearAllButton.addEventListener("click", () => {
  state.stops = [];
  state.activePlanId = null;
  renderItinerary();
});

loadSharedPlanFromUrl();
renderItinerary();
