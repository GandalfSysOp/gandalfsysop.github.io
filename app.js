const BASE_URL =
  "https://script.google.com/macros/s/AKfycbz0hhGxhstl2xdyUBM5qtfN2VXP2oVKoSwZ8elcP6dkETdz-_yECOsNIOPNmwjur4A0/exec";

/* ================= API ================= */

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ================= PROJECT FINDER ================= */
/* This is the version that WORKED */

function findProjectsDeep(data) {
  const results = [];
  const seen = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (
      typeof node.id === "number" &&
      typeof node.title === "string" &&
      !seen.has(node.id)
    ) {
      seen.add(node.id);
      results.push(node);
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
    } else {
      Object.values(node).forEach(walk);
    }
  }

  walk(data);
  return results;
}

/* ================= FORMATTERS ================= */

const formatDate = d => (d ? new Date(d).toLocaleString() : "-");

function formatAssigned(a) {
  if (!Array.isArray(a) || !a.length) return "-";
  return a.map(id => `<div class="assigned-id">${id}</div>`).join("");
}

function formatCategoryName(p) {
  if (p.category_name && p.category_name.trim()) return p.category_name;
  if (p.category?.
