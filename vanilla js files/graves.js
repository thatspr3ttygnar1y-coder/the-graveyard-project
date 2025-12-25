async function loadGraves() {
  try {
    const resp = await fetch('/graves.json');
    const base = await resp.json();
    const additions = JSON.parse(localStorage.getItem('graves_additions') || '[]');
    return [...base, ...additions];
  } catch (err) {
    console.error('Failed to load graves.json', err);
    return JSON.parse(localStorage.getItem('graves_additions') || '[]');
  }
}

(async () => {
  const graves = await loadGraves();
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  const grave = graves.find(g => g.id === id);

  if (!grave) {
    document.body.innerHTML = "<h2>Grave not found.</h2>";
    return;
  }

  document.getElementById("name").textContent = grave.name;
  document.getElementById("years").textContent = `${grave.birth} – ${grave.death}`;

  const cemetery = grave.cemetery || grave.graveyard || 'Unknown cemetery';
  document.getElementById("cemetery").textContent = cemetery;

  document.getElementById("bio").textContent =
    grave.biography || "No biography available.";
  // Wire up Back button
  const backBtn = document.getElementById('backButton');
  if (backBtn) backBtn.addEventListener('click', () => { window.location.href = 'search.html'; });
})();