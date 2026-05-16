export const RRF_K = 60;

export type Ranked<Id, Meta> = {
  id: Id;
  // 1-based rank within the source retriever (rank 1 = top hit).
  rank: number;
  meta: Meta;
};

export type Fused<Id, Meta> = {
  id: Id;
  score: number;
  // How many input lists contained this id. Useful for debug + tie-breaking.
  hits: number;
  meta: Meta;
};

export function fuse<Id, Meta>(
  lists: Ranked<Id, Meta>[][],
  k: number = RRF_K,
): Fused<Id, Meta>[] {
  const acc = new Map<Id, Fused<Id, Meta>>();
  for (const list of lists) {
    for (const r of list) {
      const inc = 1 / (k + r.rank);
      const cur = acc.get(r.id);
      if (cur) {
        cur.score += inc;
        cur.hits += 1;
      } else {
        // First occurrence wins for meta — all retrievers should be returning
        // the same underlying chunk for a given id, so this is a no-op in
        // practice. The first-wins rule keeps fusion deterministic.
        acc.set(r.id, { id: r.id, score: inc, hits: 1, meta: r.meta });
      }
    }
  }
  return [...acc.values()].sort((a, b) => b.score - a.score);
}
