import { createMemo } from "solid-js";
import type { TransitionEvents, TransitionProps } from "./Transition";
import type { TransitionGroupProps } from "./TransitionGroup";

export function createClassnames(props: TransitionProps & TransitionGroupProps) {
  return createMemo(() => {
    const name = props.name || "s";
    return {
      enterActiveClasses: (props.enterActiveClass || name + "-enter-active").split(" "),
      enterClasses: (props.enterClass || name + "-enter").split(" "),
      enterToClasses: (props.enterToClass || name + "-enter-to").split(" "),
      exitActiveClasses: (props.exitActiveClass || name + "-exit-active").split(" "),
      exitClasses: (props.exitClass || name + "-exit").split(" "),
      exitToClasses: (props.exitToClass || name + "-exit-to").split(" "),
      moveClasses: (props.moveClass || name + "-move").split(" ")
    };
  });
}

// https://github.com/solidjs-community/solid-transition-group/issues/12
// for the css transition be triggered properly on firefox
// we need to wait for two frames before changeing classes
export function nextFrame(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/**
 * Run an enter transition on an element - common for both Transition and TransitionGroup
 */
export function enterTransition(
  classnames: ReturnType<ReturnType<typeof createClassnames>>,
  events: TransitionEvents,
  el: Element,
  done?: VoidFunction
) {
  const { enterClasses, enterActiveClasses, enterToClasses } = classnames,
    { onBeforeEnter, onEnter, onAfterEnter } = events;

  // before the elements are added to the DOM
  onBeforeEnter?.(el);

  el.classList.add(...enterClasses);
  el.classList.add(...enterActiveClasses);

  // after the microtask the elements will be added to the DOM
  // and onEnter will be called in the same frame
  queueMicrotask(() => {
    // Don't animate element if it's not in the DOM
    // This can happen when elements are changed under Suspense
    if (!el.parentNode) return done?.();

    onEnter?.(el, () => endTransition());
  });

  nextFrame(() => {
    el.classList.remove(...enterClasses);
    el.classList.add(...enterToClasses);

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
      el.classList.remove(...enterActiveClasses);
      el.classList.remove(...enterToClasses);
      onAfterEnter?.(el);
    }
  }
}

/**
 * Run an exit transition on an element - common for both Transition and TransitionGroup
 */
export function exitTransition(
  classnames: ReturnType<ReturnType<typeof createClassnames>>,
  events: TransitionEvents,
  el: Element,
  done?: VoidFunction
) {
  const { exitClasses, exitActiveClasses, exitToClasses } = classnames,
    { onBeforeExit, onExit, onAfterExit } = events;

  // Don't animate element if it's not in the DOM
  // This can happen when elements are changed under Suspense
  if (!el.parentNode) return done?.();

  onBeforeExit?.(el);

  el.classList.add(...exitClasses);
  el.classList.add(...exitActiveClasses);

  onExit?.(el, () => endTransition());

  nextFrame(() => {
    el.classList.remove(...exitClasses);
    el.classList.add(...exitToClasses);

    if (!onExit || onExit.length < 2) {
      el.addEventListener("transitionend", endTransition);
      el.addEventListener("animationend", endTransition);
    }
  });

  function endTransition(e?: Event) {
    if (!e || e.target === el) {
      // calling done() will remove element from the DOM,
      // but also trigger onChange callback in <TransitionGroup>.
      // Which is why the classes need to removed afterwards,
      // so that removing them won't change el styles when for the move transition
      done?.();
      el.removeEventListener("transitionend", endTransition);
      el.removeEventListener("animationend", endTransition);
      el.classList.remove(...exitActiveClasses);
      el.classList.remove(...exitToClasses);
      onAfterExit?.(el);
    }
  }
}
