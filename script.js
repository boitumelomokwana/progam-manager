/* ============== STATE ============== */
const STORAGE_KEY = "programs";
let programs = loadPrograms();
let editingId = null;
let search = "";
let filter = "";

function loadPrograms() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function savePrograms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

/* ============== ELEMENTS ============== */
const form = document.getElementById("programForm");
const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");
const durInput = document.getElementById("duration");
const slotInput = document.getElementById("timeSlot");
const chanInput = document.getElementById("channel");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const grid = document.getElementById("programGrid");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");
const statCount = document.getElementById("statCount");
const statChannels = document.getElementById("statChannels");

/* ============== VALIDATION ============== */
function setError(field, msg) {
  document.querySelector(`[data-error="${field}"]`).textContent = msg || "";
}
function validate() {
  const errs = {};
  if (!nameInput.value.trim()) errs.name = "Program name is required";
  if (!descInput.value.trim()) errs.description = "Description is required";
  const d = Number(durInput.value);
  if (!durInput.value.trim()) errs.duration = "Duration is required";
  else if (isNaN(d)) errs.duration = "Duration must be a number";
  else if (d < 1 || d > 300) errs.duration = "Must be between 1 and 300 minutes";
  if (!slotInput.value.trim()) errs.timeSlot = "Time slot is required";
  if (!chanInput.value.trim()) errs.channel = "Channel is required";
  ["name","description","duration","timeSlot","channel"].forEach(f => setError(f, errs[f]));
  return Object.keys(errs).length === 0;
}
[nameInput, descInput, durInput, slotInput, chanInput].forEach(el =>
  el.addEventListener("input", () => validate())
);
chanInput.addEventListener("change", validate);

/* ============== FORM SUBMIT ============== */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;
  const data = {
    name: nameInput.value.trim(),
    description: descInput.value.trim(),
    duration: Number(durInput.value),
    timeSlot: slotInput.value,
    channel: chanInput.value,
  };
  if (editingId !== null) {
    programs = programs.map(p => p.id === editingId ? { ...data, id: editingId } : p);
    resetForm();
  } else {
    programs.push({ ...data, id: Date.now() });
    form.reset();
    ["name","description","duration","timeSlot","channel"].forEach(f => setError(f, ""));
  }
  savePrograms();
  render();
});

cancelBtn.addEventListener("click", resetForm);

function resetForm() {
  editingId = null;
  form.reset();
  ["name","description","duration","timeSlot","channel"].forEach(f => setError(f, ""));
  submitBtn.textContent = "Add Program";
  formTitle.textContent = "Program Details";
  formSubtitle.textContent = "Add a new program to your schedule";
  cancelBtn.style.display = "none";
}

function startEdit(id) {
  const p = programs.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  nameInput.value = p.name;
  descInput.value = p.description;
  durInput.value = p.duration;
  slotInput.value = p.timeSlot;
  chanInput.value = p.channel;
  submitBtn.textContent = "Update Program";
  formTitle.textContent = "Edit Program";
  formSubtitle.textContent = "Update the program info";
  cancelBtn.style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProgram(id) {
  if (!confirm("Are you sure you want to delete this program?")) return;
  programs = programs.filter(p => p.id !== id);
  if (editingId === id) resetForm();
  savePrograms();
  render();
}

/* ============== SEARCH / FILTER ============== */
searchInput.addEventListener("input", e => { search = e.target.value; render(); });
filterSelect.addEventListener("change", e => { filter = e.target.value; render(); });

/* ============== RENDER ============== */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function render() {
  statCount.textContent = `${programs.length} ${programs.length === 1 ? "program" : "programs"}`;
  const uniqueChans = new Set(programs.map(p => p.channel)).size;
  statChannels.textContent = `across ${uniqueChans} channel${uniqueChans === 1 ? "" : "s"}`;

  const s = search.toLowerCase().trim();
  const filtered = programs.filter(p =>
    (!s || p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)) &&
    (!filter || p.channel === filter)
  );

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/></svg>
        </div>
        <h3>${programs.length === 0 ? "No programs yet" : "No matches"}</h3>
        <p>${programs.length === 0 ? "Add your first program using the form to get started." : "Try adjusting your search or filter."}</p>
      </div>`;
    return;
  }

  grid.innerHTML = `<div class="grid">${filtered.map(p => `
    <article class="program">
      <div class="program-head">
        <h3>${escapeHtml(p.name)}</h3>
        <span class="badge badge-${escapeHtml(p.channel)}">${escapeHtml(p.channel)}</span>
      </div>
      <p class="desc">${escapeHtml(p.description)}</p>
      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">⏱ Duration</div>
          <div class="meta-value">${p.duration} min</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">🕐 Time Slot</div>
          <div class="meta-value">${escapeHtml(p.timeSlot)}</div>
        </div>
      </div>
      <div class="program-actions">
        <button class="btn-edit" data-edit="${p.id}">Edit</button>
        <button class="btn-delete" data-delete="${p.id}">Delete</button>
      </div>
    </article>
  `).join("")}</div>`;

  grid.querySelectorAll("[data-edit]").forEach(btn =>
    btn.addEventListener("click", () => startEdit(Number(btn.dataset.edit)))
  );
  grid.querySelectorAll("[data-delete]").forEach(btn =>
    btn.addEventListener("click", () => deleteProgram(Number(btn.dataset.delete)))
  );
}

render();
