import { createEffect, JSX, FlowComponent } from "solid-js";
import { createClassnames, enterTransition, exitTransition } from "./common";
import { createListTransition } from "@solid-primitives/transition-group";
import { resolveElements } from "@solid-primitives/refs";
import type { TransitionProps } from "./Transition";

type BoundingRect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
};

type ElementInfo = {
  pos: BoundingRect;
  newPos?: BoundingRect;
  new?: boolean;
  moved?: boolean;
};

function getRect(element: Element): BoundingRect {
  const { top, bottom, left, right, width, height } = element.getBoundingClientRect();

  const parentRect =
    element.parentNode instanceof Element
      ? element.parentNode.getBoundingClientRect()
      : { top: 0, left: 0 };

  return {
    top: top - parentRect.top,
    bottom,
    left: left - parentRect.left,
    right,
    width,
    height
  };
}

export type TransitionGroupProps = Omit<TransitionProps, "mode"> & {
  /**
   * CSS class applied to the moving elements for the entire duration of the move transition.
   * Defaults to `"s-move"`.
   */
  moveClass?: string;
};

export const TransitionGroup: FlowComponent<TransitionGroupProps> = props => {
  const classnames = createClassnames(props);

  const combined = createListTransition(resolveElements(() => props.children).toArray, {
    appear: props.appear,
    exitMethod: "keep-index",
    onChange({ added, removed, finishRemoved }) {
      const classes = classnames();
      for (const el of added) {
        enterTransition(classes, props, el);
      }
      for (const el of removed) {
        exitTransition(classes, props, el, () => finishRemoved([el]));
      }
    }
  });

  let first = !props.appear;
  createEffect<Map<Element, ElementInfo>>(nodes => {
    const c = combined();
    c.forEach(child => {
      let n: ElementInfo | undefined;
      if (!(n = nodes!.get(child))) {
        nodes!.set(child, (n = { pos: getRect(child), new: !first }));
      } else if (n.new) {
        n.new = false;
        n.newPos = getRect(child);
      }
      if (n.new) {
        child.addEventListener(
          "transitionend",
          () => {
            n!.new = false;
            child.parentNode && (n!.newPos = getRect(child));
          },
          { once: true }
        );
      }
      n.newPos && (n.pos = n.newPos);
      n.newPos = getRect(child);
    });
    if (first) {
      first = false;
      return nodes!;
    }
    c.forEach(child => {
      const c = nodes!.get(child)!;
      const oldPos = c.pos;
      const newPos = c.newPos!;
      const dx = oldPos.left - newPos.left;
      const dy = oldPos.top - newPos.top;
      if (dx || dy) {
        c.moved = true;
        const s = (child as HTMLElement | SVGElement).style;
        s.transform = `translate(${dx}px,${dy}px)`;
        s.transitionDuration = "0s";
      }
    });
    document.body.offsetHeight;
    c.forEach(child => {
      const c = nodes!.get(child)!;
      if (c.moved) {
        c.moved = false;
        const s = (child as HTMLElement | SVGElement).style;
        const { moveClasses } = classnames();
        child.classList.add(...moveClasses);
        s.transform = s.transitionDuration = "";
        function endTransition(e: TransitionEvent) {
          if ((e && e.target !== child) || !child.parentNode) return;
          if (!e || /transform$/.test(e.propertyName)) {
            (child as HTMLElement | SVGElement).removeEventListener(
              "transitionend",
              endTransition as EventListener
            );
            child.classList.remove(...moveClasses);
          }
        }
        (child as HTMLElement | SVGElement).addEventListener(
          "transitionend",
          endTransition as EventListener
        );
      }
    });
    return nodes!;
  }, new Map());

  return combined as unknown as JSX.Element;
};
