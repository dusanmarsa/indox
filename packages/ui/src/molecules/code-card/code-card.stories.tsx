import type { Meta, StoryObj } from "@storybook/react";
import { CodeCard } from "./code-card";
import { Code } from "../../atoms/code";

const meta: Meta<typeof CodeCard> = {
  title: "Molecules/CodeCard",
  component: CodeCard,
};

export default meta;
type Story = StoryObj<typeof CodeCard>;

const snippet = `git clone https://github.com/dusanmarsa/indox.git
cd indox && bun install
cp .env.example .env
bun run db:migrate
bun run dev`;

export const Default: Story = {
  args: {
    title: "Quick start",
    copyValue: snippet,
    children: snippet,
  },
};

export const WithSyntax: Story = {
  render: () => (
    <div className="w-[480px]">
      <CodeCard title="env.example" copyValue="DATABASE_URL=…">
        <Code.Keyword>DATABASE_URL</Code.Keyword>=
        <Code.String>"postgres://user:pass@host/indox"</Code.String>
        {"\n"}
        <Code.Keyword>OPENAI_API_KEY</Code.Keyword>=<Code.String>"sk-…"</Code.String>
        {"\n"}
        <Code.Dim># Optional</Code.Dim>
        {"\n"}
        <Code.Keyword>INDOX_ALLOWED_EMAILS</Code.Keyword>=
        <Code.String>"you@example.com"</Code.String>
      </CodeCard>
    </div>
  ),
};
