<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Transition%20Group&type=core" alt="Solid Transition Group">
</p>

# Solid Transition Group

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![version](https://img.shields.io/npm/v/solid-transition-group?style=for-the-badge)](https://www.npmjs.com/package/solid-transition-group)
[![downloads](https://img.shields.io/npm/dw/solid-transition-group?color=blue&style=for-the-badge)](https://www.npmjs.com/package/solid-transition-group)

Animation library influenced by React Transition Group and Vue Transitions for the SolidJS library.

Known limitation: Transition and Transition Group work on detecting changes on DOM children. Only supports single DOM child. Not Text or Fragments.

Animations aren't always smooth under rapid input still working on improving.

## Installation

```bash
# npm
npm install solid-transition-group
# yarn
yarn add solid-transition-group
# pnpm
pnpm add solid-transition-group
```

## Transition

### Props

All props besides `children` are optional.

Props for customizing the **timing** of the transition:

| Name     | Type                              | Description                                                                                                                          |
| -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `appear` | `boolean`                         | Whether to apply transition on initial render. Defaults to `false`.                                                                  |
| `mode`   | `"inout" \| "outin" \| undefined` | Controls the timing sequence of leaving/entering transitions. Available modes are `"outin"` and `"inout"`; defaults to simultaneous. |

**Events** proved by `<Transition>` for animating elements with JavaScript:

| Name            | Parameters                           | Description                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onBeforeEnter` | `element: Element`                   | Function called before the enter transition starts. The `element` is not yet rendered.                                                                                                                                                                                                                                                                                                |
| `onEnter`       | `element: Element, done: () => void` | Function called when the enter transition starts. The `element` is rendered to the DOM. Call `done` to end the transition - removes the enter classes, and calls `onAfterEnter`. If the parameter for `done` is not provided, it will be called on `transitionend` or `animationend`.                                                                                                 |
| `onAfterEnter`  | `element: Element`                   | Function called after the enter transition ends. The `element` is removed from the DOM.                                                                                                                                                                                                                                                                                               |
| `onBeforeExit`  | `element: Element`                   | Function called before the exit transition starts. The `element` is still rendered, exit classes are not yet applied.                                                                                                                                                                                                                                                                 |
| `onExit`        | `element: Element, done: () => void` | Function called when the exit transition starts, after the exit classes are applied (`enterToClass` and `exitActiveClass`). The `element` is still rendered. Call `done` to end the transition - removes exit classes, calls `onAfterExit` and removes the element from the DOM. If the parameter for `done` is not provided, it will be called on `transitionend` or `animationend`. |
| `onAfterExit`   | `element: Element`                   | Function called after the exit transition ends. The `element` is removed from the DOM.                                                                                                                                                                                                                                                                                                |

Props for customizing the CSS classes applied by `<Transition>`:

| Name               | Description                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | Used to automatically generate transition CSS class names. e.g. `name: 'fade'` will auto expand to `.fade-enter`, `.fade-enter-active`, etc. Defaults to `"s"`. |
| `enterClass`       | CSS class applied to the entering element at the start of the enter transition, and removed the frame after.                                                    |
| `enterToClass`     | CSS class applied to the entering element after the enter transition starts.                                                                                    |
| `enterActiveClass` | CSS class applied to the entering element for the entire duration of the enter transition.                                                                      |
| `exitClass`        | CSS class applied to the exiting element at the start of the exit transition, and removed the frame after.                                                      |
| `exitToClass`      | CSS class applied to the exiting element after the exit transition starts.                                                                                      |
| `exitActiveClass`  | CSS class applied to the exiting element for the entire duration of the exit transition.                                                                        |

### Usage

`<Transition>` serve as transition effects for single element/component. The `<Transition>` only applies the transition behavior to the wrapped content inside; it doesn't render an extra DOM element, or show up in the inspected component hierarchy.

```jsx
// simple CSS animation
<Transition name="slide-fade">{show() && <div>Hello</div>}</Transition>

// JS Animation
<Transition
  onEnter={(el, done) => {
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 600
    });
    a.finished.then(done);
  }}
  onExit={(el, done) => {
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 600
    });
    a.finished.then(done);
  }}
>
  {show() && <div>Hello</div>}
</Transition>
```

## TransitionGroup

### Props

- `moveClass` - CSS class applied to the moving elements for the entire duration of the move transition. Defaults to `"s-move"`.
- exposes the same props as `<Transition>` except `mode`.

### Usage

`<TransitionGroup>` serve as transition effects for multiple elements/components.

`<TransitionGroup>` supports moving transitions via CSS transform. When a child's position on screen has changed after an update, it will get applied a moving CSS class (auto generated from the name attribute or configured with the move-class attribute). If the CSS transform property is "transition-able" when the moving class is applied, the element will be smoothly animated to its destination using the FLIP technique.

```jsx
<ul>
  <TransitionGroup name="slide">
    <For each={state.items}>{item => <li>{item.text}</li>}</For>
  </TransitionGroup>
</ul>
```
