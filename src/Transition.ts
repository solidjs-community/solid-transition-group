import { FlowComponent, JSX } from "solid-js";
import { createClassnames, nextFrame } from "./utils";
import { createSwitchTransition } from "@solid-primitives/transition-group";
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

const TRANSITION_MODE_MAP = {
  inout: "in-out",
  outin: "out-in"
} as const;

export const Transition: FlowComponent<TransitionProps> = props => {
  const { onBeforeEnter, onEnter, onAfterEnter, onBeforeExit, onExit, onAfterExit } = props;

  const classnames = createClassnames(props);

  return createSwitchTransition(
    resolveFirst(() => props.children),
    {
      mode: TRANSITION_MODE_MAP[props.mode!],
      appear: props.appear,
      onEnter(el, done) {
        const { enterClasses, enterActiveClasses, enterToClasses } = classnames();

        // before the elements are added to the DOM
        onBeforeEnter && onBeforeEnter(el);

        el.classList.add(...enterClasses);
        el.classList.add(...enterActiveClasses);

        // after the microtask the elements will be added to the DOM
        // and onEnter will be called in the same frame
        queueMicrotask(() => {
          // Don't animate element if it's not in the DOM
          // This can happen when elements are changed under Suspense
          if (!el.parentNode) return done();

          onEnter && onEnter(el, () => endTransition());
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
            el.removeEventListener("transitionend", endTransition);
            el.removeEventListener("animationend", endTransition);
            el.classList.remove(...enterActiveClasses);
            el.classList.remove(...enterToClasses);
            done(); // starts exit transition in "in-out" mode
            onAfterEnter && onAfterEnter(el);
          }
        }
      },
      onExit(el, done) {
        const { exitClasses, exitActiveClasses, exitToClasses } = classnames();

        // Don't animate element if it's not in the DOM
        // This can happen when elements are changed under Suspense
        if (!el.parentNode) return done();

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
            done(); // removes element from DOM, starts enter transition in "out-in" mode
            onAfterExit && onAfterExit(el);
          }
        }
      }
    }
  ) as unknown as JSX.Element;
};
