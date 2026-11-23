import { LitElement, html, type PropertyValues } from "lit";
import { avatarStyles } from "./avatar.css.ts";

/** The first letter of the first and of the last word of a name, in capitals. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  const last = words.length > 1 ? words.at(-1) : undefined;
  return [first, last]
    .map((word) => (word ? Array.from(word)[0] : ""))
    .join("")
    .toLocaleUpperCase();
}

/**
 * A round picture of a person. When there is no `src`, or the image fails to
 * load, it shows the initials of `name`. With a `name` the host is an image
 * named by it, and the picture and the initials are hidden from assistive
 * technology so the name is read once. Without a `name` the avatar is
 * decorative and has no role.
 *
 * @attr {string} src - The image address.
 * @attr {string} name - The person's name. It gives the accessible name and the initials.
 * @attr {string} size - `sm`, `md` (default), `lg` or `xl`.
 * @csspart image - The picture.
 * @csspart initials - The fallback initials.
 */
export class PlAvatar extends LitElement {
  static override styles = avatarStyles;
  static override properties = {
    src: {},
    name: {},
    size: { reflect: true },
    _status: { state: true },
  };

  declare src: string;
  declare name: string;
  declare size: "sm" | "md" | "lg" | "xl";
  declare _status: "loading" | "loaded" | "error";

  constructor() {
    super();
    this.src = "";
    this.name = "";
    this.size = "md";
    this._status = "loading";
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    if (changed.has("src")) this._status = "loading";
    const name = this.name.trim();
    if (!name) {
      if (this.getAttribute("role") === "img") {
        this.removeAttribute("role");
        this.removeAttribute("aria-label");
      }
    } else {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", name);
    }
  }

  override render() {
    const showImage = this.src && this._status !== "error";
    return html`${
      this._status === "loaded" && showImage
        ? ""
        : html`<span part="initials" aria-hidden="true"
            >${initialsOf(this.name || "")}</span
          >`
    }${
      showImage
        ? html`<img
            part="image"
            alt=""
            aria-hidden="true"
            src=${this.src}
            @load=${() => (this._status = "loaded")}
            @error=${() => (this._status = "error")}
          />`
        : ""
    }`;
  }
}

customElements.define("pl-avatar", PlAvatar);

declare global {
  interface HTMLElementTagNameMap {
    "pl-avatar": PlAvatar;
  }
}
