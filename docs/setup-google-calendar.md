# Connect Google Calendar to the booking page

The Contact page lets visitors book a free 10-minute consultation, every day from 3:30 pm to 9:00 pm Winnipeg time (the last start is 8:50 pm). Until Google Calendar is connected, the page still works: each request is emailed to the owner with the time the visitor chose, and the visitor is told the time will be confirmed by email. Once it is connected, each booking becomes a calendar event with a Google Meet link, the visitor gets the calendar invitation, and both sides get a confirmation email.

You do this once. It takes about 20 minutes.

## What you need

- The Google account whose calendar should hold the bookings (a personal Gmail works).
- Access to the Vercel project for the site (to add environment variables).
- Node.js 22 or newer on your computer, and this repository checked out (to run one small script).

## 1. Create a Google Cloud project and turn on the Calendar API

1. Go to <https://console.cloud.google.com/> signed in with the booking Google account.
2. At the top, open the project picker and choose **New project**. Name it, for example, `Cargado Booking`. Create it and make sure it is selected.
3. Open **APIs and services → Library**, search for **Google Calendar API**, open it and press **Enable**.

## 2. Set up the consent screen

1. Open **APIs and services → OAuth consent screen** (in newer consoles: **Google Auth platform → Branding**).
2. User type: **External**. App name: `Cargado Strategies booking`. Support email and developer email: your own address. Save.
3. Under **Audience** (or **Test users**), add the booking Google account as a test user.
4. **Publish the app** (Audience → **Publish app**, status "In production"). You do not need Google's verification for your own account; you will see an "unverified app" warning once when you authorise, which is expected. If you leave it in "Testing", Google expires the refresh token after 7 days and bookings fall back to email.

## 3. Create the OAuth client

1. Open **APIs and services → Credentials → Create credentials → OAuth client ID** (or **Google Auth platform → Clients → Create client**).
2. Application type: **Desktop app**. Name: `Booking token`. Create.
3. Copy the **Client ID** and the **Client secret**. Keep the secret private.

## 4. Get the refresh token (one time)

In a terminal, in the repository folder:

```
node tools/google-auth.mjs --client-id=YOUR_CLIENT_ID --client-secret=YOUR_CLIENT_SECRET
```

1. The script prints a link. Open it in the browser where you are signed in to the booking Google account.
2. Choose that account. If Google says the app is unverified, choose **Advanced → Go to Cargado Strategies booking**.
3. Allow both permissions (see and edit events, see free/busy). The browser then says "Done".
4. The terminal prints a long `GOOGLE_REFRESH_TOKEN`. Copy it. It is shown only this once and is not saved anywhere; if you lose it, run the script again.

The token lets the site read when you are busy and create events in your calendar. It cannot read your email. To revoke it at any time, go to <https://myaccount.google.com/permissions> and remove the app; bookings then fall back to email until you run the script again.

## 5. Find the calendar ID

- To use your main calendar, the calendar ID is your Gmail address (for example `name@gmail.com`). You can also leave `GOOGLE_CALENDAR_ID` unset, which means the main calendar.
- To use a separate calendar, open Google Calendar → **Settings** → the calendar under "Settings for my calendars" → **Integrate calendar** → **Calendar ID**.

Busy times are read from this calendar only. Anything already in it during 3:30-9:00 pm hides those slots from visitors.

## 6. Add the environment variables in Vercel

With the Vercel CLI, in the repository folder (each command asks for the value; choose Production, and Preview if you want booking on preview links too):

```
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add GOOGLE_CALENDAR_ID
```

Optional:

```
vercel env add BOOKING_NOTIFY_EMAIL
```

`BOOKING_NOTIFY_EMAIL` is where booking notices go. Without it they go to the same inbox as the website inquiries (`malee.holgado@mygreatway.ca`). Email is sent through Resend with the existing `RESEND_API_KEY` (and `RESEND_FROM`, if set).

Or in the dashboard: Vercel → the project → **Settings → Environment Variables** → add each name and value.

Then redeploy (Vercel → **Deployments** → the latest → **Redeploy**, or `vercel --prod`). Environment variables only take effect on a new deployment.

## 7. Check it works

1. Open the Contact page on the live site and pick a date. Times you are busy in Google Calendar should be missing.
2. Book a slot with your own second email address.
3. You should see the event with a Meet link in your calendar, the second address should get the invitation and a confirmation email, and the notice inbox should get a "New booking" email.

If instead you get a "Booking request to confirm" email, the site could not reach Google: check the four values in Vercel, that you redeployed, and that the consent screen is published (step 2.4).

## Local testing (optional)

Put the same names in `.env.local` in the repository folder (it is gitignored; never commit it). The `api/` functions read them under `vercel dev`.

## How it behaves

- Slots are 10 minutes, back to back, every day, 3:30 pm to 8:50 pm Central Time (Winnipeg; daylight saving is handled).
- A slot must be at least 2 hours away and at most 60 days ahead.
- One upcoming booking per email address at a time.
- Each IP address can send at most 5 booking requests in 10 minutes (best effort, per server instance).
- If Google is not connected or answers with an error, nothing is lost: you get the request by email and confirm the time by hand.
