import { Component, For, Match, Show, Switch, createSignal } from "solid-js";
import { Transition, TransitionGroup } from "../src";

function shuffle<T extends any[]>(array: T): T {
  return array.sort(() => Math.random() - 0.5);
}

const Group: Component = () => {
  const [numList, setNumList] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    randomIndex = () => Math.floor(Math.random() * numList().length);

  let nextId = 10;

  return (
    <>
      <button
        onClick={() => {
          const list = numList(),
            idx = randomIndex();
          setNumList([...list.slice(0, idx), nextId++, ...list.slice(idx)]);
        }}
      >
        Add
      </button>
      <button
        onClick={() => {
          const list = numList(),
            idx = randomIndex();
          setNumList([...list.slice(0, idx), ...list.slice(idx + 1)]);
        }}
      >
        Remove
      </button>
      <button
        onClick={() => {
          const randomList = shuffle(numList().slice());
          setNumList(randomList);
        }}
      >
        Shuffle
      </button>
      <br />
      <TransitionGroup name="list-item" appear>
        <For each={numList()}>{r => <span class="list-item">{r}</span>}</For>
      </TransitionGroup>
    </>
  );
};

const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;

const Colors: Component = () => {
  const [page, setPage] = createSignal(1);

  function onEnter(el: Element, done: VoidFunction) {
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 800
    });
    a.finished.then(done);
  }
  function onExit(el: Element, done: VoidFunction) {
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 800
    });
    a.finished.then(done);
  }

  return (
    <>
      <button onClick={() => setPage(p => ++p)}>Next</button>
      <Transition mode="outin" onEnter={onEnter} onExit={onExit}>
        <Show when={page()} keyed>
          {i => <div style={{ "background-color": getRandomColor(), padding: "2rem" }}>{i}.</div>}
        </Show>
      </Transition>
    </>
  );
};

const App = () => {
  const [show, toggleShow] = createSignal(true),
    [select, setSelect] = createSignal(0);

  return (
    <>
      <button onClick={() => toggleShow(!show())}>{show() ? "Hide" : "Show"}</button>
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

      <b>Switch OutIn</b>
      <br />
      <button onClick={() => setSelect((select() + 1) % 3)}>Next</button>
      <Transition name="fade" mode="outin">
        <Switch>
          <Match when={select() === 0}>
            <p class="container">The First</p>
          </Match>
          <Match when={select() === 1}>
            <p class="container">The Second</p>
          </Match>
          <Match when={select() === 2}>
            <p class="container">The Third</p>
          </Match>
        </Switch>
      </Transition>

      <b>Group</b>
      <br />
      <Group />
      <br />
      <br />

      <b>Colors</b>
      <br />
      <Colors />
    </>
  );
};

export default App;
