for (const disclosure of document.querySelectorAll<HTMLDetailsElement>(
  "details[data-kit-disclosure]",
)) {
  const summary = disclosure.querySelector("summary");

  disclosure.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !disclosure.open) return;
    disclosure.open = false;
    summary?.focus();
  });

  disclosure.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('a[href^="#"]')) disclosure.open = false;
  });
}
