import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { STORY_GROUPS } from "../.storybook/groups";

const placement: Record<string, readonly string[]> = {
  Foundations: [
    "Tokens",
    "Typography",
    "Surfaces",
    "Interaction",
    "Localization",
  ],
  Actions: ["Button", "Button Group", "Toggle", "Toggle Group"],
  Forms: [
    "Field",
    "Input",
    "Input Group",
    "Input OTP",
    "Text Area",
    "Number Field",
    "Select",
    "Combobox",
    "Checkbox",
    "Radio Group",
    "Switch",
    "Slider",
    "Date Picker",
    "Calendar",
    "Month Range Picker",
  ],
  Text: ["Badge", "Kbd", "Marker"],
  Navigation: [
    "Sidebar",
    "Toolbar",
    "Navigation Menu",
    "Tabs",
    "Breadcrumb",
    "Pagination",
  ],
  Menus: ["Menu", "Context Menu", "Menubar", "Command"],
  Dialogs: ["Dialog", "Drawer", "Popover", "Hover Card", "Tooltip"],
  Feedback: ["Toast", "Banner", "Progress", "Spinner", "Skeleton", "Empty"],
  "Cards & Lists": ["Card", "Item", "Avatar", "Attachment"],
  Containers: [
    "Accordion",
    "Collapsible",
    "Carousel",
    "Separator",
    "Scroll Area",
    "Resizable",
    "Aspect Ratio",
  ],
  Data: ["Table", "Data Table", "Chart"],
  "AI & Chat": ["Prompt Input", "Message", "Bubble", "Message Scroller"],
  Patterns: ["Chat", "Dashboard", "Mail", "Settings", "Sign-in"],
};

const titles = (readdirSync("src", { recursive: true }) as string[])
  .filter((file) => file.endsWith(".stories.ts"))
  .map((file) => {
    const source = readFileSync(`src/${file}`, "utf8");
    const match = /^(?:const meta = \{|\s*)\s*title: "([^"]+)"/m.exec(source);
    const title = match?.[1];
    if (!title) throw new Error(`no meta title in ${file}`);
    return title;
  })
  .sort();

test('every story title is "<group>/<Name>"', () => {
  for (const title of titles) {
    const parts = title.split("/");
    expect(parts, title).toHaveLength(2);
    const [group = "", name = ""] = parts;
    expect(STORY_GROUPS as readonly string[], title).toContain(group);
    expect(name, title).toMatch(/^[A-Z0-9][\w&-]*( [A-Z0-9][\w&-]*)*$/);
  }
});

test("the component placement matches the design", () => {
  const expected = Object.entries(placement)
    .flatMap(([group, names]) => names.map((name) => `${group}/${name}`))
    .sort();
  expect(titles).toEqual(expected);
});

test("the preview sorts the sidebar by STORY_GROUPS", () => {
  const preview = readFileSync(".storybook/preview.ts", "utf8");
  const order = /order: \[([^\]]+)\]/.exec(preview)?.[1] ?? "";
  expect(JSON.parse(`[${order.replace(/,\s*$/, "")}]`)).toEqual([
    ...STORY_GROUPS,
  ]);
});

test("the placement lists every group in sidebar order", () => {
  expect(Object.keys(placement)).toEqual([...STORY_GROUPS]);
});
