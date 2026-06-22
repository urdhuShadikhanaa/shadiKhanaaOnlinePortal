const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SITE_URL = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
const OUTPUT_DIR = path.join(__dirname, '..', 'demo-videos');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Portal-Demo.webm');
const VIEWPORT = { width: 1280, height: 720 };

const pause = (page, ms) => page.waitForTimeout(ms);

async function scrollToText(page, text, waitMs = 2500) {
    const locator = page.getByText(text, { exact: false }).first();
    const visible = await locator.isVisible({ timeout: 15000 }).catch(() => false);
    if (!visible) {
        return false;
    }

    await locator.scrollIntoViewIfNeeded();
    await pause(page, waitMs);
    return true;
}

async function recordDemo() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: VIEWPORT,
        recordVideo: {
            dir: OUTPUT_DIR,
            size: VIEWPORT
        },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();
    const video = page.video();

    console.log('Opening portal:', SITE_URL);

    try {
        await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByText('Reservation Portal').first().waitFor({ timeout: 120000 });
        await pause(page, 3500);

        await scrollToText(page, 'Review the Shadikhana', 3000);
        await scrollToText(page, 'Venue Address', 2500);
        await scrollToText(page, 'Booking Request Form', 3000);
        await scrollToText(page, 'When is your event?', 3500);

        const calendarHeading = page.getByRole('heading', { name: 'Calendar' }).first();
        if (await calendarHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
            await calendarHeading.scrollIntoViewIfNeeded();
            await pause(page, 3500);
        }

        await scrollToText(page, 'Event information', 2500);
        await scrollToText(page, 'Contact information', 2500);

        await page.evaluate(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        });
        await pause(page, 3500);

        await page.evaluate(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        await pause(page, 2500);
    } catch (error) {
        console.error('Recording encountered an issue:', error.message);
        console.error('Saving partial video if available.');
    } finally {
        await context.close();
        await browser.close();

        const tempVideoPath = video ? await video.path() : null;

        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.copyFileSync(tempVideoPath, OUTPUT_FILE);
            try {
                fs.unlinkSync(tempVideoPath);
            } catch (cleanupError) {
                // Ignore cleanup errors for temp webm files.
            }

            const stats = fs.statSync(OUTPUT_FILE);
            console.log('');
            console.log('Demo video saved:');
            console.log(' ', OUTPUT_FILE);
            console.log(' ', `${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
            console.log('');
            console.log('Open with VLC, Movies & TV, or drag into Chrome/Edge.');
        } else {
            console.error('No video file was created.');
            process.exitCode = 1;
        }
    }
}

recordDemo();
