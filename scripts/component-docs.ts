// Writes docs/components.md from the Custom Elements Manifest, so the reference
// always matches the code. The descriptions come from the JSDoc on each element.
//
// usage: bun scripts/component-docs.ts
import { $ } from "bun";
import { readFileSync, writeFileSync } from "node:fs";

export const PAGE = "docs/components.md";

type Described = { name: string; description?: string };
type Attribute = Described & { type?: { text: string }; default?: string };
type Parameter = Attribute & { optional?: boolean; rest?: boolean };
type Member = Attribute & {
  kind: string;
  privacy?: "public" | "protected" | "private";
  static?: boolean;
  attribute?: string;
  parameters?: Parameter[];
  return?: { type?: { text: string } };
};
type Declaration = Described & {
  tagName?: string;
  attributes?: Attribute[];
  slots?: Described[];
  cssParts?: Described[];
  cssProperties?: Described[];
  events?: Described[];
  members?: Member[];
};
export type Manifest = {
  modules: { path: string; declarations?: Declaration[] }[];
};

const oneLine = (text = "") => text.replace(/\s*\n\s*/g, " ").trim();
const cell = (text = "") => oneLine(text).replaceAll("|", "\\|");
const publicMember = (member: Member) =>
  (member.privacy ?? "public") === "public" && !/^[#_]/.test(member.name);
const title = (folder: string) =>
  folder.charAt(0).toUpperCase() + folder.slice(1).replaceAll("-", " ");

const list = (heading: string, items: Described[] = [], unnamed = "") =>
  items.length
    ? `**${heading}**\n\n${items
        .map(
          (item) =>
            `- ${item.name ? `\`${item.name}\`` : unnamed}: ${oneLine(item.description)}`,
        )
        .join("\n")}\n\n`
    : "";

const lifecycle = new Set([
  "adoptedCallback",
  "attributeChangedCallback",
  "connectedCallback",
  "connectedMoveCallback",
  "disconnectedCallback",
  "formAssociatedCallback",
  "formDisabledCallback",
  "formResetCallback",
  "formStateRestoreCallback",
  "createRenderRoot",
  "requestUpdate",
  "scheduleUpdate",
  "performUpdate",
  "shouldUpdate",
  "willUpdate",
  "update",
  "render",
  "firstUpdated",
  "updated",
]);

function methods(declaration: Declaration) {
  const entries = (declaration.members ?? [])
    .filter(
      (member) =>
        member.kind === "method" &&
        publicMember(member) &&
        !lifecycle.has(member.name),
    )
    .map((member) => {
      const parameters = (member.parameters ?? []).map(
        ({ name, rest, optional, type, default: initial }) =>
          `${rest ? "..." : ""}${oneLine(name)}${optional && initial === undefined ? "?" : ""}${type ? `: ${oneLine(type.text)}` : ""}${initial === undefined ? "" : ` = ${oneLine(initial)}`}`,
      );
      const name = `${member.static ? `${declaration.name}.` : ""}${member.name}`;
      const returns = member.return?.type?.text;
      const signature = `${name}(${parameters.join(", ")})${returns ? `: ${oneLine(returns)}` : ""}`;
      const description = oneLine(member.description);
      return `- \`${signature}\`${description ? ` ${description}` : ""}`;
    });
  return entries.length ? `**Methods**\n\n${entries.join("\n")}\n\n` : "";
}

function properties(declaration: Declaration) {
  const entries = (declaration.members ?? [])
    .filter(
      (member) =>
        member.kind === "field" &&
        publicMember(member) &&
        !member.static &&
        member.attribute === undefined &&
        !!member.description,
    )
    .map(({ name, type, description }) => {
      const signature = type ? `${name}: ${oneLine(type.text)}` : name;
      return `- \`${signature}\` ${oneLine(description)}`;
    });
  return entries.length ? `**Properties**\n\n${entries.join("\n")}\n\n` : "";
}

const element = (d: Declaration) =>
  `### \`<${d.tagName}>\`\n\n${oneLine(d.description)}\n\n${
    d.attributes?.length
      ? `| Attribute | Type | Default | Description |\n| --- | --- | --- | --- |\n${d.attributes
          .map(
            (a) =>
              `| \`${a.name}\` | \`${cell(a.type?.text ?? "string")}\` | ${a.default ? `\`${cell(a.default)}\`` : ""} | ${cell(a.description)} |`,
          )
          .join("\n")}\n\n`
      : ""
  }${properties(d)}${methods(d)}${list("Slots", d.slots, "default")}${list("Parts", d.cssParts)}${list("CSS properties", d.cssProperties)}${list("Events", d.events)}`;

/** The reference page: one section per component folder, one entry per element. */
export function componentDocs(manifest: Manifest): string {
  const folders = new Map<string, Declaration[]>();
  for (const module of manifest.modules) {
    const folder = /^src\/components\/([^/]+)\//.exec(module.path)?.[1];
    const elements = (module.declarations ?? []).filter((d) => d.tagName);
    if (folder && elements.length)
      folders.set(folder, [...(folders.get(folder) ?? []), ...elements]);
  }
  const sorted = [...folders].sort(([a], [b]) => a.localeCompare(b));
  const contents = sorted
    .map(
      ([folder, elements]) =>
        `- [${title(folder)}](#${folder}): ${elements.map((d) => `\`${d.tagName}\``).join(", ")}`,
    )
    .join("\n");
  const sections = sorted.map(
    ([folder, elements]) =>
      `## ${title(folder)}\n\n\`\`\`ts\nimport "purrlucent/${folder}";\n\`\`\`\n\n${elements.map(element).join("")}`,
  );
  return `# Components\n\nThis page is generated from the code by \`bun scripts/component-docs.ts\`. Each component has its own import path. \`import "purrlucent"\` loads every component except the chart. Import \`purrlucent/chart\` and install its optional peer \`@tanstack/charts\` to use the chart. Storybook has examples for the components.\n\n## Contents\n\n${contents}\n\n${sections.join("")}`.replace(
    /\n+$/,
    "\n",
  );
}

/** The page for the code as it is now, formatted the way `bun fmt` keeps it. */
export async function currentDocs(): Promise<string> {
  await $`bunx cem analyze`.quiet();
  const page = componentDocs(
    JSON.parse(readFileSync("dist/custom-elements.json", "utf8")) as Manifest,
  );
  return $`bun fmt --stdin-filepath ${PAGE} < ${new Response(page)}`.text();
}

if (import.meta.main) writeFileSync(PAGE, await currentDocs());
