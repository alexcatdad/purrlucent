import type { ReactiveController, ReactiveControllerHost } from "lit";
import {
  dropTexture,
  schedulePlacement,
  textureLens,
  textureStyleChanged,
} from "./texture-lens.ts";

/*
 * Refraction for glass, as Apple's glass bends what is behind its rim. Each
 * host gets an SVG displacement filter sized to its box, and the host's own
 * backdrop-filter reads it as --pl-lens ahead of the blur. Only Chromium draws
 * an SVG filter in backdrop-filter (WebKit bug 245510; Firefox drops the
 * displacement there). WebKit can magnify a known texture painted into the face.
 * The filter must
 * live in the host's own tree (the document, or the shadow root that holds the
 * host), and a reference to a missing filter drops the whole backdrop-filter,
 * so the variable is set only while its filter is in place.
 * lens.ts loads this module only once a host sits inside glass.
 */

const supported =
  typeof navigator !== "undefined" && "userAgentData" in navigator;
const webkit =
  !supported &&
  typeof navigator !== "undefined" &&
  navigator.vendor === "Apple Computer, Inc.";

// feDisplacementMap measures offsets in CSS pixels. Use the same optical
// profile for every backdrop and scale it to the surface's longest side.
const lensScale = (w: number, h: number) =>
  Math.ceil(2 * (23 + 0.03 * Math.max(w, h)));

function lensAxis(length: number, samples: number) {
  return Array.from({ length: samples }, (_, i) => {
    const position = ((i + 0.5) * length) / samples;
    const edge = Math.min(position, length - position);
    return {
      edge,
      bevel:
        Math.min(23, length / 3) *
        (Math.exp(-position / 9) - Math.exp(-(length - position) / 9)),
      zoom: (position - length / 2) * 0.06,
      interior: 1 - Math.exp(-edge / 12),
    };
  });
}

/** Red and green encode the horizontal and vertical displacement of the backdrop. */
export function displacementMap(
  w: number,
  h: number,
  radius: number,
  cols = w,
  rows = h,
) {
  const data = new Uint8ClampedArray(cols * rows * 4);
  const scale = lensScale(w, h);
  const xs = lensAxis(w, cols);
  const ys = lensAxis(h, rows);
  let offset = 0;
  for (const y of ys)
    for (const x of xs) {
      const outside =
        x.edge < radius &&
        y.edge < radius &&
        (radius - x.edge) ** 2 + (radius - y.edge) ** 2 > radius ** 2;
      data[offset++] = outside
        ? 128
        : 255 * (0.5 + (x.bevel - x.zoom * y.interior) / scale);
      data[offset++] = outside
        ? 128
        : 255 * (0.5 + (y.bevel - y.zoom * x.interior) / scale);
      data[offset++] = 128;
      data[offset++] = 255;
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
    canvas.width = Math.min(w, 512);
    canvas.height = Math.min(h, 512);
    canvas
      .getContext("2d")!
      .putImageData(
        new ImageData(
          displacementMap(w, h, r, canvas.width, canvas.height),
          canvas.width,
          canvas.height,
        ),
        0,
        0,
      );
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
    filter.innerHTML = `<feFlood flood-color="rgb(128 128 128)" result="still"/><feImage href="${canvas.toDataURL()}" width="${w}" height="${h}" preserveAspectRatio="none" result="rim"/><feMerge result="map"><feMergeNode in="still"/><feMergeNode in="rim"/></feMerge><feDisplacementMap in="SourceGraphic" in2="map" scale="${lensScale(w, h)}" xChannelSelector="R" yChannelSelector="G"/>`;
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

const hosts = new Map<HTMLElement, Lens | undefined>();

function refresh(element: HTMLElement, restyle = false) {
  const previous = hosts.get(element);
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  const style = getComputedStyle(element);
  const glass = !!(w && h && style.backdropFilter !== "none");
  const copy = textureLens(element, glass, restyle, supported);
  const clip = copy?.rim ? copy.clip : undefined;
  if (copy) element.style.removeProperty("--pl-lens");
  if (glass && (clip || (supported && !copy))) {
    const radius = Number.parseFloat(style.borderTopLeftRadius);
    const r = Math.round(Math.min(radius || 0, w / 2, h / 2));
    const tree = (clip ?? element).getRootNode() as Tree;
    if (
      previous?.key === `${w} ${h} ${r}` &&
      previous.filter.getRootNode() === tree &&
      (clip ? clip.style.filter : element.style.getPropertyValue("--pl-lens"))
    )
      return;
    const lens = lensFor(tree, w, h, r);
    if (clip) clip.style.filter = `url(#${lens.filter.id})`;
    else element.style.setProperty("--pl-lens", `url(#${lens.filter.id})`);
    hosts.set(element, lens);
  } else if (previous) {
    element.style.removeProperty("--pl-lens");
    hosts.set(element, undefined);
  }
  if (previous) release(previous);
}

const resizes =
  (supported || webkit) && typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => {
        const update = () => {
          for (const { target } of entries)
            if (hosts.has(target as HTMLElement))
              refresh(target as HTMLElement);
        };
        // A texture copy starts observing its source. Register it outside the
        // current delivery, which may already have visited that ancestor.
        requestAnimationFrame(update);
      })
    : undefined;

// Material can change on an ancestor without a resize or a Lit update.
const materialTrees = new Map<
  Tree,
  { observer: MutationObserver; users: number }
>();
const solidPreference =
  supported || webkit
    ? matchMedia(
        "(prefers-reduced-transparency: reduce), (prefers-contrast: more), (forced-colors: active)",
      )
    : undefined;
function refreshMaterials() {
  for (const el of hosts.keys()) refresh(el, true);
}
const texturePreferences =
  supported || webkit
    ? [
        matchMedia("(prefers-color-scheme: dark)"),
        matchMedia("(prefers-reduced-motion: reduce)"),
      ]
    : [];
function watchMaterial(host: HTMLElement) {
  const roots: Tree[] = [];
  if (!materialTrees.size) {
    solidPreference?.addEventListener("change", refreshMaterials);
    for (const pref of texturePreferences)
      pref.addEventListener("change", refreshMaterials);
  }
  for (
    let tree = host.getRootNode() as Tree;
    ;
    tree = tree.host.getRootNode() as Tree
  ) {
    let watch = materialTrees.get(tree);
    if (!watch) {
      const observer = new MutationObserver((records) => {
        if (
          records.some(
            (r) =>
              (r.attributeName !== "style" && r.attributeName !== "class") ||
              textureStyleChanged(r.target),
          )
        )
          refreshMaterials();
      });
      if (tree instanceof ShadowRoot)
        tree.addEventListener("scroll", schedulePlacement, true);
      observer.observe(tree, {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "pl-material",
          "pl-glass",
          "pl-texture",
          "pl-texture-lens",
          "pl-texture-motion",
          "pl-theme",
          "style",
          "class",
        ],
      });
      watch = { observer, users: 0 };
      materialTrees.set(tree, watch);
    }
    watch.users++;
    roots.push(tree);
    if (!(tree instanceof ShadowRoot)) break;
  }
  return roots;
}

