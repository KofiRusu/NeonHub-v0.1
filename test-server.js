const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Server is working!' }));
});

const PORT = 8080;

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}/`);
}); 