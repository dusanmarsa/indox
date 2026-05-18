import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Tag } from "../tag";

const meta: Meta<typeof Table> = {
  title: "Atoms/Table",
  component: Table,
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <div className="w-[760px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Chunks</TableHead>
            <TableHead className="text-right">Last sync</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { src: "docs/", type: "docs", chunks: 2418, when: "2 min ago" },
            { src: "prod", type: "pg", chunks: 3901, when: "6 min ago" },
            { src: "knowledge-base", type: "s3", chunks: 1753, when: "syncing" },
          ].map((r) => (
            <TableRow key={r.src}>
              <TableCell className="font-mono">{r.src}</TableCell>
              <TableCell>
                <Tag tone={r.type as "docs" | "pg" | "s3"}>{r.type}</Tag>
              </TableCell>
              <TableCell className="text-right font-mono">{r.chunks}</TableCell>
              <TableCell className="text-right font-mono text-[12px] text-ink-3">
                {r.when}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