/** A lens for the host, a rendered popup, or the matching faces inside a component; driven by LensController. */
export class LensEngine implements ReactiveController {
  #host: ReactiveControllerHost & HTMLElement;
  #target?: string | (() => HTMLElement | null);
  #elements = new Set<HTMLElement>();
  #trees: Tree[] = [];

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    target?: string | (() => HTMLElement | null),
  ) {
    this.#host = host;
    this.#target = target;
  }

  hostConnected() {
    if (!resizes) return;
    this.#trees = watchMaterial(this.#host);
    this.hostUpdated();
  }

  hostUpdated() {
    if (!resizes || !this.#host.isConnected) return;
    const next = new Set<HTMLElement>();
    if (typeof this.#target === "string") {
      for (const el of this.#host.shadowRoot?.querySelectorAll<HTMLElement>(
        this.#target,
      ) ?? [])
        next.add(el);
    } else {
      const el = this.#target ? this.#target() : this.#host;
      if (el) next.add(el);
    }
    for (const el of this.#elements) if (!next.has(el)) this.#detach(el);
    for (const el of next) {
      if (!this.#elements.has(el)) {
        hosts.set(el, undefined);
        resizes.observe(el);
      } else refresh(el);
    }
    this.#elements = next;
  }

  #detach(el: HTMLElement) {
    dropTexture(el);
    resizes?.unobserve(el);
    const lens = hosts.get(el);
    if (lens) {
      el.style.removeProperty("--pl-lens");
      release(lens);
    }
    hosts.delete(el);
  }

  hostDisconnected() {
    for (const el of this.#elements) this.#detach(el);
    this.#elements.clear();
    for (const tree of this.#trees) {
      const watch = materialTrees.get(tree)!;
      if (--watch.users === 0) {
        if (tree instanceof ShadowRoot)
          tree.removeEventListener("scroll", schedulePlacement, true);
        watch.observer.disconnect();
        materialTrees.delete(tree);
      }
    }
    this.#trees = [];
    if (!materialTrees.size) {
      solidPreference?.removeEventListener("change", refreshMaterials);
      for (const pref of texturePreferences)
        pref.removeEventListener("change", refreshMaterials);
    }
  }
}
