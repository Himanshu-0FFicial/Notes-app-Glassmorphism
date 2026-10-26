const STORAGE_KEY = "glass-notes-v1";
const CATEGORIES = ["Ideas", "Journal", "Reading", "Work", "Personal"];
const TONES = ["tone-amber", "tone-sage", "tone-blue", "tone-rose", "tone-lilac"];
const categoryColors = {
  Ideas: "#cf9e6d",
  Journal: "#79a893",
  Reading: "#7fa6b3",
  Work: "#a091b3",
  Personal: "#cd9287",
};

const starterNotes = [
  {
    id: "starter-1",
    title: "A slower kind of morning",
    body: "Leave the phone in the other room. Put the kettle on before opening the curtains. Make space for the first thought of the day to arrive on its own.",
    category: "Journal",
    pinned: true,
    updatedAt: Date.now() - 45 * 60 * 1000,
    tone: "tone-amber",
  },
  {
    id: "starter-2",
    title: "The little bookshop idea",
    body: "A neighborhood bookshop with a long table in the middle. People can leave a sentence in the margins of a shared notebook. Tea after 4pm.",
    category: "Ideas",
    pinned: false,
    updatedAt: Date.now() - 7 * 60 * 60 * 1000,
    tone: "tone-sage",
  },
  {
    id: "starter-3",
    title: "Read when there’s room",
    body: "The Art of Noticing — Rob Walker\nBraiding Sweetgrass — Robin Wall Kimmerer\nThe Creative Act — Rick Rubin",
    category: "Reading",
    pinned: false,
    updatedAt: Date.now() - 27 * 60 * 60 * 1000,
    tone: "tone-blue",
  },
  {
    id: "starter-4",
    title: "For the next walk",
    body: "Take the long way along the water. Look for small things growing through cracks. Bring the tiny camera, not the big one.",
    category: "Personal",
    pinned: false,
    updatedAt: Date.now() - 50 * 60 * 60 * 1000,
    tone: "tone-rose",
  },
];

const elements = {
  filterList: document.querySelector("#filter-list"),
  currentFilter: document.querySelector("#current-filter"),
  visibleCount: document.querySelector("#visible-count"),
  notesGrid: document.querySelector("#notes-grid"),
  emptyState: document.querySelector("#empty-state"),
  emptyIcon: document.querySelector("#empty-icon"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyCopy: document.querySelector("#empty-copy"),
  emptyAction: document.querySelector("#empty-action"),
  search: document.querySelector("#search-notes"),
  editorDialog: document.querySelector("#editor-dialog"),
  deleteDialog: document.querySelector("#delete-dialog"),
  noteForm: document.querySelector("#note-form"),
  noteTitle: document.querySelector("#note-title"),
  noteBody: document.querySelector("#note-body"),
  noteCategory: document.querySelector("#note-category"),
  editorEyebrow: document.querySelector("#editor-eyebrow"),
  editorHeading: document.querySelector("#editor-heading"),
  saveNote: document.querySelector("#save-note"),
  deleteCopy: document.querySelector("#delete-copy"),
  toast: document.querySelector("#toast"),
};

let notes = loadNotes();
let currentFilter = "All notes";
let editingId = null;
let deletingId = null;
let toastTimer;

function loadNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starterNotes));
      return [...starterNotes];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (note) =>
        note &&
        typeof note.id === "string" &&
        typeof note.title === "string" &&
        typeof note.body === "string" &&
        typeof note.category === "string",
    );
  } catch (error) {
    console.error("Could not load notes from browser storage.", error);
    return [...starterNotes];
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Could not save notes to browser storage.", error);
    showToast("Your browser could not save this note.");
  }
}

