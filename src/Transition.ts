import {
  createSignal,
  createMemo,
  createComputed,
  untrack,
  batch,
  mergeProps,
  Component
} from "solid-js";

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
  children?: any;
  appear?: boolean;
  mode?: "inout" | "outin";
};

export const Transition: Component<TransitionProps> = props => {
  let el: Element;
  let first = true;
  const [s1, set1] = createSignal<Element | undefined>();
  const [s2, set2] = createSignal<Element | undefined>();
  const children = createMemo(() => props.children),
    resolved = createMemo(() => {
      let c = children();
      while (typeof c === "function") c = c();
      return c;
    });
  const name = props.name || "s";
  props = mergeProps(
    {
      name,
      enterActiveClass: name + "-enter-active",
      enterClass: name + "-enter",
      enterToClass: name + "-enter-to",
      exitActiveClass: name + "-exit-active",
      exitClass: name + "-exit",
      exitToClass: name + "-exit-to"
    },
    props
  );
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;
  function enterTransition(el: Element, prev: Element | undefined) {
    if (!first || props.appear) {
      const enterClasses = props.enterClass!.split(" ");
      const enterActiveClasses = props.enterActiveClass!.split(" ");
      const enterToClasses = props.enterToClass!.split(" ");
      onBeforeEnter && onBeforeEnter(el);
      el.classList.add(...enterClasses);
      el.classList.add(...enterActiveClasses);
      setTimeout(() => {
        el.classList.remove(...enterClasses);
        el.classList.add(...enterToClasses);
        onEnter && onEnter(el, endTransition);
        if (!onEnter || onEnter.length < 2) {
          el.addEventListener("transitionend", endTransition, { once: true });
          el.addEventListener("animationend", endTransition, { once: true });
        }
      }, 0);

      function endTransition() {
        if (el) {
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
    const exitClasses = props.exitClass!.split(" ");
    const exitActiveClasses = props.exitActiveClass!.split(" ");
    const exitToClasses = props.exitToClass!.split(" ");
    if (!prev.parentNode) return endTransition();
    onBeforeExit && onBeforeExit(prev);
    prev.classList.add(...exitClasses);
    prev.classList.add(...exitActiveClasses);
    setTimeout(() => {
      prev.classList.remove(...exitClasses);
      prev.classList.add(...exitToClasses);
    }, 0);
    onExit && onExit(prev, endTransition);
    if (!onExit || onExit.length < 2) {
      prev.addEventListener("transitionend", endTransition, { once: true });
      prev.addEventListener("animationend", endTransition, { once: true });
    }

    function endTransition() {
      prev.classList.remove(...exitActiveClasses);
      prev.classList.remove(...exitToClasses);
      s1() === prev && set1(undefined);
      onAfterExit && onAfterExit(prev);
      if (props.mode === "outin") enterTransition(el, prev);
    }
  }

  createComputed<Element>(prev => {
    el = resolved();
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
