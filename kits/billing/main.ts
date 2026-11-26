import "purrlucent/badge";
import "purrlucent/button";
import "purrlucent/card";
import "purrlucent/dialog";
import "purrlucent/table";
import "purrlucent/toggle-group";

type Period = "monthly" | "yearly";

interface Plan {
  name: string;
  description: string;
  rate: Record<Period, number>;
  projects: string;
  members: number;
  history: string;
  roles: boolean;
}

interface Subscription {
  plan: Plan;
  period: Period;
}

const solo: Plan = {
  name: "Solo",
  description: "For independent projects and personal work.",
  rate: { monthly: 0, yearly: 0 },
  projects: "3",
  members: 1,
  history: "30 days",
  roles: false,
};
const team: Plan = {
  name: "Team",
  description: "For small teams working across multiple projects.",
  rate: { monthly: 24, yearly: 240 },
  projects: "Unlimited",
  members: 10,
  history: "1 year",
  roles: false,
};
const scale: Plan = {
  name: "Scale",
  description: "For larger teams that need more control over access.",
  rate: { monthly: 48, yearly: 480 },
  projects: "Unlimited",
  members: 30,
  history: "Unlimited",
  roles: true,
};
const plans = [solo, team, scale];
const comparison = [
  ["Active projects", (plan: Plan) => plan.projects],
  ["Members", (plan: Plan) => String(plan.members)],
  ["Activity history", (plan: Plan) => plan.history],
  ["Custom roles", (plan: Plan) => (plan.roles ? "Yes" : "No")],
] as const;

const format = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const periodLabel = { monthly: "Monthly", yearly: "Yearly" };
const cycle = { monthly: "month", yearly: "year" };

const periodControl = document.querySelector("pl-toggle-group")!;
const rateNote = document.querySelector("#rate-note")!;
const planList = document.querySelector("#plans")!;
const columns = document.querySelector("#compare-columns")!;
const compareBody =
  document.querySelector<HTMLTableSectionElement>("#compare-rows")!;
const planTemplate =
  document.querySelector<HTMLTemplateElement>("#plan-template")!;
const currentPlan = document.querySelector("#current-plan")!;
const currentRate = document.querySelector("#current-rate")!;
const billingTitle = document.querySelector<HTMLElement>("#billing-title")!;
const changeNote = document.querySelector("#change-note")!;
const undo = document.querySelector<HTMLElement>("#undo")!;
const confirm = document.querySelector("pl-dialog")!;
const confirmTitle = document.querySelector("#confirm-title")!;
const confirmDescription = document.querySelector("#confirm-description")!;

let period: Period = "monthly";
let current: Subscription = { plan: team, period: "monthly" };
let previous: Subscription | undefined;
let pending: Subscription | undefined;
let opener: HTMLElement | undefined;

function subscriptionLabel({ plan, period }: Subscription) {
  return `${plan.name} · ${plan === solo ? "Free" : periodLabel[period]}`;
}

function subscriptionRate({ plan, period }: Subscription) {
  return plan === solo
    ? "Free"
    : `${format.format(plan.rate[period])} per ${cycle[period]}`;
}

const cards = plans.map((plan) => {
  const card = planTemplate.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;
  const button = card.querySelector("pl-button")!;
  card.querySelector("h2")!.textContent = plan.name;
  card.querySelector(".plan-description")!.textContent = plan.description;
  const features = card.querySelector(".plan-features")!;
  const highlights = [
    `${plan.projects} active projects`,
    plan.members === 1 ? "1 member" : `Up to ${plan.members} members`,
    plan.history === "Unlimited"
      ? "Unlimited activity history"
      : `${plan.history} of activity history`,
  ];
  for (const highlight of highlights) {
    const item = document.createElement("li");
    item.textContent = highlight;
    features.append(item);
  }
  button.addEventListener("pl-press", () => {
    pending = { plan, period: plan === solo ? "monthly" : period };
    opener = button;
    confirmTitle.textContent = `Switch to ${plan.name}?`;
    confirmDescription.textContent =
      plan === solo
        ? "Solo has no subscription charge."
        : `${periodLabel[pending.period]} billing · ${subscriptionRate(pending)}`;
    confirm.show();
  });
  planList.append(card);

  const column = document.createElement("th");
  column.scope = "col";
  column.textContent = plan.name;
  columns.append(column);
  return {
    plan,
    card,
    button,
    badge: card.querySelector("pl-badge")!,
    price: card.querySelector(".plan-price span")!,
    cycleLabel: card.querySelector(".plan-price small")!,
  };
});

for (const [title, value] of comparison) {
  const row = compareBody.insertRow();
  const header = document.createElement("th");
  header.scope = "row";
  header.textContent = title;
  row.append(header);
  for (const plan of plans) row.insertCell().textContent = value(plan);
}

function updatePricing() {
  rateNote.textContent = `Billed ${period} in US dollars.`;
  for (const { plan, card, button, badge, price, cycleLabel } of cards) {
    const activePlan = plan === current.plan;
    const activeRate =
      activePlan && (current.period === period || plan === solo);
    const changePeriodLabel = `Switch ${plan.name} to ${period}`;
    card.toggleAttribute("data-current", activePlan);
    badge.hidden = !activePlan;
    price.textContent = format.format(plan.rate[period]);
    cycleLabel.textContent = plan === solo ? "Free" : `per ${cycle[period]}`;
    button.disabled = activeRate;
    button.variant = plan === team ? "primary" : "secondary";
    button.textContent = activeRate
      ? `${plan.name} is your current plan`
      : activePlan
        ? changePeriodLabel
        : `Choose ${plan.name}`;
  }
}

function updateAccount() {
  currentPlan.textContent = subscriptionLabel(current);
  currentRate.textContent = subscriptionRate(current);
  undo.hidden = !previous;
}

periodControl.addEventListener("change", () => {
  period = periodControl.value === "yearly" ? "yearly" : "monthly";
  updatePricing();
});

confirm.addEventListener("pl-close", (event) => {
  const { returnValue } = (event as CustomEvent<{ returnValue: string }>)
    .detail;
  if (returnValue === "confirm" && pending) {
    previous = current;
    current = pending;
    updatePricing();
    updateAccount();
    billingTitle.focus();
    changeNote.textContent = `Plan changed to ${subscriptionLabel(current)}.`;
  } else {
    opener?.focus();
  }
  pending = undefined;
  opener = undefined;
});

undo.addEventListener("pl-press", () => {
  if (!previous) return;
  current = previous;
  previous = undefined;
  billingTitle.focus();
  updatePricing();
  updateAccount();
  changeNote.textContent = `Plan change undone. Your plan is ${subscriptionLabel(current)}.`;
});

updatePricing();
updateAccount();
