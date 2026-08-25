export function showNotice(container, title, message, isError = false) {
  container.className = `notice${isError ? " notice-error" : ""}`;
  container.removeAttribute("aria-busy");
  container.innerHTML = "";
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = title;
  span.textContent = message;
  container.append(strong, span);
}

export function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase("ar").replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
}
