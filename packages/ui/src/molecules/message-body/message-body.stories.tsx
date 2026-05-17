import type { Meta, StoryObj } from "@storybook/react";
import { MessageBody } from "./message-body";

const meta: Meta<typeof MessageBody> = {
  title: "Molecules/MessageBody",
  component: MessageBody,
};

export default meta;
type Story = StoryObj<typeof MessageBody>;

const sample = `## How hybrid retrieval works

We run **vector** and **BM25** in parallel, then fuse them with reciprocal-rank fusion.

\`\`\`ts
const results = await hybridSearch({ query, topK: 10 });
\`\`\`

- Pinned citations carry the chunk SHA
- Per-tenant scoping is enforced at search time
- See [docs/config.md](#) for tuning

> Don't ship a vector DB until you've tried BM25.`;

export const Default: Story = {
  render: () => (
    <div className="max-w-[680px]">
      <MessageBody>{sample}</MessageBody>
    </div>
  ),
};
