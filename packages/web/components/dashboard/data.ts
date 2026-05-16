
export const LOG_LINES = [
  { time: "14:23:01.041", level: "info",  msg: "server",  detail: "addr=:8080 mode=production" },
  { time: "14:23:01.182", level: "info",  msg: "index",   detail: "sources=3 chunks=48372" },
  { time: "14:23:01.203", level: "debug", msg: "embed",   detail: "model=text-embedding-3-small dim=1536" },
  { time: "14:23:02.991", level: "info",  msg: "search",  detail: 'q="configure rate limiting" lat=31ms results=8' },
  { time: "14:23:03.011", level: "debug", msg: "hybrid",  detail: "bm25=0.3 vector=0.7 rerank=true" },
  { time: "14:23:04.512", level: "warn",  msg: "sync",    detail: "source=postgres://db elapsed=8124ms" },
  { time: "14:23:07.891", level: "info",  msg: "search",  detail: 'q="how does chunking work" lat=28ms results=6' },
  { time: "14:23:09.224", level: "debug", msg: "chunk",   detail: "size=512 overlap=64 strategy=sentence" },
  { time: "14:23:11.003", level: "info",  msg: "search",  detail: 'q="pgvector HNSW settings" lat=45ms results=5' },
  { time: "14:23:12.445", level: "debug", msg: "embed",   detail: "tokens=892 model=text-embedding-3-small" },
  { time: "14:23:14.001", level: "info",  msg: "sync",    detail: "source=github chunks_new=12 elapsed=2100ms" },
  { time: "14:23:15.882", level: "debug", msg: "rerank",  detail: "candidates=20 returned=5 lat=8ms" },
  { time: "14:23:18.114", level: "info",  msg: "search",  detail: 'q="embed_model options" lat=22ms results=4' },
  { time: "14:23:20.003", level: "debug", msg: "bm25",    detail: "terms=3 hits=14 weight=0.3" },
  { time: "14:23:22.771", level: "info",  msg: "search",  detail: 'q="search strategy hybrid" lat=38ms results=7' },
];
