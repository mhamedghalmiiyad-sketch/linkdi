import fs from "fs";
import path from "path";
import os from "os";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import nodemailer from "nodemailer"; 
import express from "express"; // 🌍 NEW: Added Express for Render

// --- 🌍 RENDER DUMMY WEB SERVER ---
// Render requires a Web Service to bind to a PORT, or it will crash the app.
const app = express();
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => res.send("🤖 WORM-AI LinkedIn Bot is running smoothly!"));
app.listen(PORT, () => {
    console.log(`[${getTimestamp()}] 🌍 Dummy Web Server started on port ${PORT}`);
});

puppeteer.use(StealthPlugin());

// --- 1. AUTO-LOAD .ENV FILE ---
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf-8');
            content.split('\n').forEach(line => {
                const cleanLine = line.trim();
                if (!cleanLine || cleanLine.startsWith('#')) return;
                const [key, ...parts] = cleanLine.split('=');
                if (key) {
                    const val = parts.join('=').trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key.trim()]) process.env[key.trim()] = val;
                }
            });
        }
    } catch (e) {}
}
loadEnv(); 

// --- 💀 CONFIGURATION ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8208284802:AAFZz3Zn3JmChwYto3u2du-wO9IxTHKAQbc";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "@jobscrapredz"; 
const COOKIE_FILE = "linkedin_cookies.txt"; 
const SEEN_FILE = "seen_linkedin.json"; 
const STATS_FILE = "bot_stats.json"; 
const EMAIL = "ghalmimiyad@gmail.com";
const PASSWORD = "aezakmixu";

// --- 🧠 AI API CONFIG ---
const AI_API_URL = process.env.AI_API_URL || "https://linkedin-ai-api-ohjr.onrender.com/chat"; 
const AI_API_KEY = "20262025"; 

// --- 🎯 PRO-LEVEL KEYWORD STRATEGY ---
const KEYWORDS = {
    field: [
        "automation", "automatisme", "plc", "siemens", "tia portal", "scada", "hmi", 
        "maintenance industrielle", "electrique", "électrique", "electrical", "electricity", "electricité",
        "instrumentation", "commissioning", "ingénieur automatique", "technicien maintenance",
        "gmao", "électrotechnique", "instrumentiste", "solaire", "photovoltaïque", 
        "schneider", "allen bradley", "simatic", "wincc"
    ],
    context: [
        "we are hiring", "hiring now", "job opening", "job opportunity", "career opportunity", 
        "vacancy", "open position", "now recruiting", "join our team", "urgently hiring", "immediate hiring",
        "apply now", "submit your cv", "send your resume", "resume required", "cv required", "job application",
        "nous recrutons", "recrutement", "offre d'emploi", "opportunité d'emploi", "poste à pourvoir", 
        "avis de recrutement", "recherche profil", "recherche candidat", "rejoignez notre équipe", 
        "embauche immédiate", "envoyez votre cv", "merci d'envoyer votre cv", "candidature", 
        "déposer votre candidature", "postulez maintenant", "cv exigé", "expérience exigée", "cdi", "cdd",
        "توظيف", "نبحث عن", "مطلوب", "فرصة عمل", "عرض عمل", "منصب شاغر", "إعلان توظيف", 
        "أرسل سيرتك الذاتية", "يرجى إرسال cv", "قدم الآن", "تقديم طلب", "السيرة الذاتية",
        "rana nrecrutiw", "rana nlawjou", "kayen poste", "poste vacant", "sifti cv", 
        "dir candidature", "stage disponible"
    ],
    blacklist: [
        "j'ai le plaisir", "heureux de vous annoncer", "j'occupe désormais", "nouvelle aventure", 
        "nouveau poste", "starting a new position", "happy to share", "thrilled to announce", 
        "j'ai rejoint", "promotion", "promu", "certificat", "certification", "j'ai l'honneur",
        "diplôme", "graduated", "proud to share", "i am excited",
        "sales", "commercial", "rh", "ressources humaines", "finance", "comptable", 
        "marketing", "stagiaire rh", "assistant", "administratif", "graphic", "designer"
    ]
};

