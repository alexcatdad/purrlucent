import type { ReactiveController, ReactiveControllerHost } from "lit";

/*
 * Refraction for glass, as Apple's glass bends what is behind its rim. Each
 * host gets an SVG displacement filter sized to its box, and the host's own
 * backdrop-filter reads it as --pl-lens ahead of the blur. Only Chromium draws
 * an SVG filter in backdrop-filter (WebKit bug 245510; Firefox drops the
 * displacement there), so other engines keep the plain frost. The filter must
 * live in the host's own tree (the document, or the shadow root that holds the
 * host), and a reference to a missing filter drops the whole backdrop-filter,
 * so the variable is set only while its filter is in place.
 */

const supported =
  typeof navigator !== "undefined" && "userAgentData" in navigator;

/** How far, in pixels, the rim pulls the backdrop inward. */
const SCALE = 70;

/**
 * A displacement map for a w×h rounded rectangle of radius r, as RGBA bytes.
 * Red carries x and green y, 128 is still. Inside the bezel the backdrop is
 * pulled toward the centre, most at the rim; the middle does not move.
 */
export function displacementMap(w: number, h: number, r: number) {
  const bezel = Math.max(4, Math.min(36, Math.min(w, h) / 2));
  const data = new Uint8ClampedArray(w * h * 4);
  const hx = w / 2;
  const hy = h / 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // Distance inside the rounded rectangle, and the outward normal.
      const px = x + 0.5 - hx;
      const py = y + 0.5 - hy;
      const qx = Math.abs(px) - (hx - r);
      const qy = Math.abs(py) - (hy - r);
      let inside: number;
      let nx = 0;
      let ny = 0;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy);
        inside = r - l;
        nx = (qx / l) * Math.sign(px);
        ny = (qy / l) * Math.sign(py);
      } else {
        inside = r - Math.max(qx, qy);
        if (qx > qy) nx = Math.sign(px);
        else ny = Math.sign(py);
      }
      const t = inside > 0 && inside < bezel ? 1 - inside / bezel : 0;
      const i = (y * w + x) * 4;
      data[i] = 128 - nx * t * t * 127;
      data[i + 1] = 128 - ny * t * t * 127;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  return data;
}

const NS = "http://www.w3.org/2000/svg";

/** A filter shared by every host of one size in one tree, removed with its last user. */
type Lens = {
  filter: SVGFilterElement;
  users: number;
  key: string;
  lenses: Map<string, Lens>;
};
type Tree = Document | ShadowRoot;

/** Per tree: the hidden svg that holds its filters, and one filter per size. */
const trees = new WeakMap<
  Tree,
  { svg: SVGSVGElement; lenses: Map<string, Lens> }
>();
let next = 0;

function lensFor(tree: Tree, w: number, h: number, r: number): Lens {
  let entry = trees.get(tree);
  if (!entry?.svg.isConnected) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position: absolute; inline-size: 0; block-size: 0";
    (tree instanceof Document ? tree.body : tree).append(svg);
    entry = { svg, lenses: new Map() };
    trees.set(tree, entry);
  }
  const key = `${w} ${h} ${r}`;
  let lens = entry.lenses.get(key);
  if (!lens) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas
      .getContext("2d")!
      .putImageData(new ImageData(displacementMap(w, h, r), w, h), 0, 0);
    const filter = document.createElementNS(NS, "filter");
    filter.id = `pl-lens-${next++}`;
    for (const [name, value] of Object.entries({
      x: "0",
      y: "0",
      width: `${w}`,
      height: `${h}`,
      filterUnits: "userSpaceOnUse",
      primitiveUnits: "userSpaceOnUse",
      "color-interpolation-filters": "sRGB",
    }))
      filter.setAttribute(name, value);
    filter.innerHTML = `<feFlood flood-color="rgb(128 128 128)" result="still"/><feImage href="${canvas.toDataURL()}" width="${w}" height="${h}" preserveAspectRatio="none" result="rim"/><feMerge result="map"><feMergeNode in="still"/><feMergeNode in="rim"/></feMerge><feDisplacementMap in="SourceGraphic" in2="map" scale="${SCALE}" xChannelSelector="R" yChannelSelector="G"/>`;
    entry.svg.append(filter);
    lens = { filter, users: 0, key, lenses: entry.lenses };
    entry.lenses.set(key, lens);
  }
  lens.users++;
  return lens;
}

function release(lens: Lens) {
  if (--lens.users > 0) return;
  if (lens.lenses.get(lens.key) === lens) lens.lenses.delete(lens.key);
  lens.filter.remove();
}

const hosts = new Map<Element, LensController>();
const resizes =
  supported && typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        for (const { target } of entries) hosts.get(target)?.update();
      })
    : undefined;

/** Gives the host a lens sized to its border box, in Chromium. */
export class LensController implements ReactiveController {
  #host: ReactiveControllerHost & HTMLElement;
  #lens: Lens | undefined;

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.#host = host;
    host.addController(this);
  }

  hostConnected() {
    if (!resizes) return;
    hosts.set(this.#host, this);
    resizes.observe(this.#host);
  }

  hostDisconnected() {
    if (!resizes) return;
    resizes.unobserve(this.#host);
    hosts.delete(this.#host);
    this.#use(undefined);
  }

  update() {
    const host = this.#host;
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    if (!w || !h) return this.#use(undefined);
    const radius = Number.parseFloat(
      getComputedStyle(host).borderTopLeftRadius,
    );
    const r = Math.round(Math.min(radius || 0, w / 2, h / 2));
    this.#use(lensFor(host.getRootNode() as Tree, w, h, r));
  }

  /** The variable is set after its filter is in place and cleared before the filter goes. */
  #use(lens: Lens | undefined) {
    const previous = this.#lens;
    if (lens)
      this.#host.style.setProperty("--pl-lens", `url(#${lens.filter.id})`);
    else this.#host.style.removeProperty("--pl-lens");
    this.#lens = lens;
    if (previous) release(previous);
  }
}
