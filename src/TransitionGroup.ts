import { createEffect, JSX, FlowComponent } from "solid-js";
import { createClassnames, enterTransition, exitTransition } from "./common";
import { createListTransition } from "@solid-primitives/transition-group";
import { resolveElements } from "@solid-primitives/refs";
import type { TransitionProps } from "./Transition";

function getRect(element: Element) {
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

/**
 * Props for the {@link TransitionGroup} component.
 */
export type TransitionGroupProps = Omit<TransitionProps, "mode"> & {
  /**
   * CSS class applied to the moving elements for the entire duration of the move transition.
   * Defaults to `"s-move"`.
   */
  moveClass?: string;
};

/**
 * The `<TransitionGroup>` component lets you apply enter and leave animations on elements passed to `props.children`.
 *
 * It supports transitioning multiple elements at a time and moving elements around.
 *
 * @param props {@link TransitionGroupProps}
 */
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

  type ElementInfo = {
    pos: ReturnType<typeof getRect>;
    newPos?: ReturnType<typeof getRect>;
    new?: boolean;
    moved?: boolean;
  };

  let first = !props.appear;
  const elementInfoMap = new Map<Element, ElementInfo>();

  createEffect(() => {
    const c = combined();

    c.forEach(el => {
      let info: ElementInfo | undefined;
      if (!(info = elementInfoMap.get(el))) {
        elementInfoMap.set(el, (info = { pos: getRect(el), new: !first }));
      } else if (info.new) {
        info.new = false;
        info.newPos = getRect(el);
      }
      if (info.new) {
        el.addEventListener(
          "transitionend",
          () => {
            info!.new = false;
            el.parentNode && (info!.newPos = getRect(el));
          },
          { once: true }
        );
      }
      info.newPos && (info.pos = info.newPos);
      info.newPos = getRect(el);
    });

    if (first) {
      first = false;
      return;
    }

    c.forEach(el => {
      const info = elementInfoMap.get(el)!;
      const oldPos = info.pos;
      const newPos = info.newPos!;
      const dx = oldPos.left - newPos.left;
      const dy = oldPos.top - newPos.top;
      if (dx || dy) {
        info.moved = true;
        const s = (el as HTMLElement | SVGElement).style;
        s.transform = `translate(${dx}px,${dy}px)`;
        s.transitionDuration = "0s";
      }
    });

    document.body.offsetHeight;

    c.forEach(el => {
      const info = elementInfoMap.get(el)!;
      if (info.moved) {
        info.moved = false;
        const s = (el as HTMLElement | SVGElement).style;
        const { moveClasses } = classnames();
        el.classList.add(...moveClasses);
        s.transform = s.transitionDuration = "";
        function endTransition(e: TransitionEvent) {
          if ((e && e.target !== el) || !el.parentNode) return;
          if (!e || /transform$/.test(e.propertyName)) {
            (el as HTMLElement | SVGElement).removeEventListener(
              "transitionend",
              endTransition as EventListener
            );
            el.classList.remove(...moveClasses);
          }
        }
        (el as HTMLElement | SVGElement).addEventListener(
          "transitionend",
          endTransition as EventListener
        );
      }
    });
  });

  return combined as unknown as JSX.Element;
};
