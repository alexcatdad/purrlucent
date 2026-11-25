import type { ReactiveController, ReactiveControllerHost } from "lit";
import type { LensEngine } from "./lens-engine.ts";

/*
 * Glass refraction, loaded on demand. Only Chromium and WebKit draw a lens,
 * and only inside pl-material="glass". Until a host sits in glass, this
 * controller only reads attributes up its ancestors; the first host in glass
 * imports lens-engine.ts, which measures and draws. Solid pages never load it.
 */

const capable =
  typeof navigator !== "undefined" &&
  typeof ResizeObserver !== "undefined" &&
  ("userAgentData" in navigator || navigator.vendor === "Apple Computer, Inc.");

type Host = ReactiveControllerHost & HTMLElement;
type Target = string | (() => HTMLElement | null);
type Tree = Document | ShadowRoot;

/** Whether glass reaches the element: an ancestor in the flat tree, where custom properties inherit, sets it. */
export function inGlass(el: Element) {
  for (let node: Element | null = el; node;) {
    if (node.getAttribute("pl-material") === "glass") return true;
    const root = node.getRootNode();
    node =
      node.assignedSlot ??
      node.parentElement ??
      (root instanceof ShadowRoot ? root.host : null);
  }
  return false;
}

let engine: Promise<typeof import("./lens-engine.ts")> | undefined;

/** Hosts not yet in glass, re-checked when pl-material changes in a tree they sit in. */
const waiting = new Set<() => void>();
const watched = new Map<Tree, { observer: MutationObserver; users: number }>();

function watch(host: Host) {
  const trees: Tree[] = [];
  for (let tree = host.getRootNode() as Tree; ;) {
    let entry = watched.get(tree);
    if (!entry) {
      const observer = new MutationObserver(() => {
        for (const check of [...waiting]) check();
      });
      observer.observe(tree, {
        subtree: true,
        attributes: true,
        attributeFilter: ["pl-material"],
      });
      entry = { observer, users: 0 };
      watched.set(tree, entry);
    }
    entry.users++;
    trees.push(tree);
    if (!(tree instanceof ShadowRoot)) return trees;
    tree = tree.host.getRootNode() as Tree;
  }
}

function unwatch(trees: Tree[]) {
  for (const tree of trees) {
    const entry = watched.get(tree)!;
    if (--entry.users === 0) {
      entry.observer.disconnect();
      watched.delete(tree);
    }
  }
}

/** A lens for the host, a rendered popup, or the matching faces inside a component. */
export class LensController implements ReactiveController {
  #host: Host;
  #target?: Target;
  #engine?: LensEngine;
  #trees: Tree[] = [];
  #check = () => {
    if (!inGlass(this.#host)) return;
    this.#stopWaiting();
    engine ??= import("./lens-engine.ts");
    void engine.then(({ LensEngine }) => {
      // Skip when the host left, or came back outside glass, while loading.
      if (this.#engine || !this.#host.isConnected || waiting.has(this.#check))
        return;
      this.#engine = new LensEngine(this.#host, this.#target);
      this.#engine.hostConnected();
    });
  };

  constructor(host: Host, target?: Target) {
    this.#host = host;
    this.#target = target;
    host.addController(this);
  }

  hostConnected() {
    if (!capable) return;
    this.#trees = watch(this.#host);
    waiting.add(this.#check);
    this.#check();
  }

  hostUpdated() {
    if (this.#engine) this.#engine.hostUpdated();
    else if (waiting.has(this.#check)) this.#check();
  }

  hostDisconnected() {
    this.#stopWaiting();
    this.#engine?.hostDisconnected();
    this.#engine = undefined;
  }

  #stopWaiting() {
    if (!waiting.delete(this.#check)) return;
    unwatch(this.#trees);
    this.#trees = [];
  }
}
