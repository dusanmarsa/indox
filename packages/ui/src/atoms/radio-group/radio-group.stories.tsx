import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "Atoms/RadioGroup",
  component: RadioGroup,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="cosine">
      {[
        { v: "cosine", l: "cosine similarity" },
        { v: "dot", l: "dot product" },
        { v: "euclidean", l: "euclidean" },
      ].map(({ v, l }) => (
        <label key={v} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
          <RadioGroupItem value={v} /> {l}
        </label>
      ))}
    </RadioGroup>
  ),
};
