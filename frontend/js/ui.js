function setMessage(el, kind, text) {
  if (!el) return;
  el.className = kind === "success" ? "success" : kind === "error" ? "error" : "";
  el.textContent = text || "";
  el.style.display = text ? "block" : "none";
}

function $(id) {
  return document.getElementById(id);
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

