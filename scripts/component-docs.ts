// Writes docs/components.md from the Custom Elements Manifest, so the reference
// always matches the code. The descriptions come from the JSDoc on each element.
//
// usage: bun scripts/component-docs.ts   (after `bun run build`)
import { readFileSync, writeFileSync } from "node:fs";

type Described = { name: string; description?: string };
type Attribute = Described & { type?: { text: string }; default?: string };
type Declaration = Described & {
  tagName?: string;
  attributes?: Attribute[];
  slots?: Described[];
  cssParts?: Described[];
  events?: Described[];
};
export type Manifest = {
  modules: { path: string; declarations?: Declaration[] }[];
};

const oneLine = (text = "") => text.replace(/\s*\n\s*/g, " ").trim();
const cell = (text = "") => oneLine(text).replaceAll("|", "\\|");
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
  }${list("Slots", d.slots, "default")}${list("Parts", d.cssParts)}${list("Events", d.events)}`;

/** The reference page: one section per component folder, one entry per element. */
export function componentDocs(manifest: Manifest): string {
  const folders = new Map<string, Declaration[]>();
  for (const module of manifest.modules) {
    const folder = /^src\/components\/([^/]+)\//.exec(module.path)?.[1];
    const elements = (module.declarations ?? []).filter((d) => d.tagName);
    if (folder && elements.length)
      folders.set(folder, [...(folders.get(folder) ?? []), ...elements]);
  }
  const sections = [...folders]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([folder, elements]) =>
        `## ${title(folder)}\n\n\`\`\`ts\nimport "purrlucent/${folder}";\n\`\`\`\n\n${elements.map(element).join("")}`,
    );
  return `# Components\n\nThis page is generated from the code by \`bun scripts/component-docs.ts\`. Each component has its own import path; \`import "purrlucent"\` loads all of them. Examples for every component are in Storybook.\n\n${sections.join("")}`.replace(
    /\n+$/,
    "\n",
  );
}

if (import.meta.main)
  writeFileSync(
    "docs/components.md",
    componentDocs(
      JSON.parse(readFileSync("dist/custom-elements.json", "utf8")) as Manifest,
    ),
  );
