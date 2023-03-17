import { createMemo } from "solid-js";

// https://github.com/solidjs-community/solid-transition-group/issues/12
// for the css transition be triggered properly on firefox
// we need to wait for two frames before changeing classes
export function nextFrame(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function createClassnames(props: {
  name?: string;
  enterActiveClass?: string;
  enterClass?: string;
  enterToClass?: string;
  exitActiveClass?: string;
  exitClass?: string;
  exitToClass?: string;
  moveClass?: string;
}) {
  return createMemo(() => {
    const name = props.name || "s";
    return {
      enterActiveClasses: (props.enterActiveClass || name + "-enter-active").split(" "),
      enterClasses: (props.enterClass || name + "-enter").split(" "),
      enterToClasses: (props.enterToClass || name + "-enter-to").split(" "),
      exitActiveClasses: (props.exitActiveClass || name + "-exit-active").split(" "),
      exitClasses: (props.exitClass || name + "-exit").split(" "),
      exitToClasses: (props.exitToClass || name + "-exit-to").split(" "),
      moveClasses: (props.moveClass || name + "-move").split(" ")
    };
  });
}
