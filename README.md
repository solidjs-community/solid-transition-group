<p>
  <img width="100%" src="https://assets.solidjs.com/banner?project=Transition%20Group&type=core" alt="Solid Transition Group">
</p>

# Solid Transition Group

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![version](https://img.shields.io/npm/v/solid-transition-group?style=for-the-badge)](https://www.npmjs.com/package/solid-transition-group)
[![downloads](https://img.shields.io/npm/dw/solid-transition-group?color=blue&style=for-the-badge)](https://www.npmjs.com/package/solid-transition-group)

Components for applying animations when children elements enter or leave the DOM. Influenced by React Transition Group and Vue Transitions for the SolidJS library.

## Installation

```bash
npm install solid-transition-group
# or
yarn add solid-transition-group
# or
pnpm add solid-transition-group
```

## Transition

`<Transition>` serve as transition effects for single element/component. The `<Transition>` only applies the transition behavior to the wrapped content inside; it doesn't render an extra DOM element, or show up in the inspected component hierarchy.

All props besides `children` are optional.

### Using with CSS

Usage with CSS is straightforward. Just add the `name` prop and the CSS classes will be automatically generated for you. The `name` prop is used as a prefix for the generated CSS classes. For example, if you use `name="slide-fade"`, the generated CSS classes will be `.slide-fade-enter`, `.slide-fade-enter-active`, etc.

The exitting element will be removed from the DOM when the first transition ends. You can override this behavior by providing a `done` callback to the `onExit` prop.

```tsx
import { Transition } from "solid-transition-group"

const [isVisible, setVisible] = createSignal(true)

<Transition name="slide-fade">
  <Show when={isVisible()}>
    <div>Hello</div>
  </Show>
</Transition>

setVisible(false) // triggers exit transition
```

Example CSS transition:

```css
.slide-fade-enter-active,
.slide-fade-exit-active {
  transition: opacity 0.3s, transform 0.3s;
}
.slide-fade-enter,
.slide-fade-exit-to {
  transform: translateX(10px);
  opacity: 0;
}
.slide-fade-enter {
  transform: translateX(-10px);
}
```

Props for customizing the CSS classes applied by `<Transition>`:

| Name               | Description                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`             | Used to automatically generate transition CSS class names. e.g. `name: 'fade'` will auto expand to `.fade-enter`, `.fade-enter-active`, etc. Defaults to `"s"`. |
| `enterClass`       | CSS class applied to the entering element at the start of the enter transition, and removed the frame after. Defaults to `"s-enter"`.                           |
| `enterToClass`     | CSS class applied to the entering element after the enter transition starts. Defaults to `"s-enter-to"`.                                                        |
| `enterActiveClass` | CSS class applied to the entering element for the entire duration of the enter transition. Defaults to `"s-enter-active"`.                                      |
| `exitClass`        | CSS class applied to the exiting element at the start of the exit transition, and removed the frame after. Defaults to `"s-exit"`.                              |
| `exitToClass`      | CSS class applied to the exiting element after the exit transition starts. Defaults to `"s-exit-to"`.                                                           |
| `exitActiveClass`  | CSS class applied to the exiting element for the entire duration of the exit transition. Defaults to `"s-exit-active"`.                                         |

### Using with JavaScript

You can also use JavaScript to animate the transition. The `<Transition>` component provides several events that you can use to hook into the transition lifecycle. The `onEnter` and `onExit` events are called when the transition starts, and the `onBeforeEnter` and `onBeforeExit` events are called before the transition starts. The `onAfterEnter` and `onAfterExit` events are called after the transition ends.

```jsx
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

**Events** proved by `<Transition>` for animating elements with JavaScript:

| Name            | Parameters                           | Description                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onBeforeEnter` | `element: Element`                   | Function called before the enter transition starts. The `element` is not yet rendered.                                                                                                                                                                                                                                                                                                |
| `onEnter`       | `element: Element, done: () => void` | Function called when the enter transition starts. The `element` is rendered to the DOM. Call `done` to end the transition - removes the enter classes, and calls `onAfterEnter`. If the parameter for `done` is not provided, it will be called on `transitionend` or `animationend`.                                                                                                 |
| `onAfterEnter`  | `element: Element`                   | Function called after the enter transition ends. The `element` is removed from the DOM.                                                                                                                                                                                                                                                                                               |
| `onBeforeExit`  | `element: Element`                   | Function called before the exit transition starts. The `element` is still rendered, exit classes are not yet applied.                                                                                                                                                                                                                                                                 |
| `onExit`        | `element: Element, done: () => void` | Function called when the exit transition starts, after the exit classes are applied (`enterToClass` and `exitActiveClass`). The `element` is still rendered. Call `done` to end the transition - removes exit classes, calls `onAfterExit` and removes the element from the DOM. If the parameter for `done` is not provided, it will be called on `transitionend` or `animationend`. |
| `onAfterExit`   | `element: Element`                   | Function called after the exit transition ends. The `element` is removed from the DOM.                                                                                                                                                                                                                                                                                                |

### Changing Transition Mode

By default, `<Transition>` will apply the transition effect to both entering and exiting elements simultaneously. You can change this behavior by setting the `mode` prop to `"outin"` or `"inout"`. The `"outin"` mode will wait for the exiting element to finish before applying the transition to the entering element. The `"inout"` mode will wait for the entering element to finish before applying the transition to the exiting element.

By default the transition won't be applied on initial render. You can change this behavior by setting the `appear` prop to `true`.

> **Warning:** When using `appear` with SSR, the initial transition will be applied on the client-side, which might cause a flash of unstyled content.
> You need to handle applying the initial transition on the server-side yourself.

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

## Demo

Kitchen sink demo: https://solid-transition-group.netlify.app/

Source code: https://github.com/solidjs-community/solid-transition-group/blob/main/dev/src/pages/kitchen-sink.tsx

## FAQ

- **How to use with Portal?** - [Issue #8](https://github.com/solidjs-community/solid-transition-group/issues/8)
- **How to use with Outlet?** - [Issue #29](https://github.com/solidjs-community/solid-transition-group/issues/29)
- **Why elements are not connected in outin mode** - [Issue #34](https://github.com/solidjs-community/solid-transition-group/issues/34)
