/**
 * 26b43.js
 * Helper functions for butiran-x/26b43 note.
 */

/**
 * Mengosongkan isi textarea.
 */
function clearTextarea(id) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTextAreaElement)) return null;
  el.value = "";
}

/**
 * Menyalin isi dari satu textarea ke textarea lain secara penuh.
 */
function copyTextareaFromTo(src, dest) {
  const el1 = document.getElementById(src);
  const el2 = document.getElementById(dest);
  
  if (!(el1 instanceof HTMLTextAreaElement)) return null;
  if (!(el2 instanceof HTMLTextAreaElement)) return null;
  
  el2.value = el1.value;
}

// marker: 26b43.js
(() => {
  console.log("[marker] 26b43.js loaded");
})();