import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta<typeof Select> = {
  title: "Atoms/Select",
  component: Select,
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Select defaultValue="filesystem">
        <SelectTrigger>
          <SelectValue placeholder="Pick a connector" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="filesystem">filesystem</SelectItem>
          <SelectItem value="postgres">postgres</SelectItem>
          <SelectItem value="s3">s3</SelectItem>
          <SelectItem value="github">github</SelectItem>
          <SelectItem value="gdrive">gdrive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
