import { createEffect, JSX, FlowComponent } from "solid-js";
import { createClassnames, nextFrame } from "./utils";
import { createListTransition } from "@solid-primitives/transition-group";
import { resolveElements } from "@solid-primitives/refs";

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

  const parentRect = (element.parentNode! as Element).getBoundingClientRect();
  return {
    top: top - parentRect.top,
    bottom,
    left: left - parentRect.left,
    right,
    width,
    height
  };
}

export type TransitionGroupProps = {
  name?: string;
  enterActiveClass?: string;
  enterClass?: string;
  enterToClass?: string;
  exitActiveClass?: string;
  exitClass?: string;
  exitToClass?: string;
  moveClass?: string;
  onBeforeEnter?: (el: Element) => void;
  onEnter?: (el: Element, done: () => void) => void;
  onAfterEnter?: (el: Element) => void;
  onBeforeExit?: (el: Element) => void;
  onExit?: (el: Element, done: () => void) => void;
  onAfterExit?: (el: Element) => void;
  appear?: boolean;
};

export const TransitionGroup: FlowComponent<TransitionGroupProps> = props => {
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;

  const classnames = createClassnames(props);

  const combined = createListTransition(resolveElements(() => props.children).toArray, {
    appear: props.appear,
    exitMethod: "keep-index",
    onChange({ added, removed, finishRemoved }) {
      const {
        enterClasses,
        enterActiveClasses,
        enterToClasses,
        exitClasses,
        exitActiveClasses,
        exitToClasses
      } = classnames();

      for (const el of added) {
        onBeforeEnter && onBeforeEnter(el);
        el.classList.add(...enterClasses);
        el.classList.add(...enterActiveClasses);
        nextFrame(() => {
          el.classList.remove(...enterClasses);
          el.classList.add(...enterToClasses);
          onEnter && onEnter(el, () => endTransition());
          if (!onEnter || onEnter.length < 2) {
            el.addEventListener("transitionend", endTransition);
            el.addEventListener("animationend", endTransition);
          }
        });
        function endTransition(e?: Event) {
          if (el && (!e || e.target === el)) {
            el.removeEventListener("transitionend", endTransition);
            el.removeEventListener("animationend", endTransition);
            el.classList.remove(...enterActiveClasses);
            el.classList.remove(...enterToClasses);
            onAfterEnter && onAfterEnter(el);
          }
        }
      }

      for (const el of removed) {
        onBeforeExit && onBeforeExit(el);
        el.classList.add(...exitClasses);
        el.classList.add(...exitActiveClasses);
        nextFrame(() => {
          el.classList.remove(...exitClasses);
          el.classList.add(...exitToClasses);
        });
        onExit && onExit(el, () => endTransition());
        if (!onExit || onExit.length < 2) {
          el.addEventListener("transitionend", endTransition);
          el.addEventListener("animationend", endTransition);
        }

        function endTransition(e?: Event) {
          if (!e || e.target === el) {
            el.removeEventListener("transitionend", endTransition);
            el.removeEventListener("animationend", endTransition);
            el.classList.remove(...exitActiveClasses);
            el.classList.remove(...exitToClasses);
            onAfterExit && onAfterExit(el);
            finishRemoved([el]);
          }
        }
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
