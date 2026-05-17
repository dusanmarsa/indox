"use client";

import { useState } from "react";
import { SegmentedControl } from "@indox/ui";

/**
 * Small client islands embedded in the (server) dashboard overview page —
 * keeps state local without forcing the whole page into a client component.
 */

export function FilterSegments() {
  const [v, setV] = useState<"all" | "indexed" | "syncing" | "failed">("all");
  return (
    <SegmentedControl
      value={v}
      onValueChange={setV}
      options={[
        { value: "all", label: "All" },
        { value: "indexed", label: "Indexed" },
        { value: "syncing", label: "Syncing" },
        { value: "failed", label: "Failed" },
      ]}
    />
  );
}

export function SortSegments() {
  const [v, setV] = useState<"recent" | "az" | "largest">("recent");
  return (
    <SegmentedControl
      value={v}
      onValueChange={setV}
      options={[
        { value: "recent", label: "Recent" },
        { value: "az", label: "A–Z" },
        { value: "largest", label: "Largest" },
      ]}
    />
  );
}
