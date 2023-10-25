import { Component, For, createSignal } from "solid-js";
import { TransitionGroup } from "solid-transition-group";

function shuffle<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

const getRandomChar = () => ({ v: String.fromCharCode(65 + Math.floor(Math.random() * 26)) });

const Group: Component = () => {
  const [list, setList] = createSignal<{ v: string }[]>([
    { v: "S" },
    { v: "O" },
    { v: "L" },
    { v: "I" },
    { v: "D" },
    { v: "-" },
    { v: "T" },
    { v: "R" },
    { v: "A" },
    { v: "N" },
    { v: "S" },
    { v: "I" },
    { v: "T" },
    { v: "I" },
    { v: "O" },
    { v: "N" },
    { v: "-" },
    { v: "G" },
    { v: "R" },
    { v: "O" },
    { v: "U" },
    { v: "P" }
  ]);
  const randomIndex = () => Math.floor(Math.random() * list().length);

  return (
    <>
      <div class="flex gap-1">
        <button onClick={() => setList(p => shuffle([...p]))}>Shuffle</button>
        <button
          onClick={() => {
            const rand = randomIndex();
            setList(p => [...p.slice(0, rand), ...p.slice(rand + 2)]);
          }}
        >
          Remove
        </button>
        <button
          onClick={() => {
            const rand = randomIndex();
            setList(p => [
              ...p.slice(0, rand),
              getRandomChar(),
              getRandomChar(),
              getRandomChar(),
              ...p.slice(rand)
            ]);
          }}
        >
          Add
        </button>
      </div>
      <div class="mt-8 flex flex-wrap gap-1">
        <TransitionGroup name="group-item">
          <For each={list()}>
            {({ v }) => (
              <div class="group-item flex justify-center items-center w-5 h-6 bg-slate-700 rounded-sm">
                <span class="font-mono font-semibold">{v}</span>
              </div>
            )}
          </For>
        </TransitionGroup>
      </div>
    </>
  );
};

export default Group;
