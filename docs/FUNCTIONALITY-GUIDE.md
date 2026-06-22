# Urdu Shadikhana — End-to-End Functionality Guide

This document describes **what the portal does** from a business and user perspective: roles, screens, booking lifecycle, pricing, notifications, and administration.

---

## 1. Solution overview

**Urdu Shadikhana** (also deployable as **Urdu Shadi Khanana**) is a Salesforce Experience Cloud booking portal for a community hall / event venue in Nandalur, Andhra Pradesh. Customers request dates online; administrators review, confirm, and manage pricing. The calendar reflects **confirmed** bookings; pending requests do not block the public calendar until approved.

### Primary goals

- Allow guests and registered users to submit booking requests online
- Prevent double-booking of confirmed dates
- Provide transparent pricing estimates (₹8,000/day default, time-adjusted)
- Notify admin and customers via SMS (Twilio)
- Give administrators a single portal for queue management, reports, banners, and settings

---

## 2. User roles

| Role | Access | How they sign in |
|------|--------|------------------|
| **Guest (public)** | Home page, venue info, submit booking request, view own request flow | No login required (guest access enabled) |
| **Community user** | Same as guest + My Bookings, Booking Data views | Experience Cloud login / self-registration |
| **System Administrator** | Full portal including Administration (queue, reports, SMS, banners, login notes) | Salesforce user with System Administrator profile |

---

## 3. Portal navigation

The left sidebar provides these sections:

| Tab | Who sees it | Purpose |
|-----|-------------|---------|
| **Home** | Everyone | Venue overview, photo gallery, location map, booking request form, calendar |
| **My Bookings** | Logged-in users | List of bookings created by the signed-in user |
| **Booking Data** | Logged-in users | Read-only list of booking records (paginated) |
| **Administration** | System admins only | Booking queue, reports, SMS settings, banners, portal login notes |

Administration expands into sub-sections: Booking Queue, Booking Report, SMS Notifications, Banner Messages, Portal Login Notes.

---

## 4. Home page — guest & customer flow

### 4.1 Venue presentation

- Header with hall exterior image and portal branding
- **Photo gallery** — exterior, interior, dining area (static resources)
- **Location** — Google Maps embed with venue address (Nandalur, YSR Kadapa, Andhra Pradesh)
- **Included per day** footer — bilingual (English + Telugu) list of services included at the daily rate
- **Contact & Escalation** — phone and email for support

### 4.2 Booking request form

Customers complete:

| Field | Required | Validation |
|-------|----------|------------|
| From Date | Yes | Cannot select past dates; cannot select dates blocked on calendar |
| To Date | Yes | Must be on or after From Date |
| Mobile Number | Yes | Exactly 10 digits (India) |
| Event Name | Yes | Text |
| Contact Name | Yes | Text |
| Contact Email | Optional | Email format |
| Event Start / End Time | Optional | 12-hour picker; used for pricing |
| Event Details / Notes | Optional | Long text |

**Submit Request** is disabled until all mandatory fields are valid.

### 4.3 Calendar behaviour

| Calendar state | Meaning | Can select for new request? |
|----------------|---------|----------------------------|
| Available (white/green) | No confirmed booking on that date | Yes |
| Pending (shown in lists) | Request awaiting admin action | **No** — reserved on form calendar |
| Confirmed (blocked) | Admin approved | **No** |
| Past date | Before today | **No** |

> Pending and confirmed dates are **not selectable** on the booking form calendar. Only **confirmed** bookings block the shared public calendar display for other users.

### 4.4 Price estimate

Before submit, the portal calculates an **estimated amount**:

- Default rate: **₹8,000 per day** (configurable in admin settings)
- Multi-day bookings: rate × number of calendar days in range
- Same-day events: partial-day multiplier based on start/end time (hours occupied)
- Final amount is subject to admin approval (shown in footer disclaimer)

### 4.5 Submit booking

On successful submit:

1. A `Shadikhana_Booking__c` record is created with status **Pending**
2. Estimated amount and daily rate are stored on the record
3. Admin receives SMS notification (if SMS enabled)
4. User sees success confirmation
5. Calendar refreshes; pending dates appear reserved on the form

---

## 5. Booking lifecycle

```
┌──────────┐     Admin confirms      ┌───────────┐
│ Pending  │ ───────────────────►  │ Confirmed │
└──────────┘                       └───────────┘
     │                                    │
     │ Admin cancels                      │ Admin cancels
     ▼                                    ▼
┌──────────┐                       ┌───────────┐
│ Cancelled│ ◄──────────────────── │ Cancelled │
└──────────┘                       └───────────┘
```

