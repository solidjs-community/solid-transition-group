import { FlowComponent, JSX } from "solid-js";
import { createClassnames, nextFrame } from "./utils";
import { TransitionMode, createSwitchTransition } from "@solid-primitives/transition-group";
import { resolveFirst } from "@solid-primitives/refs";

export type TransitionProps = {
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
  appear?: boolean;
  mode?: "inout" | "outin";
};

const TransitionModeMap = new Map<TransitionProps["mode"], TransitionMode>([
  ["inout", "in-out"],
  ["outin", "out-in"]
]);

export const Transition: FlowComponent<TransitionProps> = props => {
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;

  const classnames = createClassnames(props);

  return createSwitchTransition(
    resolveFirst(() => props.children),
    {
      mode: TransitionModeMap.get(props.mode),
      appear: props.appear,
      onEnter(el, done) {
        const { enterClasses, enterActiveClasses, enterToClasses } = classnames();

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
            done();
            onAfterEnter && onAfterEnter(el);
          }
        }
      },
      onExit(el, done) {
        const { exitClasses, exitActiveClasses, exitToClasses } = classnames();

        if (!el.parentNode) return endTransition();

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
            done();
            onAfterExit && onAfterExit(el);
          }
        }
      }
    }
  ) as unknown as JSX.Element;
};
