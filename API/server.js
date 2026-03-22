const path = require("path");
const os = require("os");
const http = require("http");
const express = require("express");

const app = express();

const rootDir = path.join(__dirname, "..");

// Explicit index so "/" always resolves (belt-and-suspenders with static)
app.get("/", (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});

app.use(express.static(rootDir));

const PORT = Number(process.env.PORT) || 3000;

function getLanUrls(port) {
    const nets = os.networkInterfaces();
    const urls = [];
    for (const addrs of Object.values(nets)) {
        if (!addrs) continue;
        for (const a of addrs) {
            if (a.family === "IPv4" && !a.internal) {
                urls.push(`http://${a.address}:${port}`);
            }
        }
    }
    return urls;
}

function logUrls() {
    console.log(`Server running:`);
    console.log(`  IPv4:    http://127.0.0.1:${PORT}   (use this if localhost misbehaves)`);
    console.log(`  Local:   http://localhost:${PORT}`);
    const lan = getLanUrls(PORT);
    if (lan.length) {
        console.log(`  Network: ${lan.join("  |  ")}`);
    }
}

const server = http.createServer(app);

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Try: set PORT=3333 && npm start`);
    } else {
        console.error(err);
    }
    process.exit(1);
});

// "::" + ipv6Only: false = dual-stack on Windows/macOS/Linux so localhost (::1) hits this app,
// not some other listener that was only bound to IPv6 and returning 404.
server.listen(
    {
        port: PORT,
        host: "::",
        ipv6Only: false,
    },
    () => {
        logUrls();
    }
);

