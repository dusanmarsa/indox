import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SegmentedControl } from "./segmented-control";

const meta: Meta<typeof SegmentedControl> = {
  title: "Atoms/SegmentedControl",
  component: SegmentedControl,
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("recent");
    return (
      <SegmentedControl
        value={value}
        onValueChange={setValue}
        options={[
          { value: "recent", label: "Recent" },
          { value: "az", label: "A–Z" },
          { value: "largest", label: "Largest" },
        ]}
      />
    );
  },
};
