/* Static site server: node serve.js <folder> <port> */
const http = require("http");
const fs = require("fs");
const path = require("path");

const dir = path.resolve(process.argv[2] || ".");
const port = parseInt(process.argv[3], 10) || 3000;
const mime = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json",
  ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json"
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.resolve(dir, "." + p);
  if (!file.toLowerCase().startsWith(dir.toLowerCase())) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("404 - not found"); return; }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => {
  console.log("serving " + dir + " at http://localhost:" + port);
});
