const WORKER_URL = "https://YOUR-WORKER.workers.dev";

const $ = (id) => document.getElementById(id);
let page = 1;
let lastResponse = null;

function setStatus(message, error = false) {
  const el = $("status");
  el.textContent = message;
  el.className = "status" + (error ? " error" : "");
  el.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getResults(data) {
  return data?.data?.results ?? data?.results ?? [];
}

function getTotal(data, results) {
  return data?.data?.meta?.total ??
         data?.meta?.total ??
         data?.data?.total ??
         data?.total ??
         results.length;
}

async function search() {
  const type = $("type").value;
  const value = $("query").value.trim();
  if (!value) {
    setStatus("Entre une valeur à rechercher.", true);
    return;
  }

  $("search").disabled = true;
  setStatus("Recherche BrixHub en cours…");
  $("results").classList.add("hidden");

  try {
    const payload = {
      [type]: value,
      page,
      per_page: Number($("perPage").value)
    };

    const response = await fetch(`${WORKER_URL}/brixhub/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur HTTP ${response.status}`);
    }

    lastResponse = data;
    render(data);
    setStatus("Recherche terminée.");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Impossible de contacter le serveur.", true);
  } finally {
    $("search").disabled = false;
  }
}

function render(data) {
  const results = getResults(data);
  const total = getTotal(data, results);

  $("results").classList.remove("hidden");
  $("resultTitle").textContent = `${total} résultat${total > 1 ? "s" : ""}`;
  $("pageInfo").textContent = `Page ${page}`;

  $("resultList").innerHTML = results.length
    ? results.map((item) => `
        <article class="result">
          <pre>${escapeHtml(JSON.stringify(item, null, 2))}</pre>
        </article>
      `).join("")
    : `<div class="result"><pre>Aucun résultat.</pre></div>`;

  $("prev").disabled = page <= 1;
  $("next").disabled = results.length < Number($("perPage").value);
}

$("search").addEventListener("click", search);
$("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter") search();
});
$("prev").addEventListener("click", () => {
  if (page > 1) { page--; search(); }
});
$("next").addEventListener("click", () => {
  page++;
  search();
});
$("perPage").addEventListener("change", () => {
  page = 1;
});
$("copy").addEventListener("click", async () => {
  if (!lastResponse) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(lastResponse, null, 2));
    setStatus("JSON copié.");
  } catch {
    setStatus("Impossible de copier le JSON.", true);
  }
});
