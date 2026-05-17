import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { Button } from "../../atoms/button";

const meta: Meta<typeof CommandPalette> = {
  title: "Organisms/CommandPalette",
  component: CommandPalette,
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
      window.addEventListener("keydown", (e) => {
        if (e.key === "k" && e.metaKey) {
          setOpen(true);
        }
      });

      return () => {
        window.removeEventListener("keydown", (e) => {
          if (e.key === "k" && e.metaKey) {
            setOpen(false);
          }
        });
      };
    }, [open]);

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open ⌘K</Button>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          hint={
            <>
              <span>↑↓ navigate · ↵ select · esc close</span>
              <span>v0.4.0</span>
            </>
          }
          items={[
            { id: "lib", group: "Navigate", label: "Library", shortcut: "G L" },
            { id: "src", group: "Navigate", label: "Sources", shortcut: "G S" },
            { id: "mcp", group: "Navigate", label: "MCP token", shortcut: "G M" },
            {
              id: "add",
              group: "Actions",
              label: "Connect source",
              description: "fs / pg / s3 / gh / gdrive",
              shortcut: "⌘N",
            },
            {
              id: "reindex",
              group: "Actions",
              label: "Re-index everything",
              shortcut: "⌘R",
            },
            {
              id: "theme",
              group: "Preferences",
              label: "Toggle theme",
              shortcut: "⌘.",
            },
          ]}
        />
      </div>
    );
  },
};
