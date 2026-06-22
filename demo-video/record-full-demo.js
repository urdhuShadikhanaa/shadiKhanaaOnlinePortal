const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const scenarios = require('./scenarios');

const OUTPUT_DIR = path.join(__dirname, '..', 'demo-videos');
const VIDEO_ONLY = path.join(OUTPUT_DIR, 'Urdu-Shadikhana-Full-Demo-video.webm');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'narration', 'manifest.json');
const VIEWPORT = { width: 1280, height: 720 };

const pause = (page, ms) => page.waitForTimeout(ms);

function loadManifest() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

async function recordDemo() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const manifest = loadManifest();
    const waitById = {};

    if (manifest) {
        manifest.segments.forEach((segment) => {
            waitById[segment.id] = Math.max(segment.stepWaitMs, segment.durationMs + 500);
        });
    }

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

    console.log('Recording full portal demo with sample scenarios...');

    try {
        for (let index = 0; index < scenarios.length; index += 1) {
            const step = scenarios[index];
            const waitMs = waitById[step.id] || step.waitMs;
            console.log(`  Step ${index + 1}/${scenarios.length}: ${step.id}`);

            await step.run(page);
            await pause(page, waitMs);
        }
    } catch (error) {
        console.error('Recording issue:', error.message);
    } finally {
        await context.close();
        await browser.close();

        const tempVideoPath = video ? await video.path() : null;
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
            fs.copyFileSync(tempVideoPath, VIDEO_ONLY);
            try {
                fs.unlinkSync(tempVideoPath);
            } catch (cleanupError) {
                // ignore
            }
            console.log('Video saved:', VIDEO_ONLY);
        } else {
            throw new Error('No video file was created.');
        }
    }
}

recordDemo().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
