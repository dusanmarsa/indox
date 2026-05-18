import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "Atoms/Input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: "Type something…" } };
export const Disabled: Story = { args: { placeholder: "Disabled", disabled: true } };
export const Invalid: Story = { args: { placeholder: "Invalid", "aria-invalid": true } };

export const Password: Story = {
  args: { type: "password", revealable: true, defaultValue: "super-secret" },
};

export const Copyable: Story = {
  args: {
    copyable: true,
    readOnly: true,
    defaultValue: "ix_pub_a1b2c3d4e5f6_LIVE",
  },
};

export const PasswordCopyable: Story = {
  args: {
    type: "password",
    revealable: true,
    copyable: true,
    defaultValue: "sk-proj-1234abcd",
  },
};
