import type { Meta, StoryObj } from "@storybook/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta: Meta<typeof Accordion> = {
  title: "Atoms/Accordion",
  component: Accordion,
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <div className="w-[520px]">
      <Accordion type="single" collapsible defaultValue="hybrid">
        <AccordionItem value="hybrid">
          <AccordionTrigger>How does hybrid retrieval work?</AccordionTrigger>
          <AccordionContent>
            Vector similarity and BM25 run in parallel, then results are merged with reciprocal-rank
            fusion and reranked by a cross-encoder.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="self-host">
          <AccordionTrigger>Can I run it offline?</AccordionTrigger>
          <AccordionContent>
            Yes — swap the OpenAI adapter for a local model. Embeddings stay in your Postgres.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
