import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./form-field";
import { Input } from "../../atoms/input";
import { Textarea } from "../../atoms/textarea";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const WithHint: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Workspace name" hint="Used in API paths and logs" htmlFor="ws-name">
        <Input id="ws-name" placeholder="indox-prod" />
      </FormField>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-80">
      <FormField label="Workspace name" error="Alphanumeric and hyphens only" htmlFor="ws-name-err">
        <Input id="ws-name-err" aria-invalid defaultValue="invalid-name!" />
      </FormField>
    </div>
  ),
};

export const Textarea_: Story = {
  name: "Textarea",
  render: () => (
    <div className="w-80">
      <FormField label="Description" htmlFor="ws-desc">
        <Textarea id="ws-desc" placeholder="Describe this workspace…" />
      </FormField>
    </div>
  ),
};
