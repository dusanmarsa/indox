import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "./code-block";

const meta: Meta<typeof CodeBlock> = {
  title: "Molecules/CodeBlock",
  component: CodeBlock,
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

const snippet = `# Clone and boot
$ git clone https://github.com/dusanmarsa/indox.git
$ cd indox && bun install
$ cp .env.example .env  # fill in DATABASE_URL, OPENAI_API_KEY, …
$ bun run db:migrate
$ bun run dev`;

export const Default: Story = {
  args: {
    title: "indox.yaml",
    copyValue: snippet,
    children: snippet,
  },
};

export const NoCopy: Story = {
  args: { title: "preview", children: snippet },
};
