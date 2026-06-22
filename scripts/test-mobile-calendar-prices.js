/**
 * Mobile viewport smoke test: calendar offer prices visible.
 */
const { chromium } = require('playwright');

const SITE_URL = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });

    let passed = 0;
    let failed = 0;

    function pass(name) {
        passed++;
        console.log('PASS  ' + name);
    }
    function fail(name, detail) {
        failed++;
        console.error('FAIL  ' + name + (detail ? ' — ' + detail : ''));
    }

    try {
        await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });
        pass('Mobile portal loads');

        await page.getByText('When is your event?').first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);

        const formRates = page.locator('.form-date-picker .calendar-day__rate');
        const sidebarRates = page.locator('.calendar-grid-wrap .calendar-day__rate');
        const heroRate = page.locator('.request-form-hero__rate-value').first();

        if (await heroRate.isVisible({ timeout: 5000 }).catch(() => false)) {
            const text = await heroRate.innerText();
            pass('Standard rate visible in hero: ' + text.trim());
        } else {
            fail('Standard rate visible in hero');
        }

        const formRateCount = await formRates.count();
        if (formRateCount > 0) {
            const sample = await formRates.first().innerText();
            pass('Form calendar shows offer prices (' + formRateCount + ' cells, e.g. ' + sample.trim() + ')');
        } else {
            fail('Form calendar shows offer prices', 'No .calendar-day__rate in form calendar');
        }

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);

        const sidebarRateCount = await sidebarRates.count();
        if (sidebarRateCount > 0) {
            const sample = await sidebarRates.first().innerText();
            pass('Sidebar calendar shows offer prices (' + sidebarRateCount + ' cells, e.g. ' + sample.trim() + ')');
        } else {
            fail('Sidebar calendar shows offer prices', 'No .calendar-day__rate in sidebar calendar');
        }

        const venueAddress = page.locator('.address-card__full').first();
        if (await venueAddress.isVisible({ timeout: 5000 }).catch(() => false)) {
            const addr = await venueAddress.innerText();
            if (addr.includes('3/279') || addr.includes('Aravapalli')) {
                pass('Venue address displays saved branding: ' + addr.trim().slice(0, 60));
            } else {
                pass('Venue address visible: ' + addr.trim().slice(0, 60));
            }
        } else {
            fail('Venue address visible');
        }
    } catch (error) {
        fail('Unexpected error', error.message);
    } finally {
        await browser.close();
    }

    console.log('\n=== MOBILE TEST SUMMARY ===');
    console.log('Passed: ' + passed);
    console.log('Failed: ' + failed);
    process.exit(failed > 0 ? 1 : 0);
}

main();
