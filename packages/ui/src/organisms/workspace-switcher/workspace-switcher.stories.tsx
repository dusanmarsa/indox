import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Tag } from "../../atoms/tag";

const meta: Meta<typeof WorkspaceSwitcher> = {
  title: "Organisms/WorkspaceSwitcher",
  component: WorkspaceSwitcher,
};

export default meta;
type Story = StoryObj<typeof WorkspaceSwitcher>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState("prod");
    return (
      <WorkspaceSwitcher
        workspaces={[
          { id: "prod", name: "indox-prod", badge: <Tag tone="outline">live</Tag> },
          { id: "staging", name: "indox-staging" },
          { id: "demo", name: "indox-demo", badge: <Tag tone="docs">public</Tag> },
        ]}
        activeId={active}
        onSelect={setActive}
        onCreate={() => alert("create workspace")}
      />
    );
  },
};
