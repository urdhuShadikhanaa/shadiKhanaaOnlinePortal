/**
 * Demo walkthrough steps — Telugu voiceover (te-IN).
 */
module.exports = [
    {
        id: 'intro',
        narration:
            'ఉర్దూ షాదిఖానా ఆన్‌లైన్ రిజర్వేషన్ పోర్టల్‌కు స్వాగతం. ఈ ప్రదర్శనలో నమూనా బుకింగ్ వివరాలతో పోర్టల్‌లోని అన్ని ముఖ్య ఫీచర్లు చూపిస్తాము. అతిథులు venue చూడవచ్చు, ఖాళీ తేదీలు తెలుసుకోవచ్చు, అభ్యర్థన పంపవచ్చు. అడ్మిన్ ఆమోదం తర్వాతే తేదీలు confirm అవుతాయి.',
        waitMs: 9000,
        async run(page) {
            await page.goto('https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana', {
                waitUntil: 'domcontentloaded',
                timeout: 120000
            });
            await page.getByText('Reservation Portal').first().waitFor({ timeout: 120000 });
        }
    },
    {
        id: 'header',
        narration:
            'పై భాగంలో పోర్టల్ పేరు, ప్రస్తుత సమయం, మరియు Login బటన్ కనిపిస్తాయి. లాగిన్ అయిన తర్వాత My Bookings లో మీ అభ్యర్థనల స్థితి చూడవచ్చు.',
        waitMs: 8000,
        async run(page) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    },
    {
        id: 'venue',
        narration:
            'Review the Shadikhana విభాగంలో venue ఫోటోలు చూడవచ్చు. thumbnails లేదా arrows తో main hall, dining area, exterior చూసి నిర్ణయం తీసుకోండి.',
        waitMs: 8500,
        async run(page) {
            await page.getByText('Review the Shadikhana').first().scrollIntoViewIfNeeded();
            const nextBtn = page.getByRole('button', { name: 'Next photo' }).first();
            if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await nextBtn.click();
                await page.waitForTimeout(800);
                await nextBtn.click();
            }
        }
    },
    {
        id: 'address',
        narration:
            'Venue Address కార్డ్‌లో నందలూరు, వై.ఎస్.ఆర్. kadapa జిల్లా చిరునామా ఉంటుంది. Google Maps ద్వారా directions తీసుకోవచ్చు.',
        waitMs: 7500,
        async run(page) {
            await page.getByText('Venue Address').first().scrollIntoViewIfNeeded();
        }
    },
    {
        id: 'form-intro',
        narration:
            'Booking Request Form లో మూడు దశలు ఉన్నాయి: తేదీలు మరియు సమయాలు ఎంచుకోవడం, event వివరాలు నమోదు చేయడం, admin review కోసం submit చేయడం. రోజువారీ rate మరియు partial day pricing rules కూడా ఇక్కడ చూపబడతాయి.',
        waitMs: 9000,
        async run(page) {
            await page.getByRole('heading', { name: 'Booking Request Form' }).scrollIntoViewIfNeeded();
        }
    },
    {
        id: 'calendar-dates',
        narration:
            'When is your event? లో from date కోసం అందుబాటులో ఉన్న తేదీ tap చేయండి, తర్వాత to date ఎంచుకోండి. confirm అయిన bookings gray గా block అవుతాయి. మునుపటి event nine AM కి ముందు ముగిస్తే మాత్రమే కొన్ని end dates అందుబాటులో ఉంటాయి.',
        waitMs: 10000,
        async run(page) {
            await page.getByText('When is your event?').first().scrollIntoViewIfNeeded();
            await pickAvailableRange(page);
        }
    },
    {
        id: 'calendar-panel',
        narration:
            'కుడి వైపు calendar panel లో అదే availability కనిపిస్తుంది. pending, confirmed, selected dates, nine AM turnover rules — legend colors ద్వారా అర్థం చేసుకోవచ్చు.',
        waitMs: 8500,
        async run(page) {
            const heading = page.getByRole('heading', { name: 'Calendar' }).first();
            await heading.scrollIntoViewIfNeeded();
        }
    },
    {
        id: 'times',
        narration:
            'from date పై start time, to date పై end time ఇవ్వండి. ఒకే రోజు event అయితే end time start time కంటే తర్వాత ఉండాలి.',
        waitMs: 7500,
        async run(page) {
            await page.getByLabel('Start Time (on from date)').first().scrollIntoViewIfNeeded();
            await fillInput(page, 'Start Time (on from date)', '10:00');
            await fillInput(page, 'End Time (on to date)', '21:00');
        }
    },
    {
        id: 'event-info',
        narration:
            'నమూనా scenario: సుమారు రెండు వందల మంది guests తో family wedding reception. event name, seating, catering, special requirements వంటి వివరాలు నమోదు చేయండి.',
        waitMs: 9000,
        async run(page) {
            await page.getByText('Event information').first().scrollIntoViewIfNeeded();
            await fillInput(page, 'Event Name', 'Family Wedding Reception');
            await fillTextarea(
                page,
                'Event Details',
                'Approx 200 guests. Main hall ceremony and dining setup. Vegetarian catering required.'
            );
        }
    },
    {
        id: 'contact',
        narration:
            'confirmation కోసం contact information అవసరం. mobile number తప్పనిసరి. email optional కానీ updates కోసం ఉపయోగపడుతుంది.',
        waitMs: 8000,
        async run(page) {
            await page.getByText('Contact information').first().scrollIntoViewIfNeeded();
            await fillInput(page, 'Your Name', 'Demo User');
            await fillInput(page, 'Mobile Number', '9876543210');
            await fillInput(page, 'Email (optional)', 'demo.user@example.com');
        }
    },
    {
        id: 'estimate',
        narration:
            'తేదీలు మరియు సమయాలు సరైతే portal estimated price చూపిస్తుంది. daily rate మరియు partial day rules ప్రకారం లెక్కిస్తుంది. final amount admin review తర్వాత మారవచ్చు.',
        waitMs: 8000,
        async run(page) {
            const estimate = page.getByText('Estimated Price').first();
            if (await estimate.isVisible({ timeout: 8000 }).catch(() => false)) {
                await estimate.scrollIntoViewIfNeeded();
            }
        }
    },
    {
        id: 'submit-note',
        narration:
            'Submit Booking Request పై pending అభ్యర్థన వెళ్తుంది. confirmation message లో request number వస్తుంది. admin confirm చేసే వరకు తేదీలు reserve కావు.',
        waitMs: 8000,
        async run(page) {
            await page.getByRole('button', { name: 'Submit Booking Request' }).first().scrollIntoViewIfNeeded();
        }
    },
    {
        id: 'login',
        narration:
            'register అయిన users Login బటన్ ద్వారా sign in చేస్తారు. login తర్వాత My Bookings tab లో status, timing, amount తో అన్ని requests చూడవచ్చు.',
        waitMs: 8000,
        async run(page) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
            const loginBtn = page.getByRole('button', { name: 'Login' }).first();
            if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await loginBtn.click();
                await page.waitForTimeout(2500);
                await page.goBack({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
                await page.waitForTimeout(2000);
            }
        }
    },
    {
        id: 'admin',
        narration:
            'system administrators కు Admin Section లో booking reports, CSV export, pending మరియు confirmed queues, banner management, SMS settings ఉంటాయి. pending bookings review కోసం ముందు చూపబడతాయి.',
        waitMs: 9000,
        async run(page) {
            await page.goto('https://shabbirtech4-dev-ed.develop.my.site.com/urdushadikhana', {
                waitUntil: 'domcontentloaded',
                timeout: 120000
            });
            await page.getByText('Reservation Portal').first().waitFor({ timeout: 60000 });
            await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
        }
    },
    {
        id: 'footer',
        narration:
            'footer లో hall access, dining setup, utilities, parking, on-site support వంటి daily inclusions, contact number, escalation email for help ఉంటాయి.',
        waitMs: 8000,
        async run(page) {
            await page
                .getByText('Included with every booking day')
                .first()
                .scrollIntoViewIfNeeded()
                .catch(() => {});
        }
    },
    {
        id: 'outro',
        narration:
            'ఉర్దూ షాదిఖానా పోర్టల్ ప్రదర్శన ఇక్కడ ముగుస్తుంది. venue చూడండి, అందుబాటులో ఉన్న తేదీలు ఎంచుకోండి, అభ్యర్థన పంపండి, online లో approval track చేయండి. చూసినందుకు ధన్యవాదాలు.',
        waitMs: 9000,
        async run(page) {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
    }
];

