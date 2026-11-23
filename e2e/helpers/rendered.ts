import type { Page } from "@playwright/test";

/**
 * Text whose contrast is too low, measured from rendered pixels.
 *
 * axe cannot judge text over gradients, translucent layers or blur and files
 * it as "needs review". This renders the page with all text transparent, reads
 * the pixels behind each piece of text, and compares them with the text color.
 * It looks into shadow roots. Disabled controls are skipped: WCAG exempts them.
 */
export async function lowContrastText(page: Page): Promise<string[]> {
  const hide =
    "* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }";
  const runs = await page.evaluate((css) => {
    const roots: (Document | ShadowRoot)[] = [document];
    for (let i = 0; i < roots.length; i++)
      for (const el of roots[i]!.querySelectorAll("*"))
        if (el.shadowRoot) roots.push(el.shadowRoot);
    const up = (node: Node): Element | null =>
      (node as Element).assignedSlot ??
      node.parentElement ??
      (node.getRootNode() instanceof ShadowRoot
        ? (node.getRootNode() as ShadowRoot).host
        : null);
    const probe = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    })!;
    const rgba = (color: string) => {
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = color;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
      const alpha = a! / 255;
      // Canvas stores premultiplied color; undo it.
      return alpha ? [r! / alpha, g! / alpha, b! / alpha, alpha] : [0, 0, 0, 0];
    };
    const out: {
      box: number[];
      color: number[];
      large: boolean;
      text: string;
      where: string;
    }[] = [];
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim();
        // Slotted text takes its color from the slot it is shown in.
        const el = (node as Text).assignedSlot ?? node.parentElement;
        if (!text || !el || el.closest("script, style")) continue;
        const style = getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getClientRects()[0];
        if (!rect || rect.width < 4 || rect.height < 4) continue;
        let disabled = false;
        let clipped = false;
        let opacity = 1;
        for (let a: Element | null = el; a; a = up(a)) {
          if (
            a.matches(
              ':disabled, [disabled], [aria-disabled="true"], :state(disabled)',
            )
          )
            disabled = true;
          const s = getComputedStyle(a);
          opacity *= Number(s.opacity);
          if (a !== el && s.overflow !== "visible") {
            const b = a.getBoundingClientRect();
            if (
              rect.top < b.top ||
              rect.bottom > b.bottom ||
              rect.left < b.left ||
              rect.right > b.right
            )
              clipped = true;
          }
        }
        if (disabled || clipped) continue;
        const [r, g, b, a] = rgba(style.color);
        if (a! * opacity < 0.05) continue;
        const size = Number.parseFloat(style.fontSize);
        out.push({
          box: [
            rect.left + scrollX,
            rect.top + scrollY,
            rect.width,
            rect.height,
          ],
          color: [r!, g!, b!, a! * opacity],
          large:
            size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700),
          text: text.slice(0, 24),
          where: el.tagName.toLowerCase(),
        });
      }
    }
    // Hide the text everywhere, shadow roots included, until the pixels are read.
    for (const root of roots) {
      const style = document.createElement("style");
      style.dataset.plProbe = "";
      style.textContent = css;
      (root instanceof Document ? root.head : root).append(style);
    }
    return out;
  }, hide);

  const png = (
    await page.screenshot({ fullPage: true, animations: "disabled" })
  ).toString("base64");

  return page.evaluate(
    async ({ runs, png }) => {
      const roots: (Document | ShadowRoot)[] = [document];
      for (let i = 0; i < roots.length; i++)
        for (const el of roots[i]!.querySelectorAll("*"))
          if (el.shadowRoot) roots.push(el.shadowRoot);
      for (const root of roots)
        for (const s of root.querySelectorAll("style[data-pl-probe]"))
          s.remove();

      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      const scale = image.width / document.documentElement.scrollWidth;
      const lin = (c: number) =>
        c / 255 <= 0.04045
          ? c / 255 / 12.92
          : ((c / 255 + 0.055) / 1.055) ** 2.4;
      const lum = (c: number[]) =>
        0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!);

      const failures: string[] = [];
      for (const run of runs) {
        const [x, y, w, h] = run.box.map((v) => Math.round(v * scale));
        if (
          x! < 0 ||
          y! < 0 ||
          x! + w! > canvas.width ||
          y! + h! > canvas.height
        )
          continue;
        const { data } = ctx.getImageData(
          x!,
          y!,
          Math.max(1, w!),
          Math.max(1, h!),
        );
        const bg = [0, 0, 0];
        for (let i = 0; i < data.length; i += 4)
          for (let k = 0; k < 3; k++) bg[k]! += data[i + k]!;
        for (let k = 0; k < 3; k++) bg[k]! /= data.length / 4;
        const alpha = run.color[3]!;
        const fg = run.color
          .slice(0, 3)
          .map((c, k) => c * alpha + bg[k]! * (1 - alpha));
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const ratio = (hi! + 0.05) / (lo! + 0.05);
        const need = run.large ? 3 : 4.5;
        if (ratio < need - 0.05)
          failures.push(
            `"${run.text}" in <${run.where}>: ${ratio.toFixed(2)}:1, needs ${need}:1`,
          );
      }
      return failures;
    },
    { runs, png },
  );
}

/**
 * Components that ignore the spacing base.
 *
 * Every size in a component is a token or a calc() from tokens, so doubling
 * --pl-spacing must change every pl-* element, or an element inside it.
 * One that stays the same has a typed-in size somewhere.
 */
export async function ignoresSpacing(page: Page): Promise<string[]> {
  const measure = () =>
    page.evaluate(() => {
      const all: Element[] = [];
      const visit = (root: Document | ShadowRoot) => {
        for (const el of root.querySelectorAll("*")) {
          if (el.localName.startsWith("pl-")) all.push(el);
          if (el.shadowRoot) visit(el.shadowRoot);
        }
      };
      visit(document);
      return all.map((el) => {
        const r = el.getBoundingClientRect();
        // Inner elements too, so a part that grows inside a fixed host counts.
        const inner = [...(el.shadowRoot?.querySelectorAll("*") ?? [])].map(
          (p) => {
            const b = p.getBoundingClientRect();
            return `${b.width.toFixed(1)}x${b.height.toFixed(1)}`;
          },
        );
        return {
          tag: el.localName,
          // A one-pixel hairline is the house exception to the spacing base.
          shown: r.width > 1 && r.height > 1,
          size: `${r.width.toFixed(1)}x${r.height.toFixed(1)} ${inner.join(" ")}`,
        };
      });
    });
  const before = await measure();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--pl-spacing", "0.5rem");
  });
  const after = await measure();
  await page.evaluate(() => {
    document.documentElement.style.removeProperty("--pl-spacing");
  });
  return before
    .filter((b, i) => b.shown && after[i]?.size === b.size)
    .map((b) => `<${b.tag}> did not change when --pl-spacing doubled`);
}
