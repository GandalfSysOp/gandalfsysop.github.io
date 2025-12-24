console.log("app.js loaded");

/* ===========================
   UI HELPERS
=========================== */

function showSection(id) {
  document.querySelectorAll(".section")
    .forEach(s => s.classList.remove("active"));

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar button")
    .forEach(b => b.classList.remove("active"));

  event.target.classList.add("active");
}

function setOutput(data) {
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}

function copyOutput() {
  navigator.clipboard.writeText(
    document.getElementById("output").textContent
  );
}

/* ===========================
   API HELPER (DIRECT NETLIFY FUNCTION)
=========================== */

async function apiGet(path) {
  const res = await fetch(`/.netlify/functions/proofhub/${path}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json();
}

/* ===========================
   DATA NORMALIZERS
=========================== */

function extractArray(json, keys = []) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;

  for (const key of keys) {
    if (Array.isArray(json.data?.[key])) {
      return json.data[key];
    }
  }
  return [];
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function formatUser(user) {
  if (!user) return "-";
  return user.name || user.email || "-";
}

function formatAssigned(assigned) {
  if (!Array.isArray(assigned) || !assigned.length) return "-";
  return assigned.map(u => u.name).join(", ");
}

function formatCategory(category) {
  if (!category) return "-";
  return category.title || category.name || "-";
}

/* ===========================
   PROJECTS
=========================== */

async function fetchProjects() {
  try {
    const json = await apiGet("projects");
    const projects = extractArray(json, ["projects"]);

    const table = document.getElementById("projectsTable");
    table.innerHTML = "";

    if (!projects.length) {
      table.innerHTML =
        `<tr><td colspan="13">No projects found</td></tr>`;
    }

    projects.forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.id}</td>
        <td>${p.title || "-"}</td>
        <td>${p.description || "-"}</td>
        <td>${formatDate(p.start_date)}</td>
        <td>${formatDate(p.end_date)}</td>
        <td>${p.status?.title || "-"}</td>
        <td>${formatAssigned(p.assigned)}</td>
        <td>${formatCategory(p.category)}</td>
        <td>${formatUser(p.creator)}</td>
        <td>${formatUser(p.manager)}</td>
        <td>${p.category_name || "-"}</td>
        <td>${formatDate(p.created_at)}</td>
        <td>${formatDate(p.updated_at)}</td>
      `;

      row.onclick = () => {
        document.getElementById("projectIdInput").value = p.id;
        setOutput(p); // full Postman object
      };

      table.appendChild(row);
    });

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchProjectById() {
  try {
    const id = document.getElementById("projectIdInput").value.trim();
    if (!id) return alert("Enter Project ID");

    const json = await apiGet(`projects/${id}`);
    setOutput(json.data || json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   TASKS (RAW FOR NOW)
=========================== */

async function fetchTasklists() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value.trim();

    if (!projectId) return alert("Enter Project ID");

    const json = await apiGet(
      `projects/${projectId}/todolists`
    );

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchTasks() {
  try {
    const projectId =
      document.getElementById("taskProjectId").value.trim();
    const tasklistId =
      document.getElementById("tasklistId").value.trim();

    if (!projectId || !tasklistId) {
      return alert("Enter Project ID and Tasklist ID");
    }

    const json = await apiGet(
      `projects/${projectId}/todolists/${tasklistId}/tasks`
    );

    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   PEOPLE (RAW)
=========================== */

async function fetchPeople() {
  try {
    const json = await apiGet("people");
    setOutput(json);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

async function fetchPersonById() {
  try {
    const id = document.getElementById("peopleId").value.trim();
    if (!id) return alert("Enter Person ID");

    const json = await apiGet(`people/${id}`);
    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   MANAGE
=========================== */

async function callApi(path) {
  try {
    const json = await apiGet(path);
    setOutput(json);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ===========================
   EXPLORER
=========================== */

async function callCustomPath() {
  try {
    const path =
      document.getElementById("customPath").value.trim();

    if (!path) return alert("Enter API path");

    const json = await apiGet(path);
    setOutput(json);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}
