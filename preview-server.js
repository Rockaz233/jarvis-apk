/**
 * Jarvis Local Preview Server
 * Zero-dependency Node.js HTTP server to preview Jarvis UI in phone browser
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const WEB_DIR = path.join(__dirname, 'app', 'src', 'main', 'assets', 'web');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/index.html';

    const filePath = path.join(WEB_DIR, reqUrl);

    // Prevent directory traversal
    if (!filePath.startsWith(WEB_DIR)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 J.A.R.V.I.S. Local Preview Server is ONLINE!`);
    console.log(`📍 Open in your browser: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
