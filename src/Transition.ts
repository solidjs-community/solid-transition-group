import {
  createSignal,
  createComputed,
  untrack,
  batch,
  Component,
  children,
  JSX, createMemo
} from "solid-js";
import { nextFrame } from "./utils";

type TransitionProps = {
  name?: string;
  enterActiveClass?: string;
  enterClass?: string;
  enterToClass?: string;
  exitActiveClass?: string;
  exitClass?: string;
  exitToClass?: string;
  onBeforeEnter?: (el: Element) => void;
  onEnter?: (el: Element, done: () => void) => void;
  onAfterEnter?: (el: Element) => void;
  onBeforeExit?: (el: Element) => void;
  onExit?: (el: Element, done: () => void) => void;
  onAfterExit?: (el: Element) => void;
  children?: JSX.Element;
  appear?: boolean;
  mode?: "inout" | "outin";
};

export const Transition: Component<TransitionProps> = props => {
  let el: Element;
  let first = true;
  const [s1, set1] = createSignal<Element | undefined>();
  const [s2, set2] = createSignal<Element | undefined>();
  const resolved = children(() => props.children);

  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;

  const classnames = createMemo(() => {
    const name = props.name || "s";
    return {
      enterActiveClass: name + "-enter-active",
      enterClass: name + "-enter",
      enterToClass: name + "-enter-to",
      exitActiveClass: name + "-exit-active",
      exitClass: name + "-exit",
      exitToClass: name + "-exit-to",
    };
  });

  function enterTransition(el: Element, prev: Element | undefined) {
    if (!first || props.appear) {
      const enterClasses = classnames().enterClass!.split(" ");
      const enterActiveClasses = classnames().enterActiveClass!.split(" ");
      const enterToClasses = classnames().enterToClass!.split(" ");
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
          batch(() => {
            s1() !== el && set1(el);
            s2() === el && set2(undefined);
          });
          onAfterEnter && onAfterEnter(el);
          if (props.mode === "inout") exitTransition(el, prev!);
        }
      }
    }
    prev && !props.mode ? set2(el) : set1(el);
  }

  function exitTransition(el: Element, prev: Element) {
    const exitClasses = classnames().exitClass!.split(" ");
    const exitActiveClasses = classnames().exitActiveClass!.split(" ");
    const exitToClasses = classnames().exitToClass!.split(" ");
    if (!prev.parentNode) return endTransition();
    onBeforeExit && onBeforeExit(prev);
    prev.classList.add(...exitClasses);
    prev.classList.add(...exitActiveClasses);
    nextFrame(() => {
      prev.classList.remove(...exitClasses);
      prev.classList.add(...exitToClasses);
    });
    onExit && onExit(prev, () => endTransition());
    if (!onExit || onExit.length < 2) {
      prev.addEventListener("transitionend", endTransition);
      prev.addEventListener("animationend", endTransition);
    }

    function endTransition(e?: Event) {
      if (!e || e.target === prev) {
        prev.removeEventListener("transitionend", endTransition);
        prev.removeEventListener("animationend", endTransition);
        prev.classList.remove(...exitActiveClasses);
        prev.classList.remove(...exitToClasses);
        s1() === prev && set1(undefined);
        onAfterExit && onAfterExit(prev);
        if (props.mode === "outin") enterTransition(el, prev);
      }
    }
  }

  createComputed<Element>(prev => {
    el = resolved() as Element;
    while (typeof el === "function") el = (el as Function)();
    return untrack(() => {
      if (el && el !== prev) {
        if (props.mode !== "outin") enterTransition(el, prev);
        else if (first) set1(el);
      }
      if (prev && prev !== el && props.mode !== "inout") exitTransition(el, prev);
      first = false;
      return el;
    });
  });
  return [s1, s2];
};
