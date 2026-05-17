import type { Meta, StoryObj } from "@storybook/react";
import { Composer } from "./composer";
import { ComposerTool } from "../../molecules/composer-tool";

const meta: Meta<typeof Composer> = {
  title: "Organisms/Composer",
  component: Composer,
};

export default meta;
type Story = StoryObj<typeof Composer>;

export const Default: Story = {
  render: () => (
    <Composer
      placeholder="Ask anything about your sources…"
      onSubmit={(text, ids) => console.log("submit", { text, ids })}
      tools={
        <>
          <ComposerTool active showDot>
            All sources
          </ComposerTool>
          <ComposerTool>@mentions</ComposerTool>
          <ComposerTool>filters</ComposerTool>
        </>
      }
      hint={
        <>
          <span>↵ to send · ⇧↵ for newline</span>
          <span>gpt-4o-mini · 8 step cap</span>
        </>
      }
    />
  ),
};

export const WithMentions: Story = {
  render: () => (
    <Composer
      placeholder="ask anything — type @ to scope to a source"
      mentions={[
        { id: "1", label: "docs/", secondary: "filesystem" },
        { id: "2", label: "postgres", secondary: "postgres" },
        { id: "3", label: "s3://kb", secondary: "s3" },
        { id: "4", label: "gdrive", secondary: "gdrive" },
      ]}
      onSubmit={(text, ids) => console.log("submit", { text, ids })}
      hint={
        <>
          <span>type @ to mention a source</span>
          <span>↵ send · ⇧↵ newline</span>
        </>
      }
    />
  ),
};

export const Streaming: Story = {
  render: () => (
    <Composer
      placeholder="Ask anything about your sources…"
      isLoading
      onSubmit={() => {}}
      onStop={() => console.log("stop")}
      hint={
        <>
          <span>streaming…</span>
          <span>press send to stop</span>
        </>
      }
    />
  ),
};
