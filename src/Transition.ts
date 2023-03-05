import { Component, JSX, createMemo } from "solid-js";
import { nextFrame } from "./utils";
import { TransitionMode, createSwitchTransition } from "@solid-primitives/transition-group";
import { resolveFirst } from "@solid-primitives/refs";

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

const TransitionModeMap = new Map<TransitionProps["mode"], TransitionMode>([
  ["inout", "in-out"],
  ["outin", "out-in"],
  [undefined, "parallel"]
]);

export const Transition: Component<TransitionProps> = props => {
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;

  const classnames = createMemo(() => {
    const name = props.name || "s";
    return {
      enterActiveClass: (props.enterActiveClass || name + "-enter-active").split(" "),
      enterClass: (props.enterClass || name + "-enter").split(" "),
      enterToClass: (props.enterToClass || name + "-enter-to").split(" "),
      exitActiveClass: (props.exitActiveClass || name + "-exit-active").split(" "),
      exitClass: (props.exitClass || name + "-exit").split(" "),
      exitToClass: (props.exitToClass || name + "-exit-to").split(" ")
    };
  });

  return createSwitchTransition(
    resolveFirst(() => props.children),
    {
      mode: TransitionModeMap.get(props.mode),
      appear: props.appear,
      onEnter(el, done) {
        const { enterClass, enterActiveClass, enterToClass } = classnames();

        onBeforeEnter && onBeforeEnter(el);

        el.classList.add(...enterClass);
        el.classList.add(...enterActiveClass);
        nextFrame(() => {
          el.classList.remove(...enterClass);
          el.classList.add(...enterToClass);

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
            el.classList.remove(...enterActiveClass);
            el.classList.remove(...enterToClass);
            done();
            onAfterEnter && onAfterEnter(el);
          }
        }
      },
      onExit(el, done) {
        const { exitClass, exitActiveClass, exitToClass } = classnames();

        if (!el.parentNode) return endTransition();

        onBeforeExit && onBeforeExit(el);

        el.classList.add(...exitClass);
        el.classList.add(...exitActiveClass);
        nextFrame(() => {
          el.classList.remove(...exitClass);
          el.classList.add(...exitToClass);
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
            el.classList.remove(...exitActiveClass);
            el.classList.remove(...exitToClass);
            done();
            onAfterExit && onAfterExit(el);
          }
        }
      }
    }
  ) as unknown as JSX.Element;
};