function relativeDate(timestamp) {
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)} min ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)} hr ago`;
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)} days ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function escapeText(value) {
  return String(value ?? "");
}

function countFor(filter) {
  if (filter === "All notes") return notes.length;
  if (filter === "Pinned") return notes.filter((note) => note.pinned).length;
  return notes.filter((note) => note.category === filter).length;
}

function getVisibleNotes() {
  const searchTerm = elements.search.value.trim().toLowerCase();

  return notes
    .filter((note) => {
      if (currentFilter === "All notes") return true;
      if (currentFilter === "Pinned") return note.pinned;
      return note.category === currentFilter;
    })
    .filter((note) => {
      if (!searchTerm) return true;
      return `${note.title} ${note.body} ${note.category}`
        .toLowerCase()
        .includes(searchTerm);
    })
    .sort(
      (a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
        b.updatedAt - a.updatedAt,
    );
}

function makeIcon(name) {
  const icons = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 8 0-1 5 3 3v2h-5v6l-1 1-1-1v-6H6v-2l3-3-1-5Z"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 7.5h15M9 7.5V5h6v2.5m-8 0 1 12h8l1-12M10 11v5m4-5v5"/></svg>',
  };
  return icons[name];
}

function makeNoteCard(note, index) {
  const card = document.createElement("article");
  card.className = `note-card ${note.tone || TONES[index % TONES.length]}`;

  const top = document.createElement("div");
  top.className = "card-top";

  const category = document.createElement("span");
  category.className = "note-category";
  const dot = document.createElement("span");
  dot.className = "category-dot";
  dot.style.setProperty("--dot", categoryColors[note.category] || "#8eb7ad");
  category.append(dot, document.createTextNode(escapeText(note.category)));

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = `icon-button${note.pinned ? " is-pinned" : ""}`;
  pinButton.setAttribute("aria-label", note.pinned ? "Unpin note" : "Pin note");
  pinButton.title = note.pinned ? "Unpin note" : "Pin note";
  pinButton.innerHTML = makeIcon("pin");
  pinButton.querySelector("svg").style.fill = note.pinned ? "currentColor" : "none";
  pinButton.addEventListener("click", () => togglePin(note.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "icon-button delete";
  deleteButton.setAttribute("aria-label", "Delete note");
  deleteButton.title = "Delete note";
  deleteButton.innerHTML = makeIcon("trash");
  deleteButton.addEventListener("click", () => openDelete(note));
  actions.append(pinButton, deleteButton);
  top.append(category, actions);

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "note-open";
  openButton.setAttribute("aria-label", `Open note: ${escapeText(note.title)}`);

  const title = document.createElement("h3");
  title.className = "note-title";
  title.textContent = note.title || "Untitled note";

  const preview = document.createElement("p");
  preview.className = "note-preview";
  preview.textContent = note.body || "A thought waiting to be written…";
  openButton.append(title, preview);
  openButton.addEventListener("click", () => openEditor(note));

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const edited = document.createElement("span");
  edited.className = "edited-label";
  const editedDot = document.createElement("span");
  editedDot.className = "edited-dot";
  edited.append(editedDot, document.createTextNode(relativeDate(note.updatedAt)));

  const pinnedLabel = document.createElement("span");
  pinnedLabel.textContent = note.pinned ? "PINNED" : "";
  footer.append(edited, pinnedLabel);

  card.append(top, openButton, footer);
  return card;
}

function updateCounts() {
  document.querySelectorAll("[data-count]").forEach((element) => {
    element.textContent = String(countFor(element.dataset.count));
  });
}

function setEmptyState() {
  const hasSearch = Boolean(elements.search.value.trim());
  const allNotesCount = notes.length;

  if (hasSearch) {
    elements.emptyTitle.textContent = "Nothing found just yet.";
    elements.emptyCopy.textContent =
      "Try another word, or clear your search and wander back through your notes.";
    elements.emptyAction.textContent = "Clear search";
    elements.emptyIcon.innerHTML =
      '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></svg>';
    elements.emptyAction.onclick = () => {
      elements.search.value = "";
      render();
      elements.search.focus();
    };
    return;
  }

  if (currentFilter === "Pinned") {
    elements.emptyTitle.textContent = "Nothing pinned for now.";
    elements.emptyCopy.textContent =
      "Pin a note you want to keep close. It will be waiting here when you need it.";
    elements.emptyAction.textContent = "Browse all notes";
    elements.emptyIcon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="m8 4 8 0-1 5 3 3v2h-5v6l-1 1-1-1v-6H6v-2l3-3-1-5Z"/></svg>';
    elements.emptyAction.onclick = () => selectFilter("All notes");
    return;
  }

  if (currentFilter !== "All notes" && countFor(currentFilter) === 0) {
    elements.emptyTitle.textContent = "A quiet corner.";
    elements.emptyCopy.textContent = "There are no notes in this collection yet.";
    elements.emptyAction.textContent = "Browse all notes";
    elements.emptyIcon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg>';
    elements.emptyAction.onclick = () => selectFilter("All notes");
    return;
  }

  elements.emptyTitle.textContent = allNotesCount
    ? "A quiet corner."
    : "Begin with one thought.";
  elements.emptyCopy.textContent =
    "The best note is the one you don’t have to keep in your head.";
  elements.emptyAction.textContent = "Write your first note";
  elements.emptyIcon.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg>';
  elements.emptyAction.onclick = beginCreate;
}

function render() {
  const visibleNotes = getVisibleNotes();
  elements.notesGrid.replaceChildren(
    ...visibleNotes.map((note, index) => makeNoteCard(note, index)),
  );
  elements.currentFilter.textContent = currentFilter;
  elements.visibleCount.textContent = `${visibleNotes.length} ${
    visibleNotes.length === 1 ? "note" : "notes"
  }`;
  elements.emptyState.hidden = visibleNotes.length > 0;
  if (visibleNotes.length === 0) setEmptyState();

  document.querySelectorAll("[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  updateCounts();
}

function selectFilter(filter) {
  currentFilter = filter;
  render();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2300);
}

function beginCreate() {
  editingId = null;
  elements.noteForm.reset();
  elements.noteCategory.value = "Ideas";
  elements.editorEyebrow.textContent = "A little space to think";
  elements.editorHeading.textContent = "Catch the thought.";
  elements.saveNote.textContent = "Save note";
  elements.editorDialog.showModal();
  window.setTimeout(() => elements.noteTitle.focus(), 30);
}

function openEditor(note) {
  editingId = note.id;
  elements.noteTitle.value = note.title;
  elements.noteBody.value = note.body;
  elements.noteCategory.value = CATEGORIES.includes(note.category)
    ? note.category
    : "Ideas";
  elements.editorEyebrow.textContent = "A note to return to";
  elements.editorHeading.textContent = "Make it yours.";
  elements.saveNote.textContent = "Save changes";
  elements.editorDialog.showModal();
  window.setTimeout(() => elements.noteTitle.focus(), 30);
}

function closeEditor() {
  elements.editorDialog.close();
}

function saveNote(event) {
  event.preventDefault();
  const title = elements.noteTitle.value.trim();
  const body = elements.noteBody.value.trim();

  if (!title && !body) {
    showToast("Add a thought before saving.");
    elements.noteTitle.focus();
    return;
  }

  const now = Date.now();
  const category = elements.noteCategory.value;

  if (editingId) {
    notes = notes.map((note) =>
      note.id === editingId
        ? {
            ...note,
            title: title || "Untitled note",
            body,
            category,
            updatedAt: now,
          }
        : note,
    );
    closeEditor();
    saveNotes();
    render();
    showToast("Your note is saved.");
    return;
  }

  notes.unshift({
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: title || "Untitled note",
    body,
    category,
    pinned: false,
    updatedAt: now,
    tone: TONES[notes.length % TONES.length],
  });
  closeEditor();
  saveNotes();
  render();
  showToast("A new note, safely tucked away.");
}

function togglePin(id) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;
  const wasPinned = note.pinned;
  notes = notes.map((item) =>
    item.id === id ? { ...item, pinned: !item.pinned, updatedAt: Date.now() } : item,
  );
  saveNotes();
  render();
  showToast(wasPinned ? "Unpinned from your collection." : "Pinned for an easy return.");
}

function openDelete(note) {
  deletingId = note.id;
  elements.deleteCopy.textContent = `“${note.title || "Untitled note"}” will be removed from your collection. There’s no way to bring it back.`;
  elements.deleteDialog.showModal();
}

function deleteNote() {
  if (!deletingId) return;
  notes = notes.filter((note) => note.id !== deletingId);
  deletingId = null;
  elements.deleteDialog.close();
  saveNotes();
  render();
  showToast("Note deleted.");
}

elements.filterList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) selectFilter(button.dataset.filter);
});

elements.search.addEventListener("input", render);
elements.noteForm.addEventListener("submit", saveNote);
document.querySelector("#new-note").addEventListener("click", beginCreate);
document.querySelector("#focus-search").addEventListener("click", () => elements.search.focus());
document.querySelector("#close-editor").addEventListener("click", closeEditor);
document.querySelector("#cancel-editor").addEventListener("click", closeEditor);
document.querySelector("#cancel-delete").addEventListener("click", () => {
  deletingId = null;
  elements.deleteDialog.close();
});
document.querySelector("#confirm-delete").addEventListener("click", deleteNote);

for (const dialog of [elements.editorDialog, elements.deleteDialog]) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

window.addEventListener("keydown", (event) => {
  const isModifier = event.metaKey || event.ctrlKey;
  if (isModifier && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
  }
  if (isModifier && event.key.toLowerCase() === "n") {
    event.preventDefault();
    if (!elements.editorDialog.open && !elements.deleteDialog.open) beginCreate();
  }
});

render();
