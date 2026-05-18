import type { Preview } from "@storybook/react";
import "../src/styles/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#08090b" },
        { name: "light", value: "#ffffff" },
      ],
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  decorators: [
    (Story, ctx) => {
      if (typeof document !== "undefined") {
        const isDark = ctx.globals.backgrounds?.value !== "#ffffff";
        document.documentElement.classList.toggle("dark", isDark);
      }
      return Story();
    },
  ],
};

export default preview;