// --- 🛠️ UTILS ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// 🕒 TIME FORMATTER
function getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// 📂 STATE MANAGEMENT
let seenHistory = new Set();
if (fs.existsSync(SEEN_FILE)) {
    try { seenHistory = new Set(JSON.parse(fs.readFileSync(SEEN_FILE))); } catch(e) {}
}
function saveHistory() { fs.writeFileSync(SEEN_FILE, JSON.stringify([...seenHistory])); }

// 📊 STATS TRACKER
let botStats = { totalScanned: 0, matchedJobs: 0, emailsSent: 0, jobsLog: [] };
if (fs.existsSync(STATS_FILE)) {
    try { botStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8')); } catch(e) {}
}
function saveStats() {
    botStats.lastUpdate = getTimestamp();
    if (botStats.jobsLog.length > 100) botStats.jobsLog.shift();
    fs.writeFileSync(STATS_FILE, JSON.stringify(botStats, null, 2));
}

function printResources() {
    const mem = process.memoryUsage();
    const ramMB = (mem.rss / 1024 / 1024).toFixed(2);
    console.log(`[${getTimestamp()}] 💻 [SYSTEM] Node RAM: ${ramMB} MB | Unique Posts Scanned: ${botStats.totalScanned}`);
}

async function sendResumeEmail(targetEmail, jobTitle, emailBody) {
    if (!process.env.GMAIL_APP_PASSWORD) {
        console.error(`[${getTimestamp()}] ❌ [Email] GMAIL_APP_PASSWORD missing in .env file!`);
        return false;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
    });

    const subjectLine = `Candidature - ${jobTitle} - GHALMI Mohamed Ayad +213 540 17 83 42 LinkedIn`;

    const mailOptions = {
        from: `"GHALMI Mohamed Ayad" <${EMAIL}>`,
        to: targetEmail,
        subject: subjectLine,
        text: emailBody,
        attachments: [{ filename: 'CV_Ghalmi_Mohamed_Ayad.pdf', path: './CV_Ghalmi_Mohamed_Ayad.pdf' }]
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`[${getTimestamp()}] ❌ [Email Error]`, error.message);
        return false;
    }
}

async function sendTelegramMessage({ token, chatId, textHtml }, retries = 3) {
    if (!token) return false;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = { chat_id: chatId, text: textHtml, parse_mode: "HTML", disable_web_page_preview: true };
    
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
            clearTimeout(timeoutId);
            if (r.ok) return true; 
        } catch (e) { await sleep(2000); }
    }
    return false; 
}

