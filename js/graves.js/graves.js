console.log("Search script loaded");

let graves = [];

async function loadGraves() {
  try {
    const resp = await fetch('/graves.json');
    const base = await resp.json();
    const additions = JSON.parse(localStorage.getItem('graves_additions') || '[]');
    return [...base, ...additions];
  } catch (err) {
    console.error('Failed to load graves.json, falling back to local additions', err);
    return JSON.parse(localStorage.getItem('graves_additions') || '[]');
  }
}

(async () => {
  graves = await loadGraves();
})();

function searchGraves() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const cemeteryValue = document.getElementById("cemeteryFilter").value;
  const yearValue = document.getElementById("yearFilter").value;
  const resultsContainer = document.getElementById("results");

  resultsContainer.innerHTML = "";

  if (query.trim() === "") {
    resultsContainer.innerHTML = "<p>Please enter a name.</p>";
    return;
  }

  if (!graves || graves.length === 0) {
    resultsContainer.innerHTML = "<p>Loading data, try again in a moment.</p>";
    return;
  }

  const results = graves.filter(grave => {
    const matchesName = grave.name.toLowerCase().includes(query);
    const matchesCemetery = cemeteryValue === "" || (grave.cemetery || grave.graveyard) === cemeteryValue;
    const matchesYear = yearValue === "" || grave.death == yearValue;

    return matchesName && matchesCemetery && matchesYear;
  });

  // sort after filtering
  sortResults(results);

  if (results.length === 0) {
    resultsContainer.innerHTML = "<p>No graves found.</p>";
    return;
  }

  results.forEach(grave => {
    const cemetery = grave.cemetery || grave.graveyard || 'Unknown cemetery';

    // Prefer a semantic link for each result so it's keyboard-focusable by default
    if (grave.id) {
      const a = document.createElement('a');
      a.className = 'grave-card';
      a.href = `grave.html?id=${grave.id}`;
      a.innerHTML = `
        <h3>${grave.name}</h3>
        <p>${grave.birth} – ${grave.death}</p>
        <p>${cemetery}</p>
      `;
      resultsContainer.appendChild(a);
    } else {
      // Non-link results are still made focusable for keyboard users
      const div = document.createElement('div');
      div.className = 'grave-card';
      div.tabIndex = 0;
      div.setAttribute('role', 'article');
      div.innerHTML = `
        <h3>${grave.name}</h3>
        <p>${grave.birth} – ${grave.death}</p>
        <p>${cemetery}</p>
      `;
      resultsContainer.appendChild(div);
    }
  });
}

function sortResults(results) {
  const sortOption = document.getElementById("sortOption").value;

  const deathValue = (g, forDesc = false) => {
    const v = Number(g.death);
    if (!Number.isFinite(v)) {
      // place unknowns at the end for asc, end for desc as well
      return forDesc ? -Infinity : Infinity;
    }
    return v;
  };

  if (sortOption === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption === "yearAsc") {
    results.sort((a, b) => deathValue(a) - deathValue(b));
  } else if (sortOption === "yearDsc") {
    results.sort((a, b) => deathValue(b, true) - deathValue(a, true));
  }

  return results;
}

// Allow other scripts to use these helpers
window.searchGraves = searchGraves;
window.loadGraves = loadGraves;

// Save a new grave locally (used for client-side submissions before a server exists)
window.saveGraveLocal = function(entry) {
  const list = JSON.parse(localStorage.getItem('graves_additions') || '[]');
  if (!entry.id) entry.id = Date.now();
  list.push(entry);
  localStorage.setItem('graves_additions', JSON.stringify(list));
  // update in-memory data
  graves.push(entry);
};

document.getElementById("sortOption").addEventListener("change", searchGraves);

// Pressing Enter in the search input (or year filter) should trigger search
const searchInputEl = document.getElementById("searchInput");
const yearFilterEl = document.getElementById("yearFilter");

function handleEnterKey(e) {
  const key = e.key || e.keyCode;
  if (key === 'Enter' || key === 13) {
    e.preventDefault();
    searchGraves();
  }
}

if (searchInputEl) searchInputEl.addEventListener('keydown', handleEnterKey);
if (yearFilterEl) yearFilterEl.addEventListener('keydown', handleEnterKey);