import type { Meta, StoryObj } from "@storybook/react";
import { InputGroup, InputGroupInput, InputGroupAddon } from "./input-group";

const meta: Meta<typeof InputGroup> = {
  title: "Primitives/InputGroup",
  component: InputGroup,
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const WithAddon: Story = {
  render: () => (
    <InputGroup className="w-80">
      <InputGroupAddon>https://</InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
    </InputGroup>
  ),
};
