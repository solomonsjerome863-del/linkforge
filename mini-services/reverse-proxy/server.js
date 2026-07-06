/**
 * Lightweight reverse proxy on port 8080.
 * Cloudflare supports this port for proxied HTTP traffic.
 * Forwards to Next.js dev server on port 3000.
 * Also handles XTransformPort routing for microservices.
 */

const http = require("node:http");

const NEXTJS_PORT = 3000;
const PORT = 8080;

process.on("uncaughtException", (err) => {
  console.error("[proxy] Uncaught exception:", err);
});

const server = http.createServer((clientReq, clientRes) => {
  try {
    const url = new URL(clientReq.url || "/", `http://localhost:${PORT}`);
    const transformPort = url.searchParams.get("XTransformPort");
    const targetPort = transformPort ? parseInt(transformPort, 10) : NEXTJS_PORT;

    // Build backend path (strip XTransformPort from query)
    const backendUrl = new URL(clientReq.url || "/", `http://localhost:${targetPort}`);
    if (transformPort) {
      backendUrl.searchParams.delete("XTransformPort");
    }

    const headers = { ...clientReq.headers };
    headers["host"] = `localhost:${targetPort}`;
    headers["x-forwarded-for"] = clientReq.socket.remoteAddress || "";
    headers["x-forwarded-proto"] = "https";
    headers["x-real-ip"] = clientReq.socket.remoteAddress || "";

    const proxyReq = http.request(
      {
        hostname: "127.0.0.1",
        port: targetPort,
        path: backendUrl.pathname + backendUrl.search,
        method: clientReq.method,
        headers,
      },
      (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(clientRes);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[proxy] Backend error:", err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { "Content-Type": "text/plain" });
      }
      clientRes.end("Bad Gateway");
    });

    clientReq.on("error", (err) => {
      console.error("[proxy] Client error:", err.message);
      proxyReq.destroy();
    });

    clientReq.pipe(proxyReq);
  } catch (err) {
    console.error("[proxy] Handler error:", err);
    if (!clientRes.headersSent) {
      clientRes.writeHead(500, { "Content-Type": "text/plain" });
    }
    clientRes.end("Internal Proxy Error");
  }
});

server.on("error", (err) => {
  console.error("[proxy] Server error:", err.message);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[proxy] Reverse proxy listening on 0.0.0.0:${PORT}`);
  console.log(`[proxy] Forwarding to Next.js on localhost:${NEXTJS_PORT}`);
  console.log(`[proxy] PID: ${process.pid}`);
});