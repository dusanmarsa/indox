import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./alert";

const meta: Meta<typeof Alert> = {
  title: "Atoms/Alert",
  component: Alert,
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const AllTones: Story = {
  render: () => (
    <div className="flex w-[520px] flex-col gap-3">
      <Alert tone="info" title="MCP token rotated">
        Re-paste it into your client; the previous token stops working in 5 min.
      </Alert>
      <Alert tone="ok" title="Sync complete">
        2,418 chunks indexed across 312 documents.
      </Alert>
      <Alert tone="warn" title="Quota at 80%">
        You're approaching the embedding-call budget for this billing period.
      </Alert>
      <Alert tone="bad" title="Adapter failed">
        github://indox/indox — 403 from API. Check the PAT scope.
      </Alert>
    </div>
  ),
};