async function fillInput(page, label, value) {
    const field = page.getByLabel(label).first();
    if (await field.isVisible({ timeout: 8000 }).catch(() => false)) {
        await field.click();
        await field.fill(value);
        await page.waitForTimeout(400);
    }
}

async function fillTextarea(page, label, value) {
    const field = page.getByLabel(label).first();
    if (await field.isVisible({ timeout: 8000 }).catch(() => false)) {
        await field.click();
        await field.fill(value);
        await page.waitForTimeout(400);
    }
}

async function pickAvailableRange(page) {
    const today = new Date();
    const candidates = [];

    for (let offset = 14; offset <= 45; offset += 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
        candidates.push(String(date.getDate()));
    }

    for (const dayLabel of candidates) {
        const startBtn = page
            .locator('button.calendar-day:not([disabled])')
            .filter({ hasText: new RegExp(`^${dayLabel}$`) })
            .first();

        if (!(await startBtn.isVisible({ timeout: 1500 }).catch(() => false))) {
            continue;
        }

        await startBtn.click();
        await page.waitForTimeout(900);

        const endBtn = page
            .locator('button.calendar-day:not([disabled])')
            .filter({ hasText: new RegExp(`^${dayLabel}$`) })
            .nth(1);

        if (await endBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            await endBtn.click();
            await page.waitForTimeout(900);
            return;
        }

        const nextDay = String(Number(dayLabel) + 1);
        const rangeEnd = page
            .locator('button.calendar-day:not([disabled])')
            .filter({ hasText: new RegExp(`^${nextDay}$`) })
            .first();

        if (await rangeEnd.isVisible({ timeout: 1500 }).catch(() => false)) {
            await rangeEnd.click();
            await page.waitForTimeout(900);
            return;
        }
    }
}