| Status | Calendar impact | Final amount | SMS |
|--------|-----------------|--------------|-----|
| **Pending** | Form calendar blocked; not shown as confirmed to others | Estimated amount stored | Admin notified on create |
| **Confirmed** | Public calendar blocked for date range | Admin can set final price | Customer confirmation SMS |
| **Cancelled** | Dates released | Set to **₹0** automatically; price cannot be edited | — |

### Business rules

- **Confirm:** Blocked if dates overlap another **confirmed** booking
- **Confirm:** Does **not** auto-cancel overlapping pending requests
- **Cancel:** Sets `Final_Amount__c = 0` and hides Save Price in admin UI
- **Duplicate prevention:** Apex validates overlapping pending/confirmed ranges on create

---

## 6. Logged-in user features

### My Bookings

- Shows bookings where `Booked_By__c` = current user
- Displays status, dates, event name, amounts
- Read-only for non-admin users

### Booking Data

- Paginated table of booking records accessible to the user
- Page size options: 5, 10, 15 … 50

---

## 7. Administration (System Administrator)

### 7.1 Booking Queue

- Lists all booking requests (newest first)
- Filter/search by status, contact, event, dates
- Actions per booking:
  - **Confirm** — approves and blocks calendar
  - **Cancel** — cancels and zeroes final price
  - **Save Price** — set final approved amount (hidden for cancelled)
- View booking detail panel with contact info, times, notes, pricing

### 7.2 Booking Report

- **Monthly report** — select month/year
- **Custom range** — up to 6 months
- Summary: total bookings, counts by status, estimated vs final amounts
- Day-by-day breakdown with events listed per date
- Export-friendly tabular view in portal

### 7.3 SMS Notifications

Configure org-wide SMS settings:

| Setting | Purpose |
|---------|---------|
| SMS Enabled | Master switch |
| Admin Mobile Number | Receives new booking alerts |
| Twilio Account SID / Auth Token / From Number | Twilio integration |
| Notifications Enabled | Push/notification features |

Test SMS can be sent from admin panel when configured.

### 7.4 Banner Messages

- Create/edit/delete portal banners
- Fields: title, message, active flag, style (info/warning/success), sort order
- Active banners display at top of portal pages

### 7.5 Portal Login Notes

- Configure heading, message, admin username hint, password hint
- Displayed on Experience Cloud login page via `shadikhanaLoginNotes` component

---

## 8. Notifications

### SMS (Twilio)

| Event | Recipient | When |
|-------|-----------|------|
| New booking request | Admin mobile | On `createBooking` (Pending) |
| Booking confirmed | Customer mobile | On status → Confirmed |

SMS requires Twilio credentials and `Shadikhana_Twilio_Callout` permission.

### In-app

- Toast messages for success/error on all major actions
- Banner messages for org announcements

---

## 9. Scheduled maintenance

**Cancelled booking cleanup** runs monthly (5th at midnight, org timezone):

- Deletes **Cancelled** bookings whose `Booking_Date__c` falls in the **previous calendar month**
- Keeps org data tidy without removing active or confirmed history

---

## 10. Bilingual footer & accessibility

- Footer shows **English and Telugu** for inclusions, contact labels, and pricing disclaimer
- Compact two-column layout on desktop; stacks on mobile
- Contact phone and email are clickable links

---

## 11. Typical end-to-end scenarios

### Scenario A — Guest books a wedding date

1. Guest opens portal URL (no login)
2. Browses gallery and map on Home
3. Selects From Date = 15 Jan, To Date = 17 Jan
4. Enters event name, contact name, 10-digit mobile
5. Reviews price estimate (3 days × ₹8,000 = ₹24,000 estimated)
6. Clicks **Submit Request**
7. Admin receives SMS; booking status = Pending
8. Admin opens Administration → confirms booking
9. Customer receives confirmation SMS; calendar shows dates as confirmed

### Scenario B — Admin adjusts final price

1. Admin opens Booking Queue → selects pending/confirmed booking
2. Enters final negotiated amount (e.g. ₹20,000)
3. Clicks **Save Price**
4. `Final_Amount__c` updated; visible in reports

### Scenario C — Admin cancels a booking

1. Admin clicks **Cancel** on booking
2. Status → Cancelled, Final Amount → ₹0
3. Dates become available on calendar again
4. Record deleted automatically after month-end cleanup (if in previous month)

---

## 12. Out of scope / limitations

- No online payment collection (pricing is informational + admin-managed)
- No automatic approval — all bookings start as Pending
- Scratch orgs expire after 30 days (use Developer Edition for permanent hosting)
- Twilio credentials must be configured per org for SMS

---

## 13. Related documents

- [Deployment Guide](DEPLOYMENT-GUIDE.md) — install in new orgs
- [Technical Documentation](TECHNICAL-DOCUMENTATION.md) — architecture and APIs
