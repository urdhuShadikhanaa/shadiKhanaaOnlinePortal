/**
 * Captures portal screenshots for E2E documentation (guest + optional admin).
 *
 * Usage:
 *   node scripts/capture-doc-screenshots.js
 *
 * Optional env:
 *   PORTAL_URL=https://.../urdushadikhana
 *   PORTAL_ADMIN_USER=admin@example.com
 *   PORTAL_ADMIN_PASSWORD=secret
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', 'demo-video', 'node_modules', 'playwright'));

const PORTAL_URL =
    process.env.PORTAL_URL ||
    'https://urdhushadikhanaa-dev-ed.develop.my.site.com/urdushadikhana';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const PROJECT_ROOT = path.join(__dirname, '..');
const ANDROID_MOCK = path.join(__dirname, 'android-mock-screens.html');
const ADMIN_MOCK = path.join(__dirname, 'admin-portal-mock.html');
const SF_ORG_ALIAS = process.env.SF_ORG_ALIAS || 'urdhu';
const SF_NETWORK_ID = process.env.SF_NETWORK_ID || '0DBfj000002fP1JGAU';
const DEMO_CONTACT_NAME = process.env.DEMO_CONTACT_NAME || 'Patan Shabbir Ali Khan';
const DEMO_CONTACT_PHONE = process.env.DEMO_CONTACT_PHONE || '9966634403';
const DEMO_CONTACT_EMAIL = process.env.DEMO_CONTACT_EMAIL || 'shabbirali.sfdc@gmail.com';
const ADMIN_USER = process.env.PORTAL_ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.PORTAL_ADMIN_PASSWORD || '';

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shot(page, name, locator = null) {
    const file = path.join(OUT_DIR, `${name}.png`);
    if (locator) {
        await locator.scrollIntoViewIfNeeded().catch(() => {});
        await wait(400);
        await locator.screenshot({ path: file });
    } else {
        await page.screenshot({ path: file, fullPage: false });
    }
    console.log('Captured:', name);
}

async function gotoPortal(page) {
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await page
        .getByText('Reservation Portal', { exact: false })
        .first()
        .waitFor({ timeout: 120000 });
    await wait(1500);
}

async function scrollToBookingForm(page) {
    const heading = page.getByRole('heading', { name: 'Request Your Event Date' });
    await heading.waitFor({ timeout: 30000 });
    await heading.scrollIntoViewIfNeeded();
    await wait(600);
}

function formatDdMmYyyy(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
}

function addDays(base, days) {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
}

async function readDateInputs(page) {
    const from = page.locator('input[data-field="selectedDate"]').first();
    const to = page.locator('input[data-field="selectedEndDate"]').first();
    return {
        fromVal: await from.inputValue().catch(() => ''),
        toVal: await to.inputValue().catch(() => '')
    };
}

async function waitForDateSelectionSettled(page, timeoutMs = 60000) {
    const loading = page.locator('.form-date-picker__loading').first();
    const started = Date.now();
    let sawLoading = false;

    while (Date.now() - started < timeoutMs) {
        const loadingVisible = await loading.isVisible().catch(() => false);
        if (loadingVisible) {
            sawLoading = true;
        }

        if (sawLoading && !loadingVisible) {
            await wait(600);
            const first = await readDateInputs(page);
            await wait(800);
            const second = await readDateInputs(page);
            if (first.fromVal && first.toVal && second.fromVal && second.toVal) {
                return { fromVal: second.fromVal, toVal: second.toVal, ok: true };
            }
            return { fromVal: '', toVal: '', ok: false };
        }

        if (!sawLoading && Date.now() - started > 4000) {
            const values = await readDateInputs(page);
            if (values.fromVal && values.toVal) {
                await wait(800);
                const again = await readDateInputs(page);
                if (again.fromVal && again.toVal) {
                    return { fromVal: again.fromVal, toVal: again.toVal, ok: true };
                }
            }
        }

        await wait(250);
    }

    const values = await readDateInputs(page);
    return { ...values, ok: Boolean(values.fromVal && values.toVal) };
}

async function commitDateInput(page, dataField, value) {
    const input = page.locator(`input[data-field="${dataField}"]`).first();
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.evaluate((el, nextValue) => {
        el.value = nextValue;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, value);
    await wait(500);
}

async function setDateRangeViaInputs(page, fromDate, toDate) {
    const fromStr = formatDdMmYyyy(fromDate);
    const toStr = formatDdMmYyyy(toDate);
    await commitDateInput(page, 'selectedDate', fromStr);
    await commitDateInput(page, 'selectedEndDate', toStr);
    const settled = await waitForDateSelectionSettled(page);
    return settled.ok;
}

async function fillBookingDates(page) {
    const fromInput = page.locator('input[data-field="selectedDate"]').first();
    await fromInput.waitFor({ state: 'visible', timeout: 20000 });

    const fixedCandidates = [
        new Date(2026, 7, 20),
        new Date(2026, 8, 5),
        new Date(2026, 8, 20),
        new Date(2026, 9, 1),
        new Date(2026, 6, 1)
    ];
    const offsetCandidates = [10, 17, 24, 31, 38, 45, 52, 60, 75, 90].map((n) => addDays(new Date(), n));
    const candidates = [...fixedCandidates, ...offsetCandidates];

    for (const fromDate of candidates) {
        if (await setDateRangeViaInputs(page, fromDate, fromDate)) {
            console.log('Confirmed dates:', formatDdMmYyyy(fromDate));
            return true;
        }
        console.log('Date rejected, trying another:', formatDdMmYyyy(fromDate));
    }

    if (await pickAvailableRange(page)) {
        const settled = await waitForDateSelectionSettled(page);
        if (settled.ok) {
            console.log('Confirmed dates (calendar):', settled.fromVal, '->', settled.toVal);
            return true;
        }
    }

    throw new Error('Could not pick an available booking date range.');
}

async function fillBookingTimes(page) {
    const start = page.locator('lightning-input[data-field="eventStartTime"]').first();
    if (await start.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fillLightningInput(page, 'eventStartTime', '10:00');
        await fillLightningInput(page, 'eventEndTime', '21:00');
        return;
    }

    const startHour = page.locator('lightning-combobox[data-time-scope="start"][data-time-part="hour"]').first();
    if (await startHour.isVisible({ timeout: 3000 }).catch(() => false)) {
        await selectLightningComboboxByLocator(page, startHour, '10');
        await selectLightningComboboxByLocator(
            page,
            page.locator('lightning-combobox[data-time-scope="start"][data-time-part="minute"]').first(),
            '00'
        );
        await selectLightningComboboxByLocator(
            page,
            page.locator('lightning-combobox[data-time-scope="start"][data-time-part="period"]').first(),
            'AM'
        );
        await selectLightningComboboxByLocator(
            page,
            page.locator('lightning-combobox[data-time-scope="end"][data-time-part="hour"]').first(),
            '9'
        );
        await selectLightningComboboxByLocator(
            page,
            page.locator('lightning-combobox[data-time-scope="end"][data-time-part="minute"]').first(),
            '00'
        );
        await selectLightningComboboxByLocator(
            page,
            page.locator('lightning-combobox[data-time-scope="end"][data-time-part="period"]').first(),
            'PM'
        );
    }
}

async function selectLightningComboboxByLocator(page, root, optionLabel) {
    await root.scrollIntoViewIfNeeded();
    await root.locator('button').first().click({ force: true });
    await wait(400);
    await page.getByRole('option', { name: optionLabel }).first().click();
    await wait(300);
}

async function getWizardStep(page) {
    const active = page.locator('.request-form-steps [aria-current="step"]').first();
    if ((await active.count()) === 0) {
        return 1;
    }
    return Number(await active.getAttribute('data-step'));
}

async function getWizardStepTitle(page) {
    const step = await getWizardStep(page);
    const map = { 1: 'Dates', 2: 'Event', 3: 'Contact', 4: 'Preview' };
    return map[step] || `step ${step}`;
}

async function clickNext(page) {
    const next = page.locator('.booking-wizard-nav').getByRole('button', { name: 'Next' }).first();
    await next.waitFor({ state: 'visible', timeout: 10000 });
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await wait(1200);
}

async function advanceToStep(page, targetStep) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const current = await getWizardStep(page);
        if (current >= targetStep) {
            return current;
        }

        const before = current;
        await clickNext(page);
        const after = await getWizardStep(page);

        if (after === before) {
            const toast = page.locator('.slds-notify_toast, .slds-theme--error').first();
            const toastText = (await toast.textContent().catch(() => '')) || '';
            console.warn(
                `Next did not advance (still on ${await getWizardStepTitle(page)}).`,
                toastText.trim() || 'No toast message.'
            );
            await wait(800);
        }
    }

    const finalStep = await getWizardStep(page);
    if (finalStep < targetStep) {
        throw new Error(`Could not reach wizard step ${targetStep} (stuck on step ${finalStep}).`);
    }
    return finalStep;
}

async function requireWizardStep(page, expectedStep) {
    const current = await getWizardStep(page);
    if (current !== expectedStep) {
        throw new Error(`Expected wizard step ${expectedStep} but on step ${current}.`);
    }
}

async function selectLightningCombobox(page, dataField, optionLabel) {
    const root = page.locator(`lightning-combobox[data-field="${dataField}"]`).first();
    await root.waitFor({ state: 'attached', timeout: 20000 });
    await root.scrollIntoViewIfNeeded();
    const trigger = root.locator('button').first();
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click({ force: true });
    await wait(600);
    const option = page.getByRole('option', { name: optionLabel }).first();
    if (await option.isVisible({ timeout: 4000 }).catch(() => false)) {
        await option.click();
    } else {
        await page.locator('.slds-listbox__option', { hasText: optionLabel }).first().click();
    }
    await wait(400);
}

async function fillLightningInput(page, dataField, value) {
    const root = page.locator(`lightning-input[data-field="${dataField}"]`).first();
    await root.waitFor({ timeout: 10000 });
    const input = root.locator('input').first();
    await input.fill(value);
    await input.dispatchEvent('change');
    await wait(300);
}

async function fillPhoneDigits(page, digits) {
    const input = page.locator('.phone-input-group__input').first();
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.evaluate((el, value) => {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }, digits);
    await wait(300);
}

async function fillContactStep(page) {
    await fillLightningInput(page, 'contactName', DEMO_CONTACT_NAME);
    await fillPhoneDigits(page, DEMO_CONTACT_PHONE);
    const email = page.locator('lightning-input[data-field="contactEmail"]').first();
    if (await email.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fillLightningInput(page, 'contactEmail', DEMO_CONTACT_EMAIL);
    }
}

async function acceptBookingConsent(page) {
    const consentArea = page.locator('.booking-wizard-consent').first();
    await consentArea.scrollIntoViewIfNeeded();
    const faux = consentArea.locator('span.slds-checkbox_faux').first();
    if (await faux.isVisible({ timeout: 5000 }).catch(() => false)) {
        await faux.click({ force: true });
        await wait(300);
        return;
    }

    await page.evaluate(() => {
        const checkbox = document.querySelector('.booking-wizard-consent input[type="checkbox"]');
        if (checkbox && !checkbox.checked) {
            checkbox.click();
        }
    });
    await wait(300);
}

async function pickAvailableRange(page) {
    const picker = page.locator('.form-date-picker').first();
    await picker.waitFor({ state: 'visible', timeout: 15000 });

    for (let monthAttempt = 0; monthAttempt < 6; monthAttempt += 1) {
        const days = picker.locator('button.calendar-day:not([disabled])');
        const count = await days.count();

        for (let i = 0; i < count; i += 1) {
            await days.nth(i).click();
            await wait(400);
            await days.nth(i).click();
            await wait(500);

            const settled = await waitForDateSelectionSettled(page, 30000);
            if (settled.ok) {
                console.log('Picked dates:', settled.fromVal, '->', settled.toVal);
                return true;
            }
        }

        const next = picker.getByRole('button', { name: 'Next month' }).first();
        if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
            await next.click();
            await wait(700);
        }
    }

    return false;
}

async function safeStep(label, fn) {
    try {
        await fn();
    } catch (err) {
        console.warn(`Step skipped (${label}):`, err.message);
    }
}

async function captureGuestFlow(page) {
    await gotoPortal(page);

    await safeStep('home header', async () => {
        await shot(page, '01-portal-home-header');
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await shot(page, '02-portal-home-top');
        const sidebar = page.locator('aside.sidebar');
        if (await sidebar.isVisible({ timeout: 5000 }).catch(() => false)) {
            await shot(page, '02b-sidebar-navigation', sidebar);
        }
    });

    await safeStep('venue', async () => {
        const venue = page.getByRole('heading', { name: 'Review the Shadikhana' });
        await venue.scrollIntoViewIfNeeded();
        await wait(500);
        await shot(page, '03-venue-gallery', page.locator('section.venue-review'));
        const address = page.locator('.address-card_review');
        if (await address.isVisible({ timeout: 5000 }).catch(() => false)) {
            await shot(page, '04-venue-address-map', address);
        }
    });

    const formPanel = page.locator('article.request-form-panel');

    await safeStep('wizard step 1', async () => {
        await scrollToBookingForm(page);
        await shot(page, '05-booking-form-step1-dates', formPanel);
        await fillBookingDates(page);
        await fillBookingTimes(page);
        await wait(500);
        await shot(page, '06-calendar-date-picker', formPanel);

        const homeCalendar = page.locator('article.home-calendar-panel');
        const inlinePicker = page.locator('.form-date-picker').first();
        if (await homeCalendar.isVisible({ timeout: 3000 }).catch(() => false)) {
            await shot(page, '07-availability-calendar-panel', homeCalendar);
        } else if (await inlinePicker.isVisible({ timeout: 3000 }).catch(() => false)) {
            await shot(page, '07-availability-calendar-panel', inlinePicker);
        }
    });

    await safeStep('wizard step 2', async () => {
        const step = await advanceToStep(page, 2);
        console.log('Wizard at step', step, 'before event form screenshot');
        await requireWizardStep(page, 2);
        await selectLightningCombobox(page, 'eventType', 'Birthday Party');
        await fillLightningInput(page, 'expectedGuestCount', '100');
        await selectLightningCombobox(page, 'decorationArrangement', 'I will arrange myself');
        await selectLightningCombobox(page, 'cateringArrangement', 'I will arrange myself');
        await wait(500);
        await shot(page, '10-booking-step2-event', formPanel);
    });

    await safeStep('wizard step 3', async () => {
        await advanceToStep(page, 3);
        await requireWizardStep(page, 3);
        await wait(500);
        await fillContactStep(page);
        await wait(500);
        await shot(page, '11-booking-step3-contact', formPanel);
    });

    await safeStep('wizard step 4', async () => {
        await advanceToStep(page, 4);
        await requireWizardStep(page, 4);
        await wait(800);
        await shot(page, '12-booking-step4-review', formPanel);

        await acceptBookingConsent(page);
        await wait(400);

        const submit = page.locator('.booking-wizard-nav').getByRole('button', { name: /submit/i }).first();
        if (await submit.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submit.scrollIntoViewIfNeeded();
            await submit.click({ force: true });
            await page
                .getByText(/booking request.*submitted|request.*received|thank you|success/i)
                .first()
                .waitFor({ timeout: 30000 })
                .catch(() => {});
            await wait(1500);
        }

        await shot(page, '13-booking-submit-success', formPanel);
    });

    await safeStep('footer and login', async () => {
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await wait(600);
        await shot(page, '08-portal-footer');
        const loginBtn = page.getByRole('button', { name: 'Login' }).first();
        if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await loginBtn.click();
            await wait(3500);
            await shot(page, '09-login-page');
        }
    });
}

function getSfdxAuth() {
    try {
        const raw = execSync(`sf org display --target-org ${SF_ORG_ALIAS} --json`, {
            encoding: 'utf8',
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const payload = JSON.parse(raw);
        return payload.result || null;
    } catch (err) {
        console.warn('Could not read SFDX auth:', err.message);
        return null;
    }
}

function runSfDataQuery(soql) {
    try {
        const raw = execSync(
            `sf data query --target-org ${SF_ORG_ALIAS} --json --query "${soql.replace(/"/g, '\\"')}"`,
            { encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        const payload = JSON.parse(raw);
        return payload.result?.records || [];
    } catch (err) {
        console.warn('SF query failed:', err.message);
        return [];
    }
}

function ensurePendingSmsRecord() {
    const apex = `
List<Sms_Outbound__c> rows = [
    SELECT Id FROM Sms_Outbound__c
    WHERE Status__c = 'Pending' AND To_Number__c = '+91${DEMO_CONTACT_PHONE}'
    LIMIT 1
];
if (rows.isEmpty()) {
    insert new Sms_Outbound__c(
        To_Number__c = '+91${DEMO_CONTACT_PHONE}',
        Message_Body__c = 'Urdu Shadikhana documentation screenshot — pending SMS queue example.',
        Status__c = 'Pending'
    );
}
`;
    const file = path.join(PROJECT_ROOT, 'scripts', '.tmp-doc-pending-sms.apex');
    fs.writeFileSync(file, apex);
    try {
        execSync(`sf apex run --target-org ${SF_ORG_ALIAS} --file "${file}"`, {
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } catch (err) {
        console.warn('Could not seed pending SMS record:', err.message);
    } finally {
        fs.unlinkSync(file);
    }
}

function queryLatestPendingBookingId() {
    let records = runSfDataQuery(
        `SELECT Id, Name FROM Shadikhana_Booking__c WHERE Status__c = 'Pending' AND (Contact_Phone__c LIKE '%${DEMO_CONTACT_PHONE}%' OR Contact_Email__c = '${DEMO_CONTACT_EMAIL}') ORDER BY CreatedDate DESC LIMIT 1`
    );
    if (!records.length) {
        records = runSfDataQuery(
            `SELECT Id, Name FROM Shadikhana_Booking__c WHERE Status__c = 'Pending' ORDER BY CreatedDate DESC LIMIT 1`
        );
    }
    return records[0]?.Id || null;
}

function parsePortalUrl(portalUrl) {
    const url = new URL(portalUrl);
    const pathPrefix = url.pathname.replace(/\/$/, '') || '';
    return { origin: url.origin, pathPrefix };
}

function getInternalPortalUrl(instanceUrl) {
    if (!instanceUrl) {
        return null;
    }
    return `${instanceUrl.replace(/\/$/, '')}/s/urdushadikhana`;
}

async function loginPortalWithFrontdoor(page, accessToken, instanceUrl) {
    const internalPortalUrl = getInternalPortalUrl(instanceUrl);
    if (!internalPortalUrl) {
        return false;
    }

    try {
        await page.goto(`${instanceUrl}/secur/frontdoor.jsp?sid=${encodeURIComponent(accessToken)}`, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });
        await wait(2500);
        await page.goto(internalPortalUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await wait(6000);

        if (await isPortalAdminSession(page)) {
            console.log('Portal admin session via internal community URL.');
            return true;
        }

        const networkSwitch = `${instanceUrl}/servlet/networks/switch?networkId=${SF_NETWORK_ID}&startURL=${encodeURIComponent('/s/urdushadikhana')}`;
        await page.goto(networkSwitch, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await wait(6000);

        if (await isPortalAdminSession(page)) {
            console.log('Portal admin session via network switch.');
            return true;
        }
    } catch (err) {
        console.warn('Internal portal login failed:', err.message);
    }

    return false;
}

async function loginAsAdminWithPassword(page) {
    await page.goto(`${PORTAL_URL}/login`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(2000);

    const userField = page.locator('input[type="email"], input#username, input[name="username"]').first();
    const passField = page.locator('input[type="password"], input#password, input[name="password"]').first();

    if (!(await userField.isVisible({ timeout: 10000 }).catch(() => false))) {
        return false;
    }

    await userField.fill(ADMIN_USER);
    await passField.fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /log in|login|sign in/i }).first().click();
    await wait(5000);
    await page.goto(PORTAL_URL, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(2000);

    return page.locator('button.sidebar-nav__item').filter({ hasText: 'Administration' }).isVisible({ timeout: 15000 });
}

async function loginAsAdmin(page) {
    const auth = getSfdxAuth();
    if (auth?.accessToken) {
        const ok = await loginPortalWithFrontdoor(page, auth.accessToken, auth.instanceUrl);
        if (ok) {
            return true;
        }
    }

    const user = ADMIN_USER || auth?.username || '';
    if (user && ADMIN_PASSWORD) {
        const ok = await loginAsAdminWithPassword(page);
        if (ok) {
            return true;
        }
    }

    console.log('Skipping admin screenshots (SFDX frontdoor failed; set PORTAL_ADMIN_PASSWORD if needed).');
    return false;
}

async function isPortalAdminSession(page) {
    return page.locator('button.sidebar-nav__item').filter({ hasText: 'Administration' }).isVisible({ timeout: 8000 });
}

async function openAdministration(page) {
    const adminBtn = page.locator('button.sidebar-nav__item').filter({ hasText: 'Administration' });
    if (await adminBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        await adminBtn.click();
        await wait(1000);
        return true;
    }
    return false;
}

async function captureAdminSection(page, sectionId, filename) {
    const btn = page.locator(`button[data-admin-section="${sectionId}"]`).first();
    if (!(await btn.isVisible({ timeout: 8000 }).catch(() => false))) {
        console.log('Missing admin section:', sectionId);
        return;
    }
    await btn.click();
    await wait(1200);
    const main = page.locator('main.portal-content');
    await shot(page, filename, main);
}

async function captureAdminConfirmAndDeepLink(page, bookingId, portalBaseUrl) {
    if (!bookingId) {
        console.log('No pending booking for admin confirm/deep-link screenshots.');
        return;
    }

    const base = portalBaseUrl || PORTAL_URL;

    await safeStep('admin deep link', async () => {
        const deepUrl = `${base}?bookingId=${bookingId}&tab=admin`;
        await page.goto(deepUrl, { waitUntil: 'networkidle', timeout: 120000 });
        await wait(3000);
        await openAdministration(page);
        await wait(1500);
        const highlighted = page.locator('.admin-card_highlighted, article.admin-card').filter({
            hasText: DEMO_CONTACT_PHONE
        }).first();
        const target = (await highlighted.isVisible({ timeout: 8000 }).catch(() => false))
            ? highlighted
            : page.locator('main.portal-content');
        await shot(page, '22-admin-deep-link-highlight', target);
    });

    await safeStep('admin confirm booking', async () => {
        await captureAdminSection(page, 'bookings', '20-admin-booking-queue');
        const card = page.locator(`[data-booking-focus="${bookingId}"], article.admin-card`).filter({
            hasText: DEMO_CONTACT_PHONE
        }).first();
        if (!(await card.isVisible({ timeout: 10000 }).catch(() => false))) {
            const fallback = page.locator('article.admin-card').filter({ hasText: 'Pending' }).first();
            if (await fallback.isVisible({ timeout: 5000 }).catch(() => false)) {
                await fallback.scrollIntoViewIfNeeded();
                const statusCombo = fallback.locator('lightning-combobox').first();
                if (await statusCombo.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await statusCombo.locator('button').first().click({ force: true });
                    await wait(500);
                }
                await shot(page, '21-admin-confirm-booking', fallback);
            }
            return;
        }
        const statusCombo = card.locator('lightning-combobox').first();
        if (await statusCombo.isVisible({ timeout: 5000 }).catch(() => false)) {
            await statusCombo.locator('button').first().click({ force: true });
            await wait(500);
        }
        await shot(page, '21-admin-confirm-booking', card);
    });
}

async function captureAdminMocks(page) {
    const mockUrl = `file:///${ADMIN_MOCK.replace(/\\/g, '/')}`;
    const screens = [
        ['queue', '20-admin-booking-queue'],
        ['confirm', '21-admin-confirm-booking'],
        ['deeplink', '22-admin-deep-link-highlight'],
        ['reports', '23-admin-booking-report'],
        ['pricing', '24-admin-pricing'],
        ['branding', '25-admin-branding'],
        ['sms', '26-admin-sms-settings'],
        ['email', '27-admin-email-settings'],
        ['login', '28-admin-login-notes'],
        ['data', '29-admin-booking-data']
    ];

    for (const [screen, filename] of screens) {
        await safeStep(`admin mock ${screen}`, async () => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto(`${mockUrl}?screen=${screen}`, { waitUntil: 'load', timeout: 30000 });
            await wait(300);
            await shot(page, filename, page.locator('main'));
        });
    }
}

async function captureAdminFlow(page, bookingId, auth) {
    const portalBaseUrl = getInternalPortalUrl(auth?.instanceUrl) || PORTAL_URL;
    const ok = await loginAsAdmin(page);
    if (!ok) {
        console.log('Using admin UI mocks because live admin login is unavailable in automation.');
        await captureAdminMocks(page);
        return;
    }

    await openAdministration(page);
    await captureAdminConfirmAndDeepLink(page, bookingId, portalBaseUrl);

    await captureAdminSection(page, 'reports', '23-admin-booking-report');
    await captureAdminSection(page, 'pricing', '24-admin-pricing');
    await captureAdminSection(page, 'branding', '25-admin-branding');
    await captureAdminSection(page, 'sms', '26-admin-sms-settings');
    await captureAdminSection(page, 'email', '27-admin-email-settings');
    await captureAdminSection(page, 'portalLogin', '28-admin-login-notes');

    const bookingData = page.locator('button.sidebar-nav__item').filter({ hasText: 'Booking Data' });
    if (await bookingData.isVisible({ timeout: 5000 }).catch(() => false)) {
        await bookingData.click();
        await wait(1200);
        await shot(page, '29-admin-booking-data', page.locator('main.portal-content'));
    }
}

async function captureSalesforceLightning(page, auth) {
    if (!auth?.accessToken || !auth?.instanceUrl) {
        console.log('Skipping Salesforce UI screenshots (no SFDX auth).');
        return;
    }

    ensurePendingSmsRecord();

    async function openSfPage(retPath, screenshotName) {
        const ret = encodeURIComponent(retPath);
        const url = `${auth.instanceUrl}/secur/frontdoor.jsp?sid=${encodeURIComponent(auth.accessToken)}&retURL=${ret}`;
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        } catch (err) {
            console.warn(`SF navigation slow (${screenshotName}):`, err.message);
        }
        await page.locator('lightning-spinner').first().waitFor({ state: 'hidden', timeout: 45000 }).catch(() => {});
        await page
            .locator('.slds-table, .scheduledJobsList, one-record-home-flexipage2, .forceListViewManager')
            .first()
            .waitFor({ timeout: 45000 })
            .catch(() => {});
        await wait(2500);
        await shot(page, screenshotName);
    }

    await safeStep('sms outbound list', async () => {
        await openSfPage('/lightning/o/Sms_Outbound__c/list', '14-sms-outbound-pending');
    });

    await safeStep('scheduled jobs', async () => {
        await openSfPage('/lightning/setup/ScheduledJobs/home', '31-scheduled-jobs');
    });
}

async function captureAndroidMocks(page) {
    const mockUrl = `file:///${ANDROID_MOCK.replace(/\\/g, '/')}`;
    const screens = [
        ['app', '15-android-gateway-app'],
        ['sms', '16-admin-sms-received'],
        ['test', '30-android-test-sms']
    ];

    for (const [screen, filename] of screens) {
        await safeStep(`android ${screen}`, async () => {
            await page.setViewportSize({ width: 430, height: 920 });
            await page.goto(`${mockUrl}?screen=${screen}`, { waitUntil: 'load', timeout: 30000 });
            await wait(400);
            const phone = page.locator('.phone');
            await shot(page, filename, phone);
        });
    }

    await page.setViewportSize({ width: 1440, height: 900 });
}

const ALL_SCREENSHOTS = [
    '01-portal-home-header.png',
    '02-portal-home-top.png',
    '02b-sidebar-navigation.png',
    '03-venue-gallery.png',
    '04-venue-address-map.png',
    '05-booking-form-step1-dates.png',
    '06-calendar-date-picker.png',
    '07-availability-calendar-panel.png',
    '08-portal-footer.png',
    '09-login-page.png',
    '10-booking-step2-event.png',
    '11-booking-step3-contact.png',
    '12-booking-step4-review.png',
    '13-booking-submit-success.png',
    '14-sms-outbound-pending.png',
    '15-android-gateway-app.png',
    '16-admin-sms-received.png',
    '20-admin-booking-queue.png',
    '21-admin-confirm-booking.png',
    '22-admin-deep-link-highlight.png',
    '23-admin-booking-report.png',
    '24-admin-pricing.png',
    '25-admin-branding.png',
    '26-admin-sms-settings.png',
    '27-admin-email-settings.png',
    '28-admin-login-notes.png',
    '29-admin-booking-data.png',
    '30-android-test-sms.png',
    '31-scheduled-jobs.png'
];

async function main() {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const auth = getSfdxAuth();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const skipGuest = process.env.SKIP_GUEST === '1';

    try {
        console.log(`Demo contact: ${DEMO_CONTACT_NAME} | +91${DEMO_CONTACT_PHONE} | ${DEMO_CONTACT_EMAIL}`);
        if (!skipGuest) {
            await captureGuestFlow(page);
        }
        const bookingId = queryLatestPendingBookingId();
        if (bookingId) {
            console.log('Pending booking for admin shots:', bookingId);
        }
        await captureAdminFlow(page, bookingId, auth);
        await captureSalesforceLightning(page, auth);
        await captureAndroidMocks(page);

        const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
        console.log(`Done. ${files.length} screenshots in`, OUT_DIR);
        const missing = ALL_SCREENSHOTS.filter((f) => !files.includes(f));
        if (missing.length) {
            console.warn('Still missing:', missing.join(', '));
        }
    } catch (err) {
        console.error('Screenshot capture error:', err.message);
        process.exitCode = 1;
    } finally {
        await browser.close();
    }
}

main();
