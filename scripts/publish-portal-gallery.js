/**
 * Capture beautiful venue gallery images and upload them to the live portal.
 *
 * Usage:
 *   node scripts/publish-portal-gallery.js
 *
 * Optional env:
 *   PORTAL_URL, SF_ORG_ALIAS (default urdhu)
 *   SKIP_CAPTURE=1  — only upload existing files in docs/portal-gallery/
 */
const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', 'demo-video', 'node_modules', 'playwright'));

const PORTAL_URL =
    process.env.PORTAL_URL ||
    'https://urdhushadikhanaa-dev-ed.develop.my.site.com/urdushadikhana';
const PROJECT_ROOT = path.join(__dirname, '..');
const GALLERY_DIR = path.join(PROJECT_ROOT, 'docs', 'portal-gallery');
const SF_ORG_ALIAS = process.env.SF_ORG_ALIAS || 'urdhu';

const GALLERY_SLOTS = [
    { file: 'exterior.jpg', resourceName: 'ShadikhanaHallExterior', field: 'Portal_Gallery_Exterior_Id__c' },
    { file: 'interior.jpg', resourceName: 'ShadikhanaHallInterior', field: 'Portal_Gallery_Interior_Id__c' },
    { file: 'dining.jpg', resourceName: 'ShadikhanaDiningArea', field: 'Portal_Gallery_Dining_Id__c' }
];

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSfdxAuth() {
    const raw = execSync(`sf org display --target-org ${SF_ORG_ALIAS} --json`, {
        encoding: 'utf8',
        cwd: PROJECT_ROOT,
        stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(raw).result;
}

function sfRequest(auth, method, apiPath, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${auth.instanceUrl}${apiPath}`);
        const payload = body ? JSON.stringify(body) : null;
        const req = https.request(
            {
                hostname: url.hostname,
                path: `${url.pathname}${url.search}`,
                method,
                headers: {
                    Authorization: `Bearer ${auth.accessToken}`,
                    'Content-Type': 'application/json',
                    ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
                }
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(`Salesforce ${method} ${apiPath} failed (${res.statusCode}): ${data}`));
                        return;
                    }
                    resolve(data ? JSON.parse(data) : {});
                });
            }
        );
        req.on('error', reject);
        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

async function sfQuery(auth, soql) {
    const encoded = encodeURIComponent(soql);
    const result = await sfRequest(auth, 'GET', `/services/data/v67.0/query?q=${encoded}`);
    return result.records || [];
}

async function captureBeautifulGalleryImages() {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1440, height: 960 },
        deviceScaleFactor: 2
    });

    try {
        await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 120000 });
        await page.getByText('Reservation Portal', { exact: false }).first().waitFor({ timeout: 120000 });
        await wait(1200);

        const venue = page.locator('section.venue-review');
        await venue.scrollIntoViewIfNeeded();
        await wait(800);

        await page.evaluate(() => {
            document.querySelectorAll('.gallery-main__image').forEach((img) => {
                img.style.filter = 'contrast(1.04) saturate(1.1) brightness(1.02)';
                img.style.borderRadius = '12px';
            });
            const panel = document.querySelector('section.venue-review');
            if (panel) {
                panel.style.boxShadow = '0 18px 48px rgba(15, 81, 50, 0.12)';
            }
        });

        const thumbs = page.locator('.gallery-thumbs_review .gallery-thumb, .gallery-thumbs .gallery-thumb');
        const thumbCount = await thumbs.count();

        for (let i = 0; i < Math.min(thumbCount, GALLERY_SLOTS.length); i += 1) {
            await thumbs.nth(i).click();
            await wait(700);
            const image = page.locator('.gallery-main__image').first();
            await image.waitFor({ state: 'visible', timeout: 15000 });
            const outPath = path.join(GALLERY_DIR, GALLERY_SLOTS[i].file);
            await image.screenshot({ path: outPath, type: 'jpeg', quality: 85 });
            console.log('Captured gallery image:', GALLERY_SLOTS[i].file);
        }

        const heroPath = path.join(GALLERY_DIR, 'venue-hero.jpg');
        await venue.screenshot({ path: heroPath, type: 'jpeg', quality: 85 });
        console.log('Captured venue hero:', 'venue-hero.jpg');
    } finally {
        await browser.close();
    }
}

async function uploadGallerySlot(auth, slot, filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length > 5 * 1024 * 1024) {
        throw new Error(`Image too large for upload: ${filePath}`);
    }

    const created = await sfRequest(auth, 'POST', '/services/data/v67.0/sobjects/ContentVersion', {
        Title: `${slot.resourceName}-${Date.now()}`,
        PathOnClient: slot.file,
        VersionData: buffer.toString('base64'),
        IsMajorVersion: true
    });

    const versions = await sfQuery(
        auth,
        `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${created.id}' LIMIT 1`
    );
    const contentDocumentId = versions[0].ContentDocumentId;

    const orgRows = await sfQuery(auth, 'SELECT Id FROM Organization LIMIT 1');
    const orgId = orgRows[0].Id;
    const settingsRows = await sfQuery(
        auth,
        `SELECT Id FROM Shadikhana_Settings__c WHERE SetupOwnerId = '${orgId}' LIMIT 1`
    );

    if (settingsRows.length) {
        await sfRequest(auth, 'PATCH', `/services/data/v67.0/sobjects/Shadikhana_Settings__c/${settingsRows[0].Id}`, {
            [slot.field]: contentDocumentId
        });
    } else {
        await sfRequest(auth, 'POST', '/services/data/v67.0/sobjects/Shadikhana_Settings__c', {
            SetupOwnerId: orgId,
            [slot.field]: contentDocumentId
        });
    }

    console.log('Uploaded to portal:', slot.resourceName, contentDocumentId);
}

async function uploadGalleryImages() {
    const auth = getSfdxAuth();
    for (const slot of GALLERY_SLOTS) {
        const filePath = path.join(GALLERY_DIR, slot.file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing gallery file: ${filePath}`);
        }
        await uploadGallerySlot(auth, slot, filePath);
    }
}

async function publishExperienceSite() {
    try {
        const output = execSync(`sf community publish --name "Urdu Shadikhana" --target-org ${SF_ORG_ALIAS}`, {
            encoding: 'utf8',
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log('Experience site publish requested.');
        if (output.trim()) {
            console.log(output.trim());
        }
    } catch (err) {
        console.warn('Site publish skipped or still running:', err.message);
    }
}

async function refreshDocVenueScreenshot() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 });
    const docShot = path.join(PROJECT_ROOT, 'docs', 'screenshots', '03-venue-gallery.png');
    try {
        await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 120000 });
        await page.getByText('Reservation Portal', { exact: false }).first().waitFor({ timeout: 120000 });
        await wait(1200);
        const venue = page.locator('section.venue-review');
        await venue.scrollIntoViewIfNeeded();
        await wait(800);
        await venue.screenshot({ path: docShot, type: 'png' });
        console.log('Updated doc screenshot: 03-venue-gallery.png');
    } finally {
        await browser.close();
    }
}

async function main() {
    if (process.env.SKIP_CAPTURE !== '1') {
        await captureBeautifulGalleryImages();
    }
    await uploadGalleryImages();
    await publishExperienceSite();
    await refreshDocVenueScreenshot();
    console.log('Portal gallery updated. Open:', PORTAL_URL);
}

main().catch((err) => {
    console.error('Portal gallery publish failed:', err.message);
    process.exitCode = 1;
});
