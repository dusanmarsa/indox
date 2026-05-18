import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./empty-state";
import { Button } from "../../atoms/button";

const meta: Meta<typeof EmptyState> = {
  title: "Molecules/EmptyState",
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: "No sources yet",
    description: "Connect a filesystem path, Postgres database, or S3 bucket to start indexing.",
    action: <Button>+ Connect source</Button>,
  },
};
