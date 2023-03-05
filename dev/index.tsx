import { For, Match, Switch, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { Transition, TransitionGroup } from "../src";

function shuffle<T extends any[]>(array: T): T {
  return array.sort(() => Math.random() - 0.5);
}
let nextId = 10;

const App = () => {
  const [show, toggleShow] = createSignal(true),
    [select, setSelect] = createSignal(0),
    [numList, setNumList] = createSignal([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    randomIndex = () => Math.floor(Math.random() * numList().length);

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
        onBeforeEnter={el => {
          if (el instanceof HTMLElement) el.style.opacity = "0";
        }}
        onEnter={(el, done) => {
          const a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600 });
          a.finished.then(done);
        }}
        onAfterEnter={el => {
          if (el instanceof HTMLElement) el.style.opacity = "1";
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

render(() => <App />, document.getElementById("app")!);
