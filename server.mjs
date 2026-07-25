import { createServer } from "http";
import { parse } from "url";
import next from "next";

const app = next({ dev: false, dir: "/home/z/my-project" });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
  res.setHeader("Connection", "close");
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
});

server.keepAliveTimeout = 0;
server.on("request", (req, res) => {
  const destroy = () => { try { req.socket.destroy(); } catch {} };
  res.on("finish", destroy);
  res.on("close", destroy);
});

server.listen(3000, "0.0.0.0", () => {
  console.log("> Custom server ready on http://0.0.0.0:3000");
});

process.on("unhandledRejection", (r) => console.error("Rejection:", r));
