import func2url from "../../func2url.json";

const COMPUTERS_URL = (func2url as Record<string, string>)["computers"];
const DOCUMENTS_URL = (func2url as Record<string, string>)["documents"];

async function req(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Computers ──────────────────────────────────────────
export const getComputers = () => req(COMPUTERS_URL, "GET");

export const addComputer = (data: object) => req(COMPUTERS_URL, "POST", data);

export const updateComputer = (id: string, field: string, value: string) =>
  req(COMPUTERS_URL, "PUT", { id, field, value });

export const deleteComputer = (id: string) =>
  req(COMPUTERS_URL, "DELETE", { id });

// ── Documents ─────────────────────────────────────────
export const getDocuments = (computerId?: string) => {
  const url = computerId ? `${DOCUMENTS_URL}?computer_id=${computerId}` : DOCUMENTS_URL;
  return req(url, "GET");
};

export const addDocument = (data: object) => req(DOCUMENTS_URL, "POST", data);

export const updateDocument = (id: string, field: string, value: string) =>
  req(DOCUMENTS_URL, "PUT", { id, field, value });

export const deleteDocument = (id: string) =>
  req(DOCUMENTS_URL, "DELETE", { id });
