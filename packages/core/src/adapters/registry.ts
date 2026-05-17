import type { AdapterKind, AdapterDriver, AdapterScope } from "./types";
import { githubDriver } from "./github";
import { notionDriver } from "./notion";

const drivers: Record<AdapterKind, AdapterDriver<AdapterScope>> = {
  github: githubDriver as AdapterDriver<AdapterScope>,
  notion: notionDriver as AdapterDriver<AdapterScope>,
};

export function getDriver(kind: string): AdapterDriver<AdapterScope> {
  const driver = drivers[kind as AdapterKind];
  if (!driver) throw new Error(`unknown adapter kind: ${kind}`);
  return driver;
}

export function listAdapterKinds(): AdapterKind[] {
  return Object.keys(drivers) as AdapterKind[];
}
