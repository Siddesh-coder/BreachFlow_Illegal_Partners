// Otto Schmidt Legal Data Hub integration.
// Token stored in localStorage as LDH_TOKEN.
const BASE_URL = "https://otto-schmidt.legal-data-hub.com/api";

function token() {
  return localStorage.getItem("LDH_TOKEN") ?? "";
}

export async function queryLegalHub(question: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/chatbot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", text: question }],
        data_asset: "*",
      }),
    });
    if (!response.ok) throw new Error(`Otto Schmidt error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn("[OttoSchmidt] queryLegalHub failed", err);
    return null;
  }
}

export async function searchLegalDocs(query: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/semantic-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        search_query: query,
        candidates: 5,
        data_asset: "*",
        post_reranking: true,
      }),
    });
    if (!response.ok) throw new Error(`Otto Schmidt error ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn("[OttoSchmidt] searchLegalDocs failed", err);
    return null;
  }
}
