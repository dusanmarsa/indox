import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { Button } from "../button";

const meta: Meta<typeof Toast> = {
  title: "Atoms/Toast",
  component: Toast,
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <ToastProvider swipeDirection="right">
        <Button
          onClick={() => {
            setOpen(false);
            setTimeout(() => setOpen(true), 0);
          }}
        >
          Trigger toast
        </Button>
        <Toast open={open} onOpenChange={setOpen} tone="ok">
          <div className="flex flex-col gap-1">
            <ToastTitle>Source connected</ToastTitle>
            <ToastDescription>docs/ is syncing — first index in ~30s.</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  },
};
