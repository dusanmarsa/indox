import type { Meta, StoryObj } from "@storybook/react";
import { StageShell } from "./stage-shell";
import { StatRow } from "../../molecules/stat-row";

const meta: Meta<typeof StageShell> = {
  title: "Organisms/StageShell",
  component: StageShell,
};

export default meta;
type Story = StoryObj<typeof StageShell>;

export const Default: Story = {
  render: () => (
    <div className="w-[960px]">
      <StageShell
        status={
          <>
            <span
              aria-hidden
              className="indox-pulse size-1.5 rounded-full bg-ok shadow-[0_0_10px_rgba(90,138,107,0.7)]"
            />
            running :8080
          </>
        }
        sidebar={
          <>
            <div className="mx-2 mt-1.5 mb-3 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
              Sources
            </div>
            <StatRow label="docs/" value="2,418" />
            <StatRow label="prod" value="3,901" />
            <StatRow label="s3://kb" value="1,753" />
            <StatRow label="gdrive" value="892" />
          </>
        }
      >
        <div className="flex flex-1 items-center justify-center text-ink-3">system-view canvas</div>
      </StageShell>
    </div>
  ),
};
