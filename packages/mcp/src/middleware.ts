import type { Middleware } from "xmcp";
import type { Request, Response, NextFunction } from "express";

// Promote `?token=…` to a Bearer header so URL-only clients (Cursor's
// shorter config, curl tests) hit the same auth path as header-aware clients.

const middleware: Middleware = (req: Request, _res: Response, next: NextFunction) => {
  if (req.headers.authorization) return next();
  const token = typeof req.query?.token === "string" ? req.query.token : null;
  if (token) req.headers.authorization = `Bearer ${token}`;
  next();
};

export default middleware;
