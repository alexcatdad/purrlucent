import { CodeOrSourceMdx, HeadersMdx } from "@storybook/addon-docs/blocks";

// Passing link overrides to Markdown replaces Storybook's code and heading renderers.
export const guideOptions = {
  overrides: {
    ...HeadersMdx,
    code: CodeOrSourceMdx,
    a: { props: { target: "_top" } },
  },
};
