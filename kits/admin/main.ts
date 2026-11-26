import "purrlucent/avatar";
import "purrlucent/badge";
import "purrlucent/button";
import "purrlucent/card";
import "purrlucent/checkbox";
import "purrlucent/empty";
import "purrlucent/input";
import "purrlucent/select";
import "purrlucent/sidebar";
import "purrlucent/spinner";

interface SupportRequest {
  id: string;
  subject: string;
  customer: string;
  received: string;
  message: string;
  resolved: boolean;
}

const requests: SupportRequest[] = [
  {
    id: "FW-108",
    subject: "Invite link expired",
    customer: "Maya Chen",
    received: "Nov 25, 2026",
    message:
      "The invite from yesterday says it’s expired. Can you send a fresh one to my teammate?",
    resolved: false,
  },
  {
    id: "FW-107",
    subject: "Export is missing notes",
    customer: "Ellis Reid",
    received: "Nov 24, 2026",
    message:
      "Our November export includes the project titles, but the notes column is blank. The notes still show in Fieldwork.",
    resolved: false,
  },
  {
    id: "FW-106",
    subject: "Move a project to another team",
    customer: "Noor Haddad",
    received: "Nov 24, 2026",
    message:
      "The Orchard project belongs to our research team now. Can I transfer it without losing its comments?",
    resolved: false,
  },
  {
    id: "FW-105",
    subject: "Change the workspace owner",
    customer: "Robin Lim",
    received: "Nov 23, 2026",
    message:
      "I’m handing the workspace over to my colleague next week. What do I need to do before changing the owner?",
    resolved: false,
  },
  {
    id: "FW-104",
    subject: "Restore a deleted view",
    customer: "Sofia Torres",
    received: "Nov 20, 2026",
    message:
      "We removed our handover view by mistake. Is there a way to get it back?",
    resolved: true,
  },
];

const queue = document.querySelector<HTMLElement>("#queue")!;
const note = document.querySelector("#queue-note")!;
const refresh =
  document.querySelector<HTMLElementTagNameMap["pl-button"]>("#refresh")!;
const search =
  document.querySelector<HTMLElementTagNameMap["pl-input"]>("#search")!;
const filter =
  document.querySelector<HTMLElementTagNameMap["pl-select"]>("#filter")!;
const all =
  document.querySelector<HTMLElementTagNameMap["pl-checkbox"]>("#select-all")!;
const resolve =
  document.querySelector<HTMLElementTagNameMap["pl-button"]>("#resolve")!;
const list = document.querySelector("#requests")!;
const results = document.querySelector<HTMLElement>("#queue-results")!;
const loading = document.querySelector<HTMLElement>("#queue-loading")!;
const error = document.querySelector<HTMLElement>("#queue-error")!;
const empty = document.querySelector<HTMLElement>("#queue-empty")!;
const detailTitle = document.querySelector<HTMLElement>("#detail-title")!;
const detailBody = document.querySelector<HTMLElement>("#detail-body")!;
const detailPlaceholder = document.querySelector<HTMLElement>(
  "#detail-placeholder",
)!;
const detailId = document.querySelector("#detail-id")!;
const detailStatus =
  document.querySelector<HTMLElementTagNameMap["pl-badge"]>("#detail-status")!;
const detailCustomer = document.querySelector("#detail-customer")!;
const detailReceived = document.querySelector("#detail-received")!;
const detailMessage = document.querySelector("#detail-message")!;
const detailAction = document.querySelector("#detail-action")!;
const detailNote = document.querySelector("#detail-note")!;

const selected = new Set<SupportRequest>();
let current: SupportRequest | undefined;
let state: "loading" | "error" | "ready" = "loading";
// The first request can fail on purpose so the same retry path is easy to try.
let failNextLoad =
  new URLSearchParams(location.search).get("state") === "error";

function showStatus(
  badge: HTMLElementTagNameMap["pl-badge"],
  request: SupportRequest,
) {
  badge.textContent = request.resolved ? "Resolved" : "Open";
  badge.variant = request.resolved ? "success" : "warning";
  badge.appearance = "soft";
}

const template =
  document.querySelector<HTMLTemplateElement>("#request-template")!;
const rows = requests.map((request) => {
  const row = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLLIElement;
  const checkbox = row.querySelector("pl-checkbox")!;
  const button = row.querySelector("pl-button")!;
  const badge = row.querySelector("pl-badge")!;
  checkbox.setAttribute("aria-label", `Select ${request.subject}`);
  button.textContent = request.subject;
  row.querySelector(".row-meta")!.textContent =
    `${request.id} · ${request.customer}`;
  checkbox.addEventListener("pl-change", () => {
    if (checkbox.checked) selected.add(request);
    else selected.delete(request);
    updateSelection();
  });
  button.addEventListener("pl-press", () => {
    current = request;
    queue.setAttribute("data-detail-open", "");
    updateDetail();
    detailTitle.focus();
  });
  list.append(row);
  return { request, row, checkbox, button, badge };
});

