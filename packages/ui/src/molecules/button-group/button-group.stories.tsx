import type { Meta, StoryObj } from "@storybook/react";
import { ButtonGroup } from "./button-group";
import { Button } from "../../atoms/button";

const meta: Meta<typeof ButtonGroup> = {
  title: "Primitives/ButtonGroup",
  component: ButtonGroup,
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="ghost">Left</Button>
      <Button variant="ghost">Middle</Button>
      <Button variant="ghost">Right</Button>
    </ButtonGroup>
  ),
};
