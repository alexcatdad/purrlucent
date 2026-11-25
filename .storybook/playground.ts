import type { Decorator, StoryObj } from "@storybook/web-components-vite";
import { action } from "storybook/actions";
import { useEffect } from "storybook/preview-api";

type Value = string | number | boolean;

/** List only the inputs this story renders. The first option is the initial selection. */
export function playground(
  inputs: Record<string, Value | [Value, ...Value[]]>,
  events: string[] = [],
) {
  const args: Record<string, Value> = {};
  const argTypes: NonNullable<StoryObj["argTypes"]> = {};
  const include: string[] = [];
  for (const [key, input] of Object.entries(inputs)) {
    const name = key[0]!.toUpperCase() + key.slice(1).replace(/[A-Z]/g, " $&");
    include.push(name);
    if (Array.isArray(input)) {
      args[key] = input[0];
      argTypes[key] = { name, control: "select", options: input };
    } else {
      args[key] = input;
      argTypes[key] = {
        name,
        control:
          typeof input === "string"
            ? "text"
            : typeof input === "number"
              ? "number"
              : "boolean",
      };
    }
  }
  return {
    args,
    argTypes,
    decorators: events.length ? [logEvents(events)] : [],
    parameters: {
      controls: { disable: false, include },
    },
  };
}

function logEvents(events: string[]): Decorator {
  return (story, { canvasElement }) => {
    useEffect(() => {
      const controller = new AbortController();
      for (const name of events) {
        const log = action(name);
        canvasElement.addEventListener(
          name,
          (event: Event) => log((event as CustomEvent).detail),
          { signal: controller.signal },
        );
      }
      return () => controller.abort();
    }, [canvasElement]);
    return story();
  };
}
