function getContainer(id, width = "350px") {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLDivElement)) return null;

  Object.assign(el.style, {
    marginTop: "1em",
    width: width,
    background: "#ffffff",
    border: "1px solid #ccc", // Garis pinggir abu-abu
    display: "flex",
  });

  return el;
}

function createTextarea(id, height = "16em") {
  const el = document.createElement("textarea");
  el.id = id;
  el.spellcheck = false; // Menghilangkan garis merah ejaan

  Object.assign(el.style, {
    flex: "1",
    height: height,
    background: "#ffffff", // Background putih
    color: "#000000",      // Teks hitam
    fontFamily: "monospace",
    padding: "0.5em",
    resize: "none",        // Tidak bisa ditarik ukurannya
    outline: "none",       // Tidak ada garis biru saat diklik
    border: "none",
    fontSize: "14px"
  });

  return el;
}

const consolex = {
  el: null,

  setOutput(el) {
    this.el = el;
  },

  log(...args) {
    if (!this.el) return;

    const message = args.join(" ");
    this.el.value += message + "\n";
    this.el.scrollTop = this.el.scrollHeight;
  }
};