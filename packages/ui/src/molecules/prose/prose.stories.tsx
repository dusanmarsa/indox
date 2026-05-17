import type { Meta, StoryObj } from "@storybook/react";
import { Prose } from "./prose";

const meta: Meta<typeof Prose> = {
  title: "Molecules/Prose",
  component: Prose,
};

export default meta;
type Story = StoryObj<typeof Prose>;

export const Default: Story = {
  render: () => (
    <Prose className="max-w-[640px]">
      <h2>Hybrid retrieval</h2>
      <p>
        Vector cosine and <code>BM25</code> run together, fused with{" "}
        <strong>reciprocal rank fusion</strong> and reranked by a cross-encoder.
      </p>
      <ul>
        <li>Pinned citations carry the chunk SHA.</li>
        <li>Per-tenant scoping is enforced at search-time.</li>
        <li>
          See <a href="#">docs/config.md</a> for tuning.
        </li>
      </ul>
      <blockquote>Don't ship a vector DB until you've tried BM25.</blockquote>
    </Prose>
  ),
};
