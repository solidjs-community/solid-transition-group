import {
  children,
  createEffect,
  createMemo,
  createRenderEffect,
  type Accessor,
  type FlowComponent,
} from "solid-js";
import { isServer, type JSX } from "@solidjs/web";
import { createSwitchTransition, createListTransition } from "@solid-primitives/transition-group";

// on the server, elements are the objects with a `t` property produced by the SSR JSX transform
const isElement: (item: unknown) => item is Element = isServer
  ? (item): item is Element => item != null && typeof item === "object" && "t" in item
  : (item): item is Element => item instanceof Element;

function resolveElements(fn: Accessor<JSX.Element>): Accessor<Element[]> {
  const resolved = children(fn);
  return createMemo(() => resolved.toArray().filter(isElement));
}

type Classes = Record<
  "enterActive" | "enter" | "enterTo" | "exitActive" | "exit" | "exitTo" | "move",
  string[]
>;

/**
 * Keeps the latest class names in a plain variable. The transition callbacks run inside
 * the primitives' effect callbacks, where reading a memo would not be tracked.
 * This render effect is created before the primitive's, so it applies first in every flush.
 */
function createClassnames(props: TransitionProps & TransitionGroupProps): () => Classes {
  let classes: Classes;
  createRenderEffect(
    () => {
      const name = props.name || "s";
      return {
        enterActive: (props.enterActiveClass || name + "-enter-active").split(" "),
        enter: (props.enterClass || name + "-enter").split(" "),
        enterTo: (props.enterToClass || name + "-enter-to").split(" "),
        exitActive: (props.exitActiveClass || name + "-exit-active").split(" "),
        exit: (props.exitClass || name + "-exit").split(" "),
        exitTo: (props.exitToClass || name + "-exit-to").split(" "),
        move: (props.moveClass || name + "-move").split(" "),
      };
    },
    c => {
      classes = c;
    },
  );
  return () => classes;
}

/**
 * Removing an exited element from the DOM happens in the flush after `done()` is called.
 * This runs the after-exit steps once the rendered list has been committed to the DOM.
 */
function createAfterExit(rendered: Accessor<Element[]>) {
  const pending = new Map<Element, VoidFunction>();
  createEffect(rendered, list => {
    for (const [el, fn] of pending)
      if (!list.includes(el)) {
        pending.delete(el);
        fn();
      }
  });
  return (el: Element, fn: VoidFunction) => pending.set(el, fn);
}

