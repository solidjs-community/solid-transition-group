import { describe, expect, it } from "vitest";
import { Transition } from "../src";
import { renderToString } from "solid-js/web";

describe("Transition", () => {
  it("returns elements in SSR", () => {
    const html = renderToString(() => (
      <Transition>
        <div>hello</div>
      </Transition>
    ));

    expect(html).toBe("<div>hello</div>");
  });
});
