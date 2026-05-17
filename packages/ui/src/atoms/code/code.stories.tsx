import type { Meta, StoryObj } from "@storybook/react";
import { Code } from "./code";

const meta: Meta = {
  title: "Atoms/Code",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <pre className="rounded-md border border-border bg-elev p-5 font-mono text-[12.5px] leading-[1.85] text-ink">
      <Code.Dim># Clone and boot</Code.Dim>
      {"\n"}
      <Code.Accent>$</Code.Accent> git clone{" "}
      <Code.String>"https://github.com/dusanmarsa/indox.git"</Code.String>
      {"\n"}
      <Code.Accent>$</Code.Accent> cd indox <Code.Muted>&&</Code.Muted> bun install
      {"\n"}
      <Code.Keyword>export</Code.Keyword> DATABASE_URL=<Code.String>"postgres://…"</Code.String>
      {"\n"}
      <Code.Accent>$</Code.Accent> bun run dev <Code.Ok># ready on :3000</Code.Ok>
    </pre>
  ),
};