// https://github.com/solidjs-community/solid-transition-group/issues/12
// for the css transition be triggered properly on firefox
// we need to wait for two frames before changeing classes
function nextFrame(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/**
 * Run an enter transition on an element - common for both Transition and TransitionGroup
 */
function enterTransition(
  classes: Classes,
  events: TransitionEvents,
  el: Element,
  done?: VoidFunction,
) {
  const { onBeforeEnter, onEnter, onAfterEnter } = events;

  // before the elements are added to the DOM
  onBeforeEnter?.(el);

  el.classList.add(...classes.enter);
  el.classList.add(...classes.enterActive);

  // after the microtask the elements will be added to the DOM
  // and onEnter will be called in the same frame
  queueMicrotask(() => {
    // Don't animate element if it's not in the DOM
    // This can happen when elements are changed under Suspense
    if (!el.parentNode) return done?.();

    onEnter?.(el, () => endTransition());
  });

  nextFrame(() => {
    el.classList.remove(...classes.enter);
    el.classList.add(...classes.enterTo);

    if (!onEnter || onEnter.length < 2) {
      el.addEventListener("transitionend", endTransition);
      el.addEventListener("animationend", endTransition);
    }
  });

  function endTransition(e?: Event) {
    if (!e || e.target === el) {
      done?.(); // starts exit transition in "in-out" mode
      el.removeEventListener("transitionend", endTransition);
      el.removeEventListener("animationend", endTransition);
      el.classList.remove(...classes.enterActive);
      el.classList.remove(...classes.enterTo);
      onAfterEnter?.(el);
    }
  }
}

/**
 * @private
 *
 * Run an exit transition on an element - common for both Transition and TransitionGroup
 */
export function exitTransition(
  classes: Classes,
  events: TransitionEvents,
  el: Element,
  done?: VoidFunction,
  afterExit: (el: Element, fn: VoidFunction) => void = (_, fn) => fn(),
) {
  const { onBeforeExit, onExit, onAfterExit } = events;

  // Don't animate element if it's not in the DOM
  // This can happen when elements are changed under Suspense
  if (!el.parentNode) return done?.();

  onBeforeExit?.(el);

  el.classList.add(...classes.exit);
  el.classList.add(...classes.exitActive);

  onExit?.(el, () => endTransition());

  nextFrame(() => {
    el.classList.remove(...classes.exit);
    el.classList.add(...classes.exitTo);

    if (!onExit || onExit.length < 2) {
      el.addEventListener("transitionend", endTransition);
      el.addEventListener("animationend", endTransition);
    }
  });

  function endTransition(e?: Event) {
    if (!e || e.target === el) {
      // calling done() will remove element from the DOM in the next flush,
      // but also trigger onChange callback in <TransitionGroup>.
      // Which is why the classes need to removed after the element is removed,
      // so that removing them won't change el styles when for the move transition
      done?.();
      el.removeEventListener("transitionend", endTransition);
      el.removeEventListener("animationend", endTransition);
      afterExit(el, () => {
        el.classList.remove(...classes.exitActive);
        el.classList.remove(...classes.exitTo);
        onAfterExit?.(el);
      });
    }
  }
}

export type TransitionEvents = {
  /**
   * Function called before the enter transition starts.
   * The {@link element} is not yet rendered.
   */
  onBeforeEnter?: (element: Element) => void;
  /**
   * Function called when the enter transition starts.
   * The {@link element} is rendered to the DOM.
   *
   * Call {@link done} to end the transition - removes the enter classes,
   * and calls {@link TransitionEvents.onAfterEnter}.
   * If the parameter for {@link done} is not provided, it will be called on `transitionend` or `animationend`.
   */
  onEnter?: (element: Element, done: () => void) => void;
  /**
   * Function called after the enter transition ends.
   * The {@link element} is removed from the DOM.
   */
  onAfterEnter?: (element: Element) => void;
  /**
   * Function called before the exit transition starts.
   * The {@link element} is still rendered, exit classes are not yet applied.
   */
  onBeforeExit?: (element: Element) => void;
  /**
   * Function called when the exit transition starts, after the exit classes are applied
   * ({@link TransitionProps.enterToClass} and {@link TransitionProps.exitActiveClass}).
   * The {@link element} is still rendered.
   *
   * Call {@link done} to end the transition - removes exit classes,
   * calls {@link TransitionEvents.onAfterExit} and removes the element from the DOM.
   * If the parameter for {@link done} is not provided, it will be called on `transitionend` or `animationend`.
   */
  onExit?: (element: Element, done: () => void) => void;
  /**
   * Function called after the exit transition ends.
   * The {@link element} is removed from the DOM.
   */
  onAfterExit?: (element: Element) => void;
};

/**
 * Props for the {@link Transition} component.
 */
export type TransitionProps = TransitionEvents & {
  /**
   * Used to automatically generate transition CSS class names.
   * e.g. `name: 'fade'` will auto expand to `.fade-enter`, `.fade-enter-active`, etc.
   * Defaults to `"s"`.
   */
  name?: string;
  /**
   * CSS class applied to the entering element for the entire duration of the enter transition.
   * Defaults to `"s-enter-active"`.
   */
  enterActiveClass?: string;
  /**
   * CSS class applied to the entering element at the start of the enter transition, and removed the frame after.
   * Defaults to `"s-enter"`.
   */
  enterClass?: string;
  /**
   * CSS class applied to the entering element after the enter transition starts.
   * Defaults to `"s-enter-to"`.
   */
  enterToClass?: string;
  /**
   * CSS class applied to the exiting element for the entire duration of the exit transition.
   * Defaults to `"s-exit-active"`.
   */
  exitActiveClass?: string;
  /**
   * CSS class applied to the exiting element at the start of the exit transition, and removed the frame after.
   * Defaults to `"s-exit"`.
   */
  exitClass?: string;
  /**
   * CSS class applied to the exiting element after the exit transition starts.
   * Defaults to `"s-exit-to"`.
   */
  exitToClass?: string;
  /**
   * Whether to apply transition on initial render. Defaults to `false`.
   */
  appear?: boolean;
  /**
   * Controls the timing sequence of leaving/entering transitions.
   * Available modes are `"outin"` and `"inout"`;
   * Defaults to simultaneous.
   */
  mode?: "inout" | "outin";
};

const TRANSITION_MODE_MAP = {
  inout: "in-out",
  outin: "out-in",
} as const;

/**
 * The `<Transition>` component lets you apply enter and leave animations on element passed to `props.children`.
 *
 * It only supports transitioning a single element at a time.
 *
 * @param props {@link TransitionProps}
 */
export const Transition: FlowComponent<TransitionProps> = props => {
  const classnames = createClassnames(props);
  const resolved = resolveElements(() => props.children);

  const rendered = createSwitchTransition(() => resolved()[0], {
    mode: TRANSITION_MODE_MAP[props.mode!],
    appear: props.appear,
    onEnter(el, done) {
      enterTransition(classnames(), props, el, done);
    },
    onExit(el, done) {
      exitTransition(classnames(), props, el, done, afterExit);
    },
  });
  const afterExit = createAfterExit(rendered);
  return rendered as unknown as JSX.Element;
};

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
  const resolved = resolveElements(() => props.children);

  const rendered = createListTransition(resolved, {
    appear: props.appear,
    exitMethod: "keep-index",
    onChange({ added, removed, finishRemoved, list }) {
      const classes = classnames();

      // ENTER
      for (const el of added) {
        enterTransition(classes, props, el);
      }

      // MOVE
      const toMove: { el: HTMLElement | SVGElement; rect: DOMRect }[] = [];
      // get rects of elements before the changes to the DOM
      for (const el of list) {
        if (el.isConnected && (el instanceof HTMLElement || el instanceof SVGElement)) {
          toMove.push({ el, rect: el.getBoundingClientRect() });
        }
      }

      // wait for th new list to be rendered
      queueMicrotask(() => {
        const moved: (HTMLElement | SVGElement)[] = [];

        for (const { el, rect } of toMove) {
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
          el.classList.add(...classes.move);

          // clear transition - els will move to their new position
          el.style.transform = el.style.transitionDuration = "";

          function endTransition(e: Event) {
            if (e.target === el || /transform$/.test((e as TransitionEvent).propertyName)) {
              el.removeEventListener("transitionend", endTransition);
              el.classList.remove(...classes.move);
            }
          }
          el.addEventListener("transitionend", endTransition);
        }
      });

      // EXIT
      for (const el of removed) {
        exitTransition(classes, props, el, () => finishRemoved([el]), afterExit);
      }
    },
  });
  const afterExit = createAfterExit(rendered);
  return rendered as unknown as JSX.Element;
};