function normalize(text) { return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
function escapeHtml(s) { return String(s || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

async function verifyWithAI(postText) {
    try {
        console.log(`[${getTimestamp()}] 🤖 Asking AI for verification & email generation...`);
        const response = await fetch(AI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": AI_API_KEY },
            body: JSON.stringify({ question: postText })
        });

        if (!response.ok) return { isGenuine: false };

        const data = await response.json();
        
        if (data.answer === "YES") {
            console.log(`[${getTimestamp()}] 🤖 AI Decision: YES | Job: ${data.title}`);
            return { isGenuine: true, title: data.title, emailBody: data.email_body };
        } else {
            console.log(`[${getTimestamp()}] ❌ AI rejected (Not Algeria / Not Recent / Not Genuine).`);
            return { isGenuine: false };
        }
    } catch (e) { return { isGenuine: false }; }
}

(async () => {
    console.log(`[${getTimestamp()}] 💀 WORM-AI: AUTOPILOT APPLICATION MODE ACTIVATED`);

    const browser = await puppeteer.launch({
        headless: "new", 
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-notifications", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1366,768"]
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8' });

    await page.evaluateOnNewDocument(() => {
        window.extractedLink = null;
        navigator.clipboard.writeText = async (text) => { window.extractedLink = text; return true; };
    });

    if (fs.existsSync(COOKIE_FILE)) {
        try { await page.setCookie(...JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'))); } catch(e) {}
    }

    console.log(`[${getTimestamp()}] 🌐 Loading LinkedIn...`);
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    await sleep(5000);

    let pageHtml = await page.content();
    if (pageHtml.includes("Welcome Back") && pageHtml.includes("Ghalmi Mohamed Ayad")) {
        console.log(`[${getTimestamp()}] 🚪 'Welcome Back' detected. Clicking saved profile...`);
        try {
            const [profileClicked] = await Promise.all([
                page.evaluate(() => {
                    const els = Array.from(document.querySelectorAll('*'));
                    const target = els.find(el => el.textContent.trim() === "Ghalmi Mohamed Ayad" && el.children.length === 0);
                    if (target) { (target.closest('button, a, li, div[role="button"], [role="link"]') || target).click(); return true; } return false;
                }),
                page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {})
            ]);

            if (profileClicked) {
                await sleep(2000); 
                const pwdField = await page.$('#password').catch(() => null);
                if (pwdField) {
                    await page.type('#password', PASSWORD);
                    await Promise.all([
                        page.click('button[type="submit"]'),
                        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {})
                    ]);
                    fs.writeFileSync(COOKIE_FILE, JSON.stringify(await page.cookies(), null, 2));
                }
            }
        } catch (e) {}
    }

    let currentUrl = page.url();
    if (!currentUrl.includes("/feed") && !currentUrl.includes("/in/")) {
        console.log(`[${getTimestamp()}] 🔓 Checking standard login...`);
        await page.goto("https://www.linkedin.com/login");
        await sleep(3000);
        const userField = await page.waitForSelector('#username', { timeout: 5000 }).catch(() => null);
        if (userField) {
            await page.type('#username', EMAIL);
            await page.type('#password', PASSWORD);
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {})
            ]);
            fs.writeFileSync(COOKIE_FILE, JSON.stringify(await page.cookies(), null, 2));
        } else {
            await page.goto("https://www.linkedin.com/feed/");
        }
    }

    console.log(`[${getTimestamp()}] 📍 HUNTING (AUTOPILOT SCAN)...`);
    let stalePulses = 0;
    let lastCount = 0;

    for (let i = 0; i < 100000; i++) { 
        if (i > 0 && i % 200 === 0) {
            console.log(`\n[${getTimestamp()}] 🔄 [RESET] Refreshing feed to clear RAM...`);
            try {
                await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
                await sleep(6000);
                stalePulses = 0; lastCount = 0;
            } catch (e) {}
        }

        console.log(`\n[${getTimestamp()}] 📡 [Pulse ${i + 1}] Scanning...`);
        printResources();

        const postHandles = await page.$$('div[data-view-name="feed-full-update"]');
        if (postHandles.length === lastCount) stalePulses++; else stalePulses = 0;
        lastCount = postHandles.length;

        for (const handle of postHandles) {
            try {
                const postData = await handle.evaluate(el => {
                    const box = el.querySelector('[data-testid="expandable-text-box"]') || el.querySelector('div[data-view-name="feed-commentary"]') || el;
                    const text = box ? box.innerText : "";
                    let company = "Unknown Source";
                    const nameNode = el.querySelector('.update-components-actor__name span[aria-hidden="true"], .update-components-actor__name span[dir="ltr"]');
                    if (nameNode) company = nameNode.innerText.trim();
                    const urnMatch = el.outerHTML.match(/urn:li:(activity|ugcPost|share|jobPosting):(\d+)/);
                    return { text, urnLink: urnMatch ? `https://www.linkedin.com/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}/` : null, company };
                });

                if (!postData.text) continue;
                const postHash = postData.text.substring(0, 60).replace(/\s/g, '');
                if (seenHistory.has(postHash)) continue;

                botStats.totalScanned++;
                saveStats(); 
                seenHistory.add(postHash);
                saveHistory();

                const normText = normalize(postData.text);
                if (KEYWORDS.field.some(k => normText.includes(k)) && KEYWORDS.context.some(k => normText.includes(k)) && !KEYWORDS.blacklist.some(k => normText.includes(k))) {
                    
                    console.log(`[${getTimestamp()}] 🎯 POTENTIAL MATCH: ${postData.company}`);
                    
                    const aiResult = await verifyWithAI(postData.text);
                    if (!aiResult.isGenuine) continue; 

                    let finalLink = postData.urnLink;
                    let linkHtml = finalLink ? `👉 <a href="${escapeHtml(finalLink)}">VOIR LE POST LINKEDIN</a>` : `⚠️ <i>Lien introuvable.</i>\n👉 <a href="https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(postData.company)}">CHERCHER L'AUTEUR SUR LINKEDIN</a>`;

                    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi;
                    const foundEmails = postData.text.match(emailRegex);
                    
                    let telegramMsg = "";
                    let emailSentSuccessfully = false;
                    let emailTargetUsed = "N/A";

                    if (foundEmails && foundEmails.length > 0) {
                        emailTargetUsed = foundEmails[0]; 
                        console.log(`[${getTimestamp()}] 📧 Email detected: ${emailTargetUsed}. Sending tailored CV...`);
                        
                        emailSentSuccessfully = await sendResumeEmail(emailTargetUsed, aiResult.title, aiResult.emailBody);
                        
                        if (emailSentSuccessfully) {
                            console.log(`[${getTimestamp()}] ✅ CV successfully emailed!`);
                            botStats.emailsSent++; 
                            
                            telegramMsg = 
                                `✅ <b>AUTO-APPLICATION SUCCESS!</b> ✅\n\n` +
                                `🏢 <b>Entreprise:</b> ${escapeHtml(postData.company)}\n` +
                                `💼 <b>Poste:</b> ${escapeHtml(aiResult.title)}\n` +
                                `📧 <b>Email Envoyé À:</b> ${emailTargetUsed}\n\n` +
                                `--------------------------------\n` +
                                `<i>${escapeHtml(postData.text.substring(0, 300))}...</i>\n\n` +
                                `${linkHtml}`;
                        } else {
                            telegramMsg = 
                                `⚠️ <b>ÉCHEC DE L'ENVOI EMAIL</b> ⚠️\n\n` +
                                `L'email a été trouvé (${emailTargetUsed}) mais l'envoi a échoué.\n\n` +
                                `👤 <b>${escapeHtml(postData.company)}</b>\n\n` +
                                `${linkHtml}`;
                        }
                    } else {
                        telegramMsg = 
                            `🔍 <b>OFFRE VÉRIFIÉE (Postulation Manuelle)</b>\n\n` +
                            `<b>👤 ${escapeHtml(postData.company)}</b>\n` +
                            `🏢 <b>Poste:</b> ${escapeHtml(aiResult.title)}\n` +
                            `<i>(Aucun email détecté dans l'annonce)</i>\n\n` +
                            `<i>${escapeHtml(postData.text.substring(0, 300))}...</i>\n\n` +
                            `${linkHtml}`;
                    }

                    botStats.matchedJobs++;
                    botStats.jobsLog.push({
                        time: getTimestamp(),
                        company: postData.company,
                        jobTitle: aiResult.title,
                        emailSent: emailSentSuccessfully,
                        targetEmail: emailTargetUsed
                    });
                    saveStats();

                    await sendTelegramMessage({ token: TELEGRAM_BOT_TOKEN, chatId: TELEGRAM_CHAT_ID, textHtml: telegramMsg });
                }
            } catch (e) {}
        }

        await page.evaluate((isStale) => {
            const t = document.getElementById('workspace') || window;
            t.scrollBy(0, isStale ? 3000 : 1200);
            setTimeout(() => t.scrollBy(0, -50), 600); 
        }, stalePulses > 3);
        
        await sleep(rand(4000, 7000));
    }
})();