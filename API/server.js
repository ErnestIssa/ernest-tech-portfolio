const path = require("path");
const os = require("os");
const http = require("http");
const express = require("express");
const nodemailer = require("nodemailer");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();

const rootDir = path.join(__dirname, "..");

const CONTACT_TO =
    process.env.CONTACT_TO_EMAIL || "ernestissa100@gmail.com";
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 8;
const rateBuckets = new Map();

function clientIp(req) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length) {
        return xff.split(",")[0].trim();
    }
    return req.socket?.remoteAddress || "unknown";
}

function allowContact(ip) {
    const now = Date.now();
    let b = rateBuckets.get(ip);
    if (!b || now - b.start > RATE_WINDOW_MS) {
        b = { start: now, count: 0 };
    }
    b.count += 1;
    rateBuckets.set(ip, b);
    return b.count <= RATE_MAX;
}

function sanitizeOneLine(str, maxLen) {
    if (typeof str !== "string") return "";
    return str
        .replace(/[\r\n\x00-\x1f\x7f]/g, " ")
        .trim()
        .slice(0, maxLen);
}

function isValidEmail(email) {
    if (typeof email !== "string" || email.length > 254) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

app.set("trust proxy", 1);

app.use(
    express.json({
        limit: "48kb",
    })
);

/** Confirms this process is the portfolio server (restart if POST /api/contact 404s). */
app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "ernest-tech-portfolio" });
});

app.get("/api/contact", (req, res) => {
    res.status(405)
        .set("Allow", "POST")
        .json({ ok: false, message: "Use POST with JSON body: name, email, message." });
});

app.post("/api/contact", async (req, res) => {
    const ip = clientIp(req);
    if (!allowContact(ip)) {
        return res.status(429).json({
            ok: false,
            error: "Too many requests. Please try again later.",
        });
    }

    const { name, email, message } = req.body || {};
    const cleanName = sanitizeOneLine(name, 120);
    const cleanEmail = typeof email === "string" ? email.trim().slice(0, 254) : "";
    const cleanMessage =
        typeof message === "string"
            ? message.replace(/\r\n/g, "\n").trim().slice(0, 10000)
            : "";

    if (!cleanName) {
        return res.status(400).json({ ok: false, error: "Name is required." });
    }
    if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ ok: false, error: "A valid email is required." });
    }
    if (!cleanMessage) {
        return res.status(400).json({ ok: false, error: "Message is required." });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
        console.error(
            "[contact] Missing SMTP_USER or SMTP_PASS. Copy .env.example to .env and configure."
        );
        return res.status(503).json({
            ok: false,
            error: "Contact form is not configured yet.",
        });
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const subject = cleanName;
    const textBody = [
        `New message from your portfolio contact form.`,
        ``,
        `Name: ${cleanName}`,
        `Email: ${cleanEmail}`,
        ``,
        `Message:`,
        cleanMessage,
    ].join("\n");

    const htmlBody = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
  <h2 style="margin:0 0 12px;">Portfolio contact</h2>
  <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
  <p style="margin:0 0 16px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(cleanEmail)}">${escapeHtml(cleanEmail)}</a></p>
  <p style="margin:0 0 6px;"><strong>Message</strong></p>
  <pre style="white-space:pre-wrap;margin:0;padding:12px;background:#f1f5f9;border-radius:8px;font-size:14px;">${escapeHtml(cleanMessage)}</pre>
</body></html>`;

    try {
        await transporter.sendMail({
            from: `"Portfolio" <${smtpUser}>`,
            to: CONTACT_TO,
            replyTo: cleanEmail,
            subject,
            text: textBody,
            html: htmlBody,
        });
        return res.json({ ok: true });
    } catch (err) {
        console.error("[contact] sendMail failed:", err.message);
        return res.status(502).json({
            ok: false,
            error: "Could not send your message. Please try again or email directly.",
        });
    }
});

function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

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
    console.log(`  Contact: POST http://localhost:${PORT}/api/contact   (health: GET .../api/health)`);
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
