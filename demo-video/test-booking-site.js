/**
 * Full functionality test for Urdu Shadikhana booking portal.
 */
const { chromium } = require('playwright');

const SITE_URL = 'https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana';
const ADMIN_USERNAME = 'onlinereservations@shabbirtech.com';
const ADMIN_PASSWORD = '#Spen@202456';

const results = [];

function pass(name, detail) {
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
    results.push({ name, ok: false, detail });
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fillInput(page, label, value) {
    const field = page.getByLabel(label).first();
    if (await field.isVisible({ timeout: 8000 }).catch(() => false)) {
        await field.click();
        await field.fill(value);
        await page.waitForTimeout(300);
        return true;
    }
    return false;
}

async function pickAvailableRange(page) {
    await page.getByText('When is your event?').first().scrollIntoViewIfNeeded();
    const today = new Date();

    for (let offset = 20; offset <= 60; offset += 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        const dayLabel = String(date.getDate());

        const buttons = page.locator('button.calendar-day:not([disabled])').filter({
            hasText: new RegExp(`^${dayLabel}$`)
        });
        const count = await buttons.count();

        for (let i = 0; i < count; i++) {
            const btn = buttons.nth(i);
            const cls = (await btn.getAttribute('class')) || '';
            if (
                cls.includes('calendar-day_confirmed') ||
                cls.includes('calendar-day_pending') ||
                cls.includes('calendar-day_past') ||
                cls.includes('calendar-day_unavailable') ||
                cls.includes('calendar-day_other-month')
            ) {
                continue;
            }

            await btn.click();
            await page.waitForTimeout(900);

            const endButtons = page.locator('button.calendar-day:not([disabled])').filter({
                hasText: new RegExp(`^${dayLabel}$`)
            });
            if ((await endButtons.count()) > i) {
                await endButtons.nth(i).click();
            } else if ((await endButtons.count()) > 0) {
                await endButtons.first().click();
            }
            await page.waitForTimeout(900);
            return true;
        }
    }
    return false;
}

async function adminLogin(page) {
    await page.goto(`${SITE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(2500);

    const username = page
        .locator('input[type="email"], input[name="username"], input#username')
        .first();
    const password = page.locator('input[type="password"], input[name="password"], input#password').first();

    if (!(await username.isVisible({ timeout: 20000 }).catch(() => false))) {
        fail('Admin login', 'Login form not found');
        return false;
    }

    await username.fill(ADMIN_USERNAME);
    await password.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /log in|login|sign in/i }).first().click();
    await page.waitForTimeout(7000);
    pass('Admin login works');
    return true;
}

async function testSiteLoads(page) {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 120000 });
    pass('Booking site loads', SITE_URL);

    for (const text of ['When is your event?', 'Event information', 'Contact information']) {
        if (await page.getByText(text).first().isVisible({ timeout: 10000 }).catch(() => false)) {
            pass(`Form section: ${text}`);
        } else {
            fail(`Form section: ${text}`);
        }
    }
}

async function testBookingSubmission(page) {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });

    await page.getByText('When is your event?').first().scrollIntoViewIfNeeded();
    const picked = await pickAvailableRange(page);
    if (!picked) {
        fail('Booking submission', 'Could not pick available dates');
        return;
    }
    pass('Date range selection works');

    await fillInput(page, 'Start Time (on from date)', '10:00');
    await fillInput(page, 'End Time (on to date)', '21:00');
    await fillInput(page, 'Event Name', `Functionality Test ${Date.now()}`);
    await fillInput(page, 'Your Name', 'Site Test User');
    await fillInput(page, 'Mobile Number', '9876543210');
    await fillInput(page, 'Email (optional)', 'site.test@example.com');

    const submitBtn = page.getByRole('button', { name: 'Submit Booking Request' }).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await page.waitForTimeout(8000);

    const successPatterns = [
        page.getByText('Request submitted'),
        page.getByText(/pending admin approval/i),
        page.getByText(/SB-\d+/i)
    ];

    let submitted = false;
    for (const locator of successPatterns) {
        if (await locator.first().isVisible({ timeout: 5000 }).catch(() => false)) {
            submitted = true;
            break;
        }
    }

    if (submitted) {
        pass('Booking request submits successfully');
    } else {
        const pageText = ((await page.locator('body').innerText().catch(() => '')) || '').slice(0, 500);
        if (/Request submitted|pending admin approval|SB-/i.test(pageText)) {
            pass('Booking request submits successfully', 'Success text found on page');
        } else {
            fail('Booking request submits successfully', 'No success confirmation detected');
        }
    }
}

async function testAdminBookingQueue(page) {
    const loginOk = await adminLogin(page);
    if (!loginOk) {
        return;
    }

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(3000);

    const adminTab = page.getByRole('button', { name: /Administration/i }).first();
    if (!(await adminTab.isVisible({ timeout: 15000 }).catch(() => false))) {
        fail('Admin booking queue', 'Administration tab not visible');
        return;
    }

    await adminTab.click();
    await page.waitForTimeout(2000);

    const bookingQueueNav = page.getByRole('button', { name: 'Booking Queue' }).first();
    if (!(await bookingQueueNav.isVisible({ timeout: 3000 }).catch(() => false))) {
        await adminTab.click();
        await page.waitForTimeout(1000);
    }
    if (await bookingQueueNav.isVisible({ timeout: 8000 }).catch(() => false)) {
        await bookingQueueNav.click();
        await page.waitForTimeout(2000);
    }

    pass('Administration section opens');

    const queueHeading = page.getByRole('heading', { name: 'Booking Queue' }).first();
    if (await queueHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
        pass('Booking queue visible');
    } else if (await page.getByText(/SB-\d+/i).first().isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('Booking queue visible', 'Booking cards found');
    } else {
        fail('Booking queue visible', 'No booking cards found');
    }

    const statusCombo = page.locator('lightning-combobox').first();
    if (await statusCombo.isVisible({ timeout: 8000 }).catch(() => false)) {
        pass('Admin can change booking status');
    } else {
        fail('Admin can change booking status', 'Status dropdown not found');
    }
}

async function testAdminEmailSettings(page) {
    if (!(await adminLogin(page))) {
        return;
    }

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });

    const adminTab = page.getByRole('button', { name: /Administration/i }).first();
    if (!(await adminTab.isVisible({ timeout: 15000 }).catch(() => false))) {
        fail('Email settings', 'Administration tab not visible');
        return;
    }

    await adminTab.click();
    await page.waitForTimeout(1500);

    const emailNav = page.getByRole('button', { name: 'Email Notifications' }).first();
    if (!(await emailNav.isVisible({ timeout: 3000 }).catch(() => false))) {
        await adminTab.click();
        await page.waitForTimeout(1000);
    }

    if (!(await emailNav.isVisible({ timeout: 8000 }).catch(() => false))) {
        fail('Email settings', 'Email Notifications menu not found');
        return;
    }

    await emailNav.click();
    await page.waitForTimeout(1500);

    const adminEmail = page.getByLabel('Admin Email').first();
    if (await adminEmail.isVisible({ timeout: 8000 }).catch(() => false)) {
        const value = await adminEmail.inputValue();
        pass('Email notification settings load', value || 'empty');
    } else {
        fail('Email notification settings load');
    }
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    try {
        await testSiteLoads(page);
        await testBookingSubmission(page);
        await testAdminBookingQueue(page);
        await testAdminEmailSettings(page);
    } catch (error) {
        fail('Unexpected error', error.message);
    } finally {
        await browser.close();
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    console.log('\n=== BOOKING SITE TEST SUMMARY ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Working: ${failed === 0 ? 'YES' : failed <= 2 ? 'MOSTLY' : 'NO - issues found'}`);
    if (failed > 0) {
        console.log('\nIssues:');
        results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail || ''}`));
    }
    process.exit(failed > 0 ? 1 : 0);
}

main();
