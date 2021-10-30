export function nextFrame(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}
