import paint from "../tokens/texture-paint.css?raw";

// The same stylesheet paints the source and its clipped copy inside a shadow tree.
let sheet: CSSStyleSheet | undefined;
const copies = new Map<HTMLElement, TextureCopy>();
let frame = 0;
export function schedulePlacement() {
  if (frame || !copies.size) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    for (const copy of copies.values()) copy.place();
  });
}

export function textureStyleChanged(target: Node) {
  for (const copy of copies.values())
    if (target.contains(copy.source)) return true;
  return false;
}

function textureBehind(face: HTMLElement) {
  for (let el: Element | null = face; el;) {
    if (el instanceof HTMLElement && el.hasAttribute("pl-texture")) return el;
    const root: Node = el.getRootNode();
    el =
      el.assignedSlot ??
      el.parentElement ??
      (root instanceof ShadowRoot ? root.host : null);
  }
  return null;
}

class TextureCopy {
  readonly clip = document.createElement("span");
  readonly plane = document.createElement("span");
  readonly resize = new ResizeObserver(() => this.place());
  constructor(
    readonly source: HTMLElement,
    face: HTMLElement,
  ) {
    const { clip, plane } = this;
    clip.setAttribute("aria-hidden", "true");
    clip.style.cssText =
      "position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;opacity:.67;z-index:-1";
    plane.style.cssText = "position:absolute;left:0;top:0;transform-origin:0 0";
    const root = clip.attachShadow({ mode: "open" });
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(paint);
    }
    root.adoptedStyleSheets = [sheet];
    root.append(plane);
    (face.shadowRoot ?? face).prepend(clip);
    this.resize.observe(source);
    this.resize.observe(clip);
  }
  get rim() {
    return this.source.getAttribute("pl-texture-lens") === "rim";
  }

  place() {
    const { clip, plane, source } = this;
    const fixed =
      source === document.body || source === document.documentElement;
    const box = clip.getBoundingClientRect();
    const src = source.getBoundingClientRect();
    const left = fixed ? 0 : src.left + source.clientLeft - source.scrollLeft;
    const top = fixed ? 0 : src.top + source.clientTop - source.scrollTop;
    const width = fixed
      ? document.documentElement.clientWidth
      : source.clientWidth;
    const height = fixed
      ? document.documentElement.clientHeight
      : source.clientHeight;
    const zoom = this.rim ? 1 : 1.064;
    const x = (left - box.left) * zoom + (box.width * (1 - zoom)) / 2;
    const y = (top - box.top) * zoom + (box.height * (1 - zoom)) / 2;
    plane.style.width = width + "px";
    plane.style.height = height + "px";
    plane.style.transform = `translate(${x}px,${y}px) scale(${zoom})`;
  }

  sync(style: CSSStyleDeclaration) {
    const { plane, source } = this;
    plane.setAttribute("pl-texture", source.getAttribute("pl-texture")!);
    for (const name of [
      "--pl-spacing",
      "--pl-color-saffron",
      "--pl-texture-size",
      "--pl-texture-dot",
      "--pl-texture-motion",
    ])
      plane.style.setProperty(name, style.getPropertyValue(name));
    plane.style.setProperty("--pl-texture-color", style.color);
    plane.style.setProperty("--pl-texture-fade", style.maskImage);
    if (source.getAttribute("pl-texture-motion") === "drift") {
      plane.setAttribute("pl-texture-motion", "drift");
      const drift = (el: Element) =>
        el
          .getAnimations({ subtree: true })
          .find(
            (a) =>
              a instanceof CSSAnimation &&
              a.animationName === "pl-texture-drift" &&
              (a.effect as KeyframeEffect).target === el,
          );
      const original = drift(source),
        replica = drift(plane);
      if (
        original?.startTime != null &&
        replica &&
        original.startTime !== replica.startTime
      )
        replica.startTime = original.startTime;
    } else plane.removeAttribute("pl-texture-motion");
    this.place();
  }
}

export function dropTexture(face: HTMLElement) {
  const copy = copies.get(face);
  if (!copy) return;
  copy.resize.disconnect();
  copy.clip.remove();
  copies.delete(face);
  if (!copies.size) {
    window.removeEventListener("scroll", schedulePlacement, true);
    window.removeEventListener("resize", schedulePlacement);
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/** Returns the filter target only when the texture requests rim refraction. */
export function textureLens(
  face: HTMLElement,
  glass: boolean,
  restyle: boolean,
) {
  const source = glass ? textureBehind(face) : null;
  let copy = copies.get(face);
  if (copy && (copy.source !== source || !copy.clip.isConnected)) {
    dropTexture(face);
    copy = undefined;
  }
  if (!source) return;
  if (copy && !restyle) {
    copy.place();
    return copy.rim ? copy.clip : undefined;
  }
  const style = getComputedStyle(source, "::before");
  if (style.content === "none" || style.backgroundImage === "none") {
    dropTexture(face);
    return;
  }
  if (!copy) {
    if (!copies.size) {
      window.addEventListener("scroll", schedulePlacement, true);
      window.addEventListener("resize", schedulePlacement);
    }
    copy = new TextureCopy(source, face);
    copies.set(face, copy);
  }
  copy.sync(style);
  if (copy.rim) return copy.clip;
  copy.clip.style.removeProperty("filter");
}
