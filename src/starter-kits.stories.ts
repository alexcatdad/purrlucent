import type { Meta, StoryObj } from "@storybook/web-components-vite";
import { html } from "lit";
import { ref } from "lit/directives/ref.js";

const kitStories = {
  "product-site/index.html": "product-site",
  "product-site/centered.html": "centered-hero",
  "onboarding/index.html": "onboarding",
  "admin/index.html": "admin",
  "billing/index.html": "billing",
  "docs/index.html": "documentation",
  "docs/theming.html": "theming-article",
};

type Args = { page: keyof typeof kitStories };
type Story = StoryObj<Args>;

export default {
  title: "Starter kits",
  parameters: { layout: "fullscreen", controls: { disable: true } },
  render: ({ page }, { globals, name }) => {
    const manager = window.frameElement ? new URL(parent.location.href) : null;
    const kitBase = new URL("./kits/", location.href);
    const storyPath = `/story/starter-kits--${kitStories[page]}`;
    const src = new URL(page, kitBase);
    if (manager?.searchParams.get("path") === storyPath)
      src.hash = manager.hash;

    // Apply Storybook's globals to the kit's document after load and on updates.
    const applyGlobals = (frame: Element | null | undefined) => {
      if (!(frame instanceof HTMLIFrameElement)) return;
      const root = frame.contentDocument?.documentElement;
      if (!root) return;
      root.dir = globals.dir;
      root.style.colorScheme = globals.theme === "system" ? "" : globals.theme;
      root.setAttribute("pl-material", globals.material);
      root.setAttribute("data-pl-density", globals.density);
    };

    const load = (event: Event) => {
      const frame = event.currentTarget as HTMLIFrameElement;
      applyGlobals(frame);
      if (!frame.contentDocument) return;
      // Route links to other kit pages through their Storybook sidebar entries.
      for (const link of frame.contentDocument.querySelectorAll<HTMLAnchorElement>(
        "a[href]:not([target], [download])",
      )) {
        const url = new URL(link.href);
        const path =
          url.origin === kitBase.origin &&
          url.pathname.startsWith(kitBase.pathname) &&
          url.pathname !== src.pathname
            ? url.pathname.slice(kitBase.pathname.length)
            : "";
        const publishedStory =
          url.origin === "https://alexcatdad.github.io" &&
          url.pathname === "/purrlucent/"
            ? url.searchParams.get("path")
            : null;
        const destination = Object.hasOwn(kitStories, path)
          ? `/story/starter-kits--${kitStories[path as keyof typeof kitStories]}`
          : publishedStory;
        if (!destination || manager?.searchParams.get("path") !== storyPath) {
          if (publishedStory || url.origin !== kitBase.origin)
            link.target = "_top";
          continue;
        }
        const pointToStory = () => {
          const peer = new URL(parent.location.href);
          peer.searchParams.set("path", destination);
          peer.searchParams.delete("args");
          peer.hash = url.hash;
          link.href = peer.href;
        };
        pointToStory();
        link.addEventListener("click", pointToStory);
        link.target = "_top";
      }
    };

    return html`<iframe
      ${ref(applyGlobals)}
      @load=${load}
      src=${src.href}
      title=${name}
      style="display:block;inline-size:100%;block-size:100dvh;border:0"
    ></iframe>`;
  },
} satisfies Meta<Args>;

export const ProductSite: Story = {
  name: "Product site",
  args: { page: "product-site/index.html" },
};

export const CenteredHero: Story = {
  name: "Centered hero and compact footer",
  args: { page: "product-site/centered.html" },
};

export const Onboarding: Story = { args: { page: "onboarding/index.html" } };

export const Admin: Story = { args: { page: "admin/index.html" } };

export const Billing: Story = { args: { page: "billing/index.html" } };

export const Documentation: Story = { args: { page: "docs/index.html" } };

export const ThemingArticle: Story = {
  name: "Theming article",
  args: { page: "docs/theming.html" },
};
