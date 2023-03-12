import { FlowComponent, JSX } from "solid-js";
import { createClassnames, nextFrame } from "./utils";
import { TransitionMode, createSwitchTransition } from "@solid-primitives/transition-group";
import { resolveFirst } from "@solid-primitives/refs";

export type TransitionProps = {
  /**
   * Used to automatically generate transition CSS class names.
   * e.g. `name: 'fade'` will auto expand to `.fade-enter`, `.fade-enter-active`, etc.
   * Defaults to `"s"`.
   */
  name?: string;
  /**
   * CSS class applied to the entering element for the entire duration of the enter transition.
   */
  enterActiveClass?: string;
  /**
   * CSS class applied to the entering element at the start of the enter transition, and removed the frame after.
   */
  enterClass?: string;
  /**
   * CSS class applied to the entering element after the enter transition starts.
   */
  enterToClass?: string;
  /**
   * CSS class applied to the exiting element for the entire duration of the exit transition.
   */
  exitActiveClass?: string;
  /**
   * CSS class applied to the exiting element at the start of the exit transition, and removed the frame after.
   */
  exitClass?: string;
  /**
   * CSS class applied to the exiting element after the exit transition starts.
   */
  exitToClass?: string;
  /**
   * Whether to apply transition on initial render. Defaults to `false`.
   */
  appear?: boolean;
  /**
   * Controls the timing sequence of leaving/entering transitions. Available modes are `"outin"` and `"inout"`;
   * Defaults to simultaneous.
   */
  mode?: "inout" | "outin";
  /**
   * Function called before the enter transition starts — before enter classes are applied.
   */
  onBeforeEnter?: (el: Element) => void;
  /**
   * Function called when the enter transition starts — after `enterToClass` class is applied.
   * Call `done` to end the transition - removes enter classes and calls `onAfterEnter`.
   */
  onEnter?: (el: Element, done: () => void) => void;
  /**
   * Function called after the enter transition ends — after all enter classes are removed.
   */
  onAfterEnter?: (el: Element) => void;
  /**
   * Function called before the exit transition starts — before exit classes are applied.
   */
  onBeforeExit?: (el: Element) => void;
  /**
   * Function called when the exit transition starts — after `exitToClass` class is applied.
   * Call `done` to end the transition - removes exit classes, calls `onAfterExit` and removes the element from the DOM.
   */
  onExit?: (el: Element, done: () => void) => void;
  /**
   * Function called after the exit transition ends — after all exit classes are removed.
   */
  onAfterExit?: (el: Element) => void;
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
