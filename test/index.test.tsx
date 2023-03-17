// Flush animation frames manually
const rafQueue: VoidFunction[] = [];
(globalThis as any).requestAnimationFrame = (cb: VoidFunction) => {
  rafQueue.push(cb);
};
function flushRaf() {
  const queue = rafQueue.slice();
  rafQueue.length = 0;
  queue.forEach(cb => cb());
}

import { Show, createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Transition } from "../src";

describe("Transition", () => {
  it("matches the timing of vue out-in transition", async () => {
    const captured: [type: string, parentNode: boolean, classname: string][] = [];
    let runEnter!: VoidFunction;
    let runExit!: VoidFunction;

    function onBeforeEnter(el: Element) {
      captured.push(["before enter", el.parentNode !== null, el.className]);
      requestAnimationFrame(() => {
        captured.push(["1 frame", el.parentNode !== null, el.className]);
        requestAnimationFrame(() => {
          captured.push(["2 frame", el.parentNode !== null, el.className]);
          requestAnimationFrame(() => {
            captured.push(["3 frame", el.parentNode !== null, el.className]);
          });
        });
      });
    }
    function onEnter(el: Element, done: VoidFunction) {
      captured.push(["enter", el.parentNode !== null, el.className]);
      runEnter = done;
    }
    function onAfterEnter(el: Element) {
      captured.push(["after enter", el.parentNode !== null, el.className]);
    }
    function onBeforeExit(el: Element) {
      captured.push(["before exit", el.parentNode !== null, el.className]);
    }
    function onExit(el: Element, done: VoidFunction) {
      captured.push(["exit", el.parentNode !== null, el.className]);
      runExit = done;
    }
    function onAfterExit(el: Element) {
      captured.push(["after exit", el.parentNode !== null, el.className]);
    }

    const [page, setPage] = createSignal(1);

    const dispose = createRoot(dispose => {
      <div>
        <Transition
          mode="outin"
          onBeforeEnter={onBeforeEnter}
          onEnter={onEnter}
          onAfterEnter={onAfterEnter}
          onBeforeExit={onBeforeExit}
          onExit={onExit}
          onAfterExit={onAfterExit}
        >
          <Show when={page()} keyed>
            {i => <div>{i}</div>}
          </Show>
        </Transition>
      </div>;

      return dispose;
    });

    expect(captured).toHaveLength(0);

    setPage(2);

    flushRaf();
    flushRaf();

    runExit();

    // enter - await microtask
    await Promise.resolve();

    flushRaf();
    flushRaf();
    flushRaf();

    runEnter();

    expect(captured).toEqual([
      ["before exit", true, ""],
      ["exit", true, "s-exit s-exit-active"],
      ["before enter", false, ""],
      ["after exit", false, ""],
      ["enter", true, "s-enter s-enter-active"],
      ["1 frame", true, "s-enter s-enter-active"],
      ["2 frame", true, "s-enter s-enter-active"],
      ["3 frame", true, "s-enter-active s-enter-to"],
      ["after enter", true, ""]
    ]);

    dispose();
  });
});
