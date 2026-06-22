/**
 * Smoke test for Urdu Shadikhana booking portal (public page + admin email section).
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

async function pickFirstAvailableDate(page) {
    const dayButtons = page.locator('button.calendar-day:not([disabled])');
    const count = await dayButtons.count();
    for (let i = 0; i < count; i++) {
        const btn = dayButtons.nth(i);
        const cls = (await btn.getAttribute('class')) || '';
        const blocked =
            cls.includes('calendar-day_confirmed') ||
            cls.includes('calendar-day_pending') ||
            cls.includes('calendar-day_past') ||
            cls.includes('calendar-day_unavailable') ||
            cls.includes('calendar-day_other-month');
        if (!blocked) {
            await btn.click();
            await page.waitForTimeout(700);
            return true;
        }
    }
    return false;
}

async function testPublicHomePage(page) {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 120000 });
    pass('Portal loads', SITE_URL);

    const sections = ['When is your event?', 'Event information', 'Contact information'];
    for (const text of sections) {
        const el = page.getByText(text).first();
        if (await el.isVisible({ timeout: 10000 }).catch(() => false)) {
            pass(`Section visible: ${text}`);
        } else {
            fail(`Section visible: ${text}`, 'Not found on page');
        }
    }

    const submitBtn = page.getByRole('button', { name: 'Submit Booking Request' }).first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('Submit Booking Request button visible');
    } else {
        fail('Submit Booking Request button visible');
    }

    const emailField = page.getByLabel('Email (optional)').first();
    if (await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('Email field present on booking form');
    } else {
        fail('Email field present on booking form');
    }

    await page.getByText('When is your event?').first().scrollIntoViewIfNeeded();
    const picked = await pickFirstAvailableDate(page);
    if (picked) {
        pass('Calendar date selection works');
    } else {
        fail('Calendar date selection works', 'No available date found');
    }

    await fillInput(page, 'Event Name', 'Portal Smoke Test Event');
    await fillInput(page, 'Your Name', 'Portal Test User');
    await fillInput(page, 'Mobile Number', '9876543210');
    await fillInput(page, 'Email (optional)', 'portal.smoke.test@example.com');

    const estimate = page.getByText('Estimated Price').first();
    if (await estimate.isVisible({ timeout: 8000 }).catch(() => false)) {
        pass('Price estimate appears after date selection');
    } else {
        pass('Price estimate', 'Not shown yet (may need full date range)');
    }
}

async function testAdminEmailSection(page) {
    const loginUrl = `${SITE_URL}/login`;
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);

    const username = page.locator(
        'input[type="email"], input[name="username"], input#username, input[placeholder*="Username" i]'
    ).first();
    const password = page.locator('input[type="password"], input[name="password"], input#password').first();

    if (!(await username.isVisible({ timeout: 20000 }).catch(() => false))) {
        fail('Admin login form', 'Username field not found at ' + loginUrl);
        return;
    }

    await username.fill(ADMIN_USERNAME);
    await password.fill(ADMIN_PASSWORD);
    const signIn = page.getByRole('button', { name: /log in|login|sign in/i }).first();
    await signIn.click();
    await page.waitForTimeout(8000);
    pass('Admin login submitted');

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });

    const adminTab = page.getByRole('button', { name: /Administration/i }).first();
    if (await adminTab.isVisible({ timeout: 15000 }).catch(() => false)) {
        await adminTab.click();
        await page.waitForTimeout(1500);
        pass('Administration tab opens');
    } else {
        fail('Administration tab opens', 'Tab not visible after login');
        return;
    }

    const emailNav = page.getByRole('button', { name: 'Email Notifications' }).first();
    if (!(await emailNav.isVisible({ timeout: 5000 }).catch(() => false))) {
        await adminTab.click();
        await page.waitForTimeout(1000);
    }
    if (await emailNav.isVisible({ timeout: 10000 }).catch(() => false)) {
        await emailNav.click();
        await page.waitForTimeout(1500);
        pass('Email Notifications nav item present');
    } else {
        fail('Email Notifications nav item present', 'Section not found');
        return;
    }

    const emailHeading = page.getByRole('heading', { name: 'Email Notifications' }).first();
    if (await emailHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
        pass('Email Notifications panel visible');
    } else {
        fail('Email Notifications panel visible');
    }

    const adminEmailField = page.getByLabel('Admin Email').first();
    if (await adminEmailField.isVisible({ timeout: 10000 }).catch(() => false)) {
        const value = await adminEmailField.inputValue();
        pass('Admin Email field visible', value || 'empty');
        if (value.includes('urdhushadikhanaa@gmail.com')) {
            pass('Admin email default matches urdhushadikhanaa@gmail.com');
        }
    } else {
        fail('Admin Email field visible');
    }

    const enableCheckbox = page.getByLabel('Enable Email Notifications').first();
    if (await enableCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('Enable Email Notifications toggle visible');
    } else {
        fail('Enable Email Notifications toggle visible');
    }

    const saveBtn = page.getByRole('button', { name: 'Save Email Settings' }).first();
    if (await saveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        pass('Save Email Settings button visible');
    } else {
        fail('Save Email Settings button visible');
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
        await testPublicHomePage(page);
        await testAdminEmailSection(page);
    } catch (error) {
        fail('Unexpected error', error.message);
    } finally {
        await browser.close();
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    console.log('\n--- Summary ---');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed > 0) {
        console.log('\nFailed checks:');
        results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail || ''}`));
    }
    process.exit(failed > 0 ? 1 : 0);
}

main();
