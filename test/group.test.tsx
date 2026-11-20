const rafQueue: VoidFunction[] = [];
(globalThis as any).requestAnimationFrame = (cb: VoidFunction) => {
  rafQueue.push(cb);
};
function flushRaf() {
  const queue = rafQueue.slice();
  rafQueue.length = 0;
  queue.forEach(cb => cb());
}

import { For, Show, createRoot, createSignal, flush } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Transition, TransitionGroup } from "../src/index.js";

const warn = vi.spyOn(console, "warn");
afterEach(() => {
  document.body.textContent = "";
  expect(warn).not.toHaveBeenCalled();
  warn.mockClear();
});

describe("Transition", () => {
  it("applies classes from a changed name and runs onAfterExit after removal", async () => {
    const [show, setShow] = createSignal(true);
    const [name, setName] = createSignal("a");
    const afterExit: [boolean, string][] = [];
    let container!: HTMLDivElement;

    const dispose = createRoot(dispose => {
      container = (
        <div>
          <Transition
            name={name()}
            onAfterExit={el => afterExit.push([el.isConnected, el.className])}
          >
            <Show when={show()}>
              <p>hello</p>
            </Show>
          </Transition>
        </div>
      ) as HTMLDivElement;
      document.body.appendChild(container);
      return dispose;
    });
    flush();
    const p = container.firstElementChild!;
    expect(p.className).toBe("");

    setName("b");
    setShow(false);
    flush();
    expect(p.className).toBe("b-exit b-exit-active");
    flushRaf();
    flushRaf();
    expect(p.className).toBe("b-exit-active b-exit-to");

    p.dispatchEvent(new Event("transitionend"));
    expect(afterExit).toEqual([]);
    await Promise.resolve();
    flush();
    expect(container.children).toHaveLength(0);
    expect(afterExit).toEqual([[false, ""]]);

    dispose();
  });

  it("runs the enter transition on appear", async () => {
    let container!: HTMLDivElement;
    const entered: boolean[] = [];
    const dispose = createRoot(dispose => {
      container = (
        <div>
          <Transition appear onEnter={(el, done) => (entered.push(el.isConnected), done())}>
            <p>hello</p>
          </Transition>
        </div>
      ) as HTMLDivElement;
      document.body.appendChild(container);
      return dispose;
    });
    flush();
    const p = container.firstElementChild!;
    expect(p.className).toBe("s-enter s-enter-active");
    await Promise.resolve();
    expect(entered).toEqual([true]);
    dispose();
  });
});

describe("TransitionGroup", () => {
  it("enters and exits list items", async () => {
    const [list, setList] = createSignal([1, 2, 3]);
    const afterExit: [string, boolean][] = [];
    let container!: HTMLDivElement;

    const dispose = createRoot(dispose => {
      container = (
        <div>
          <TransitionGroup
            name="g"
            onAfterExit={el => afterExit.push([el.textContent!, el.isConnected])}
          >
            <For each={list()}>{i => <p>{i}</p>}</For>
          </TransitionGroup>
        </div>
      ) as HTMLDivElement;
      document.body.appendChild(container);
      return dispose;
    });
    flush();
    const text = () => [...container.children].map(e => e.textContent);
    expect(text()).toEqual(["1", "2", "3"]);
    const [one, , three] = container.children;

    setList([1, 3, 4]);
    flush();
    expect(text()).toEqual(["1", "2", "3", "4"]);
    const [, two, , four] = container.children;
    // kept items are the same nodes, not re-rendered copies
    expect(container.children[0]).toBe(one);
    expect(container.children[2]).toBe(three);
    expect(two!.className).toBe("g-exit g-exit-active");
    expect(four!.className).toBe("g-enter g-enter-active");

    await Promise.resolve();
    flushRaf();
    flushRaf();
    expect(two!.className).toBe("g-exit-active g-exit-to");
    expect(four!.className).toBe("g-enter-active g-enter-to");

    two!.dispatchEvent(new Event("transitionend"));
    four!.dispatchEvent(new Event("transitionend"));
    expect(four!.className).toBe("");
    await Promise.resolve();
    flush();
    expect(text()).toEqual(["1", "3", "4"]);
    expect(afterExit).toEqual([["2", false]]);
    expect(two!.className).toBe("");

    dispose();
  });

  it("runs the enter transition on appear", () => {
    let container!: HTMLDivElement;
    const dispose = createRoot(dispose => {
      container = (
        <div>
          <TransitionGroup appear>
            <For each={[1, 2]}>{i => <p>{i}</p>}</For>
          </TransitionGroup>
        </div>
      ) as HTMLDivElement;
      document.body.appendChild(container);
      return dispose;
    });
    flush();
    expect([...container.children].map(e => e.className)).toEqual([
      "s-enter s-enter-active",
      "s-enter s-enter-active",
    ]);
    dispose();
  });
});
