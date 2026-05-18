import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopNav } from "./top-nav";
import { Avatar } from "../../atoms/avatar";
import { SearchField } from "../../molecules/search-field";

const meta: Meta<typeof TopNav> = {
  title: "Organisms/TopNav",
  component: TopNav,
};

export default meta;
type Story = StoryObj<typeof TopNav>;

export const Default: Story = {
  render: () => {
    const [tab, setTab] = useState("library");
    return (
      <TopNav
        scope="workspace"
        activeTab={tab}
        onTabChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "library", label: "Library" },
          { value: "queries", label: "Queries" },
          { value: "evaluations", label: "Evaluations" },
          { value: "settings", label: "Settings" },
        ]}
        search={
          <SearchField containerClassName="min-w-[260px]" placeholder="Search" shortcut="⌘ K" />
        }
        right={<Avatar>M</Avatar>}
      />
    );
  },
};
