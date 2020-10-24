# Solid Transition Group

Animation library influenced by React Transition Group and Vue Transitions for the SolidJS library.

Known limitation: Transition and Transition Group work on detecting changes on DOM children. Only supports single DOM child. Not Text or Fragments.

Animations aren't always smooth under rapid input still working on improving.

## Transition

Props:
- name - string Used to automatically generate transition CSS class names. e.g. name: 'fade' will auto expand to .fade-enter, .fade-enter-active, etc.
- appear - boolean, Whether to apply transition on initial render. Defaults to false.
- mode - string Controls the timing sequence of leaving/entering transitions. Available modes are "out-in" and "in-out"; defaults to simultaneous.
- enterActiveClass?: string;
- enterClass?: string;
- enterToClass?: string;
- exitActiveClass?: string;
- exitClass?: string;
- exitToClass?: string;

Events:
- onBeforeEnter?: (el: Element) => void;
- onEnter?: (el: Element, done: () => void) => void;
- onAfterEnter?: (el: Element) => void;
- onBeforeExit?: (el: Element) => void;
- onExit?: (el: Element, done: () => void) => void;
- onAfterExit?: (el: Element) => void;

Usage:
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

# TransitionGroup

Props:

* moveClass - overwrite CSS class applied during moving transition.
* exposes the same props as `<Transition>` except mode, appear.

Events:
* exposes the same events as `<Transition>`.

Usage:
`<TransitionGroup>` serve as transition effects for multiple elements/components.

`<TransitionGroup>` supports moving transitions via CSS transform. When a child's position on screen has changed after an update, it will get applied a moving CSS class (auto generated from the name attribute or configured with the move-class attribute). If the CSS transform property is "transition-able" when the moving class is applied, the element will be smoothly animated to its destination using the FLIP technique.

```jsx
<ul>
  <TransitionGroup name="slide">
    <For each={state.items}>{
      item => <li>{item.text}</li>
    }</For>
  </TransitionGroup>
</ul>
```
