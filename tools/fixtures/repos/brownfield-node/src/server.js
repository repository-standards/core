import { createServer } from "node:http";
import { quote } from "./rates.js";

const port = Number(process.env.PORT ?? 4000);

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname !== "/quote") {
    res.writeHead(404).end();
    return;
  }
  try {
    const price = quote({
      base: Number(url.searchParams.get("base")),
      season: url.searchParams.get("season"),
      occupancy: Number(url.searchParams.get("occupancy") ?? 2),
    });
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ price }));
  } catch (error) {
    res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: error.message }));
  }
}).listen(port);
