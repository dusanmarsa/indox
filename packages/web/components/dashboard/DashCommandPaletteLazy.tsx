"use client";

import dynamic from "next/dynamic";
import type {
  CommandPaletteAdapter,
  CommandPaletteSource,
  CommandPaletteWorkspace,
} from "./DashCommandPalette";

const DashCommandPalette = dynamic(
  () => import("./DashCommandPalette").then((m) => m.DashCommandPalette),
  { ssr: false }
);

export function DashCommandPaletteLazy(props: {
  activeWorkspaceId: string;
  workspaces: CommandPaletteWorkspace[];
  sources: CommandPaletteSource[];
  adapters: CommandPaletteAdapter[];
}) {
  return <DashCommandPalette {...props} />;
}
