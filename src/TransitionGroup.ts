import { type JSX, type FlowComponent } from "solid-js";
import { createClassnames, enterTransition, exitTransition } from "./common";
import { createListTransition } from "@solid-primitives/transition-group";
import { resolveElements } from "@solid-primitives/refs";
import type { TransitionProps } from "./Transition";

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

  return createListTransition(resolveElements(() => props.children).toArray, {
    appear: props.appear,
    exitMethod: "keep-index",
    onChange({ added, removed, finishRemoved, unchanged, list }) {
      const classes = classnames();

      // ENTER
      for (const el of added) {
        enterTransition(classes, props, el);
      }

      // MOVE
      const elsToMove: { el: HTMLElement | SVGElement; rect: DOMRect }[] = [];
      // get rects of elements before the changes to the DOM
      for (const el of list) {
        if (el.isConnected && (el instanceof HTMLElement || el instanceof SVGElement)) {
          elsToMove.push({ el, rect: el.getBoundingClientRect() });
        }
      }

      // wait for changes to be rendered
      queueMicrotask(() => {
        const moved: (HTMLElement | SVGElement)[] = [];

        for (const { el, rect } of elsToMove) {
          if (el.isConnected) {
            const newRect = el.getBoundingClientRect(),
              dX = rect.left - newRect.left,
              dY = rect.top - newRect.top;
            if (dX || dY) {
              // set els to their old position before transition
              el.style.transform = `translate(${dX}px, ${dY}px)`;
              el.style.transitionDuration = "0s";
              moved.push(el);
            }
          }
        }

        document.body.offsetHeight; // force reflow

        for (const el of moved) {
          el.classList.add(...classes.moveClasses);

          // clear transition - els will move to their new position
          el.style.transform = el.style.transitionDuration = "";

          function endTransition(e: Event) {
            if (e.target === el || /transform$/.test((e as TransitionEvent).propertyName)) {
              el.removeEventListener("transitionend", endTransition);
              el.classList.remove(...classes.moveClasses);
            }
          }
          el.addEventListener("transitionend", endTransition);
        }
      });

      // EXIT
      for (const el of removed) {
        exitTransition(classes, props, el, () => finishRemoved([el]));
      }
    }
  }) as unknown as JSX.Element;
};
