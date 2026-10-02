const ALLOWED_ORIGIN = "https://YOUR-PAGES-SITE.pages.dev";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=UTF-8"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders()
  });
}

const ALLOWED_FIELDS = new Set([
  "nom_famille","prenom","nom_naissance","nom_affichage","nom_utilisateur",
  "genre","civilite","date_naissance","annee_naissance","jour_naissance",
  "mois_naissance","email","telephone","mobile","adresse_ip","discord_id",
  "adresse","complement_adresse","ville","code_postal","departement","region",
  "pays","ville_naissance","lieu_naissance","societe","profession","fonction",
  "siret","siren","marque","modele","vin_plaque","immatriculation",
  "numero_serie","iban","bic","steam_id","fivem_license","fivem_license2",
  "fivem_id","xbox_live_id","live_id","page","per_page","flexible"
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname !== "/brixhub/search") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method Not Allowed" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON invalide" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Corps de requête invalide" }, 400);
    }

    const payload = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) payload[key] = value;
    }

    try {
      const response = await fetch("https://api.brixhub.ru/api/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({
        error: "Réponse BrixHub invalide"
      }));

      return json(data, response.status);
    } catch (error) {
      console.error("BrixHub:", error);
      return json({ error: "Impossible de contacter BrixHub" }, 502);
    }
  }
};
