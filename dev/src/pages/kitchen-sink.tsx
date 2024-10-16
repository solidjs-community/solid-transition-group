import { Component, For, Show, createSignal } from "solid-js";
import { Transition, TransitionGroup } from "solid-transition-group";

function shuffle<T extends any[]>(array: T): T {
  return array.sort(() => Math.random() - 0.5);
}

const getRandomColor = () => `#${((Math.random() * 2 ** 24) | 0).toString(16)}`;

const Group: Component = () => {
  const [list, setList] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  let nextId = 10;
  const randomIndex = () => Math.floor(Math.random() * list().length);

  return (
    <>
      <div class="flex gap-x-1">
        <button onClick={() => setList(p => shuffle([...p]))}>Shuffle</button>
        <button
          onClick={() => {
            const rand = randomIndex();
            setList(p => [...p.slice(0, rand), ...p.slice(rand + 1)]);
          }}
        >
          Remove
        </button>
        <button onClick={() => setList([])}>Remove All</button>
        <button
          onClick={() => {
            setList(
              shuffle(Array.from({ length: 50 }, (_, i) => i).filter(() => Math.random() > 0.5))
            );
          }}
        >
          Randomize
        </button>
        <button
          onClick={() => {
            const rand = randomIndex();
            setList(p => [...p.slice(0, rand), nextId++, ...p.slice(rand)]);
          }}
        >
          Add
        </button>
      </div>
      <div class="p-8 relative flex flex-wrap gap-0.5">
        <TransitionGroup name="group-item">
          <For each={list()} fallback={<div>fallback</div>}>
            {() => (
              <div class="group-item">
                <svg width="20" height="20" viewBox="0 0 4 4">
                  <rect
                    width={2.5 - Math.random()}
                    height={2.5 - Math.random()}
                    transform={`translate(0.5, 0.5) rotate(${Math.random() * 360} 1.5 1)`}
                    fill={getRandomColor()}
                  />
                </svg>
              </div>
            )}
          </For>
        </TransitionGroup>
      </div>
    </>
  );
};

const SwitchCSS: Component = () => {
  const [page, setPage] = createSignal(1);

  return (
    <>
      <button onClick={() => setPage(p => ++p)}>Next</button>
      <br />
      <Transition mode="outin" name="fade">
        <Show when={page()} keyed>
          {i => <div style={{ "background-color": getRandomColor(), padding: "1rem" }}>{i}.</div>}
        </Show>
      </Transition>
    </>
  );
};

const SwitchJS: Component = () => {
  const [page, setPage] = createSignal(1);

  function onEnter(el: Element, done: VoidFunction) {
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease" });
    a.finished.then(done);
  }
  function onExit(el: Element, done: VoidFunction) {
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease" });
    a.finished.then(done);
  }

  return (
    <>
      <button onClick={() => setPage(p => ++p)}>Next</button>
      <br />
      <Transition mode="outin" onEnter={onEnter} onExit={onExit}>
        <Show when={page()} keyed>
          {i => <div style={{ "background-color": getRandomColor(), padding: "1rem" }}>{i}.</div>}
        </Show>
      </Transition>
    </>
  );
};

const Collapse: Component = () => {
  const [show, toggleShow] = createSignal(true);

  const COLLAPSED_PROPERTIES = {
    height: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0
  };

  function getHeight(el: Element): string {
    const rect = el.getBoundingClientRect();
    return `${rect.height}px`;
  }

  function onEnter(el: Element, done: VoidFunction) {
    const a = el.animate(
      [
        COLLAPSED_PROPERTIES,
        {
          height: getHeight(el)
        }
      ],
      { duration: 500, easing: "ease" }
    );

    a.finished.then(done);
  }

  function onExit(el: Element, done: VoidFunction) {
    const a = el.animate(
      [
        {
          height: getHeight(el)
        },
        COLLAPSED_PROPERTIES
      ],
      { duration: 500, easing: "ease" }
    );

    a.finished.then(done);
  }

  return (
    <>
      <button onClick={() => toggleShow(!show())}>{show() ? "Hide" : "Show"}</button>
      <br />
      <Transition mode="outin" name="collapse" onEnter={onEnter} onExit={onExit}>
        <Show when={show()}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris facilisis enim libero,
            at lacinia diam fermentum id. Pellentesque habitant morbi tristique senectus et netus.
          </p>
        </Show>
      </Transition>
    </>
  );
};

const Example = () => {
  const [show, toggleShow] = createSignal(true);

  return (
    <>
      <button onClick={() => toggleShow(!show())}>{show() ? "Hide" : "Show"}</button>
      <br />
      <br />
      <b>Transition:</b>
      <Transition name="slide-fade">
        {show() && (
          <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris facilisis enim libero,
            at lacinia diam fermentum id. Pellentesque habitant morbi tristique senectus et netus.
          </div>
        )}
      </Transition>
      <br />
      <b>Animation:</b>
      <Transition name="bounce">
        {show() && (
          <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris facilisis enim libero,
            at lacinia diam fermentum id. Pellentesque habitant morbi tristique senectus et netus.
          </div>
        )}
      </Transition>
      <br />
      <b>Custom JS:</b>
      <Transition
        onEnter={(el, done) => {
          const a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
          a.finished.then(done);
        }}
        onExit={(el, done) => {
          const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
          a.finished.then(done);
        }}
      >
        {show() && (
          <div>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris facilisis enim libero,
            at lacinia diam fermentum id. Pellentesque habitant morbi tristique senectus et netus.
          </div>
        )}
      </Transition>
      <br />

      <b>Switch OutIn CSS</b>
      <br />
      <SwitchCSS />
      <br />

      <b>Switch OutIn JS</b>
      <br />
      <SwitchJS />
      <br />

      <b>Collapse OutIn CSS & JS</b>
      <br />
      <Collapse />
      <br />

      <b>Group</b>
      <br />
      <Group />
    </>
  );
};

export default Example;
