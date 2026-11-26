/**
 * Mirrors the edges a sideways-scrolling element can still scroll toward to
 * its `data-scrollable` ("start", "end" or both), which styles fade. Without
 * `active`, or when it fits, the attribute goes. scrollLeft runs negative
 * under rtl, so its size is the distance from the start.
 */
export const markScrollEdges = (el: Element, active = true) => {
  const room = el.scrollWidth - el.clientWidth;
  const from = Math.abs(el.scrollLeft);
  const value =
    active && room > 1
      ? [from > 1 && "start", from < room - 1 && "end"]
          .filter(Boolean)
          .join(" ")
      : "";
  if (value) el.setAttribute("data-scrollable", value);
  else el.removeAttribute("data-scrollable");
};
