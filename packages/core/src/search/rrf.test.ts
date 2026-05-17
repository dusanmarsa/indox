import { test, expect } from "bun:test";
import { fuse, RRF_K } from "./rrf";

type R = { id: string; rank: number; meta: string };
const r = (id: string, rank: number, meta = id): R => ({ id, rank, meta });

test("single list preserves order and uses 1/(k+rank) scoring", () => {
  const out = fuse<string, string>([[r("a", 1), r("b", 2), r("c", 3)]]);
  expect(out.map((x) => x.id)).toEqual(["a", "b", "c"]);
  expect(out[0].score).toBeCloseTo(1 / (RRF_K + 1));
  expect(out[1].score).toBeCloseTo(1 / (RRF_K + 2));
  expect(out.every((x) => x.hits === 1)).toBe(true);
});

test("agreement across retrievers boosts shared chunks", () => {
  const out = fuse<string, string>([
    [r("a", 1), r("b", 2)],
    [r("a", 1), r("c", 2)],
  ]);
  expect(out[0].id).toBe("a");
  expect(out[0].hits).toBe(2);
  // a appears at rank 1 twice → score = 2/(k+1)
  expect(out[0].score).toBeCloseTo(2 / (RRF_K + 1));
  // b and c each appear once at rank 2
  expect(out.find((x) => x.id === "b")?.hits).toBe(1);
  expect(out.find((x) => x.id === "c")?.hits).toBe(1);
});

test("chunks unique to one retriever still appear", () => {
  const out = fuse<string, string>([[r("a", 1)], [r("b", 1)]]);
  expect(out).toHaveLength(2);
  // Same rank, single hit each → identical scores
  expect(out[0].score).toBeCloseTo(out[1].score);
});

test("higher rank in either retriever loses to lower rank elsewhere", () => {
  const out = fuse<string, string>([[r("a", 20)], [r("b", 1)]]);
  expect(out[0].id).toBe("b");
  expect(out[1].id).toBe("a");
});

test("meta is taken from first occurrence (deterministic)", () => {
  const out = fuse<string, string>([[r("x", 1, "first")], [r("x", 5, "second")]]);
  expect(out).toHaveLength(1);
  expect(out[0].meta).toBe("first");
  expect(out[0].hits).toBe(2);
});

test("empty input returns empty output", () => {
  expect(fuse<string, string>([])).toEqual([]);
  expect(fuse<string, string>([[], []])).toEqual([]);
});

test("k parameter controls how fast scores decay with rank", () => {
  const list = [r("a", 1), r("b", 10)];
  const sharp = fuse<string, string>([list], 1);
  const flat = fuse<string, string>([list], 1000);
  const sharpRatio = sharp[0].score / sharp[1].score;
  const flatRatio = flat[0].score / flat[1].score;
  // Lower k → bigger gap between rank 1 and rank 10.
  expect(sharpRatio).toBeGreaterThan(flatRatio);
});
