import "purrlucent/button";
import "purrlucent/error-summary";
import "purrlucent/step-indicator";
import type { PlFieldError } from "purrlucent/error-summary";

const main = document.querySelector("main")!;
const screens = [...main.querySelectorAll<HTMLElement>("[data-flow]")];
const flowLinks = [
  ...document.querySelectorAll<HTMLAnchorElement>(".flow-menu nav a"),
];
const reachable = new Set(flowLinks.map((link) => link.hash.slice(1)));
const start = "create-account";
let active: HTMLElement | undefined;

function clearPasswords(screen: Document | HTMLElement) {
  for (const input of screen.querySelectorAll<HTMLInputElement>(
    'input[type="password"]',
  )) {
    input.value = "";
    input.setCustomValidity("");
  }
}

function showScreen(focus: boolean) {
  const hash = location.hash.slice(1);
  const requestedIndex = screens.findIndex((screen) => screen.id === hash);
  const requested = screens[requestedIndex];
  const next = requested
    ? screens
        .slice(0, requestedIndex + 1)
        .findLast(
          (screen) =>
            screen.dataset.flow === requested.dataset.flow &&
            reachable.has(screen.id),
        )
    : screens.find((screen) => screen.id === start);
  if (!next) return;
  if (hash && hash !== "main" && hash !== next.id) {
    history.replaceState(history.state, "", `#${next.id}`);
  }
  if (next === active) return;

  if (active) {
    clearPasswords(active);
    const form = active.querySelector("form");
    if (form) clearErrors(form);
  }

  for (const screen of screens) screen.hidden = screen !== next;
  for (const link of flowLinks) {
    if (link.hash === `#${next.dataset.flow}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
  active = next;
  if (focus) next.querySelector("h1")?.focus();
}

const inputs = (form: HTMLFormElement) => [
  ...form.querySelectorAll<HTMLInputElement>("input[name]"),
];

function showFieldError(field: HTMLInputElement, message: string) {
  const feedback = document.getElementById(`${field.id}-error`);
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = !message;
  }
  if (message) field.setAttribute("aria-invalid", "true");
  else field.removeAttribute("aria-invalid");
}

function clearErrors(form: HTMLFormElement) {
  const summary = form.querySelector("pl-error-summary");
  if (summary) summary.errors = [];
  for (const field of inputs(form)) showFieldError(field, "");
}

function validate(form: HTMLFormElement) {
  const password = form.querySelector<HTMLInputElement>('[name="password"]');
  const confirmation = form.querySelector<HTMLInputElement>(
    '[name="password-confirmation"]',
  );
  if (password && confirmation) {
    const mismatch =
      confirmation.value && confirmation.value !== password.value;
    confirmation.setCustomValidity(
      mismatch ? "Enter the same password again." : "",
    );
  }

  const errors: PlFieldError[] = [];
  for (const field of inputs(form)) {
    let message = "";
    if (!field.validity.valid) {
      const { requiredMessage, invalidMessage } = field.dataset;
      message = field.validity.valueMissing
        ? (requiredMessage ?? field.validationMessage)
        : (invalidMessage ?? field.validationMessage);
      errors.push({ name: field.name, message });
    }
    showFieldError(field, message);
  }
  return errors;
}

for (const form of document.querySelectorAll<HTMLFormElement>(
  "form[data-next]",
)) {
  const summary = form.querySelector("pl-error-summary");
  const screen = form.closest<HTMLElement>("[data-flow]")!;
  const downstream = screens
    .slice(screens.indexOf(screen) + 1)
    .filter((step) => step.dataset.flow === screen.dataset.flow);
  form.addEventListener("input", () => {
    for (const step of downstream) reachable.delete(step.id);
  });
  form.addEventListener("change", () => {
    if (summary?.errors.length) summary.errors = validate(form);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errors = validate(form);
    if (errors.length && summary) {
      summary.errors = errors;
      await summary.updateComplete;
      if (active?.contains(form)) summary.focus();
      return;
    }
    const next = form.dataset.next;
    if (!next) return;
    reachable.add(next);
    location.hash = next;
  });
}

showScreen(false);
document.querySelector(".kit-skip")?.addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
window.addEventListener("hashchange", () => showScreen(true));
window.addEventListener("pagehide", () => clearPasswords(document));
document.getElementById("onboarding-unavailable")!.hidden = true;