function availableRows() {
  return rows.filter(({ request, row }) => !row.hidden && !request.resolved);
}

function updateSelection() {
  const available = availableRows();
  all.disabled = available.length === 0;
  all.checked = available.length > 0 && selected.size === available.length;
  all.indeterminate = selected.size > 0 && !all.checked;
  for (const { request, checkbox } of rows)
    checkbox.checked = selected.has(request);
  resolve.disabled = selected.size === 0;
  resolve.textContent = selected.size
    ? `Resolve selected (${selected.size})`
    : "Resolve selected";
}

function updateDetail(message = "") {
  detailTitle.textContent = current?.subject ?? "Request details";
  detailBody.hidden = !current;
  detailPlaceholder.hidden = !!current;
  detailNote.textContent = message;
  for (const { request, row, button } of rows) {
    row.toggleAttribute("data-current", request === current);
    if (request === current) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
  if (!current) return;
  detailId.textContent = current.id;
  detailCustomer.textContent = current.customer;
  detailReceived.textContent = current.received;
  detailMessage.textContent = current.message;
  detailAction.textContent = current.resolved
    ? "Reopen request"
    : "Resolve request";
  showStatus(detailStatus, current);
}

function updateQueue(message = "") {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const { request, row, badge, checkbox } of rows) {
    const status = request.resolved ? "resolved" : "open";
    row.hidden =
      (filter.value !== "all" && filter.value !== status) ||
      !`${request.id} ${request.subject} ${request.customer}`
        .toLocaleLowerCase()
        .includes(query);
    if (!row.hidden) count++;
    if (row.hidden || request.resolved) selected.delete(request);
    checkbox.disabled = request.resolved;
    showStatus(badge, request);
  }
  refresh.busy = state === "loading";
  loading.hidden = state !== "loading";
  error.hidden = state !== "error";
  empty.hidden = state !== "ready" || count > 0;
  results.hidden = state !== "ready" || count === 0;
  const countText = `${count} ${count === 1 ? "request" : "requests"}`;
  note.textContent = {
    loading: "Loading requests…",
    error: "Requests unavailable.",
    ready: message ? `${message} ${countText} shown.` : countText,
  }[state];
  updateSelection();
}

function filterQueue(message = "") {
  updateQueue(message);
  if (!rows.some(({ request, row }) => request === current && !row.hidden)) {
    current =
      state === "ready"
        ? rows.find(({ row }) => !row.hidden)?.request
        : undefined;
    queue.removeAttribute("data-detail-open");
  }
  updateDetail();
}

async function loadQueue() {
  state = "loading";
  queue.removeAttribute("data-detail-open");
  current = undefined;
  selected.clear();
  updateQueue();
  updateDetail();
  // Replace this demo delay and data with your request to the support API.
  await new Promise((done) => setTimeout(done, 450));
  state = failNextLoad ? "error" : "ready";
  failNextLoad = false;
  filterQueue();
}

queue.addEventListener("focusin", ({ target }) => {
  if (target instanceof Element)
    queue.toggleAttribute(
      "data-detail-open",
      !!target.closest(".queue-detail"),
    );
});
search.addEventListener("pl-input", () => filterQueue());
filter.addEventListener("pl-change", () => filterQueue());
refresh.addEventListener("pl-press", () => void loadQueue());
document.querySelector("#retry")!.addEventListener("pl-press", async () => {
  refresh.focus();
  await loadQueue();
});
document.querySelector("#clear-filters")!.addEventListener("pl-press", () => {
  search.value = "";
  filter.value = "all";
  filterQueue();
  search.focus();
});
all.addEventListener("pl-change", () => {
  selected.clear();
  if (all.checked)
    for (const { request } of availableRows()) selected.add(request);
  updateSelection();
});
resolve.addEventListener("pl-press", () => {
  const count = selected.size;
  for (const request of selected) request.resolved = true;
  selected.clear();
  filterQueue(`${count} ${count === 1 ? "request" : "requests"} resolved.`);
  search.focus();
});
detailAction.addEventListener("pl-press", () => {
  if (!current) return;
  current.resolved = !current.resolved;
  updateQueue();
  updateDetail(current.resolved ? "Request resolved." : "Request reopened.");
});
document.querySelector("#back")!.addEventListener("pl-press", () => {
  queue.removeAttribute("data-detail-open");
  const row = rows.find(
    ({ request, row }) => request === current && !row.hidden,
  );
  (row?.button ?? search).focus();
});
document.querySelector("#queue-nav")!.addEventListener("pl-navigate", () => {
  queue.removeAttribute("data-detail-open");
  if (matchMedia("(max-width: 760px)").matches)
    document.querySelector("pl-sidebar")!.hide();
});

void loadQueue();
