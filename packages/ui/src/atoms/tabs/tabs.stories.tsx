import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "Atoms/Tabs",
  component: Tabs,
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Tabs defaultValue="docs">
        <TabsList>
          <TabsTrigger value="docs">Docs</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
        </TabsList>
        <TabsContent value="docs">
          <p className="text-[14px] text-ink-2">312 documents indexed.</p>
        </TabsContent>
        <TabsContent value="sources">
          <p className="text-[14px] text-ink-2">5 connectors active.</p>
        </TabsContent>
        <TabsContent value="queries">
          <p className="text-[14px] text-ink-2">1.24M queries in the last 24h.</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};
