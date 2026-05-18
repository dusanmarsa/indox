import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "../button";

const meta: Meta<typeof Card> = {
  title: "Primitives/Card",
  component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Manage settings and members.</CardDescription>
      </CardHeader>
      <CardContent>Some content goes in here.</CardContent>
      <CardFooter>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};
