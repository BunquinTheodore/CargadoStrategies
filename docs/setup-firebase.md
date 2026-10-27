# Connect Firebase (accounts, dashboards and points)

The site's accounts (log in, the client, partner and admin dashboards, and points) run on Firebase. The project `cargadostrategies-b7dfd` already exists and its web config is in `site/assets/js/config.js` (those values are public by design). Until the steps below are done, the site keeps working: booking falls back to email, partner applications are still emailed to the owner, sign-in shows "Sign-in is being set up. Please try again soon.", and the admin actions answer "not configured".

You do this once. It takes about 30 minutes.

## What you need

- The Google account that owns the Firebase project.
- Access to the Vercel project for the site (to add environment variables).
- Node.js 22 or newer and this repository checked out (for one small script at the end).

## 1. Turn on sign-in

1. Open <https://console.firebase.google.com/>, choose the project, then **Build → Authentication → Get started**.
2. **Sign-in method → Add new provider → Email/Password**: enable the first switch (not "Email link") and save.
3. **Add new provider → Google**: enable it, choose the support email, save.
4. **Settings → Authorised domains**: add the site's domain (for example `www.cargadostrategies.ca` and `cargadostrategies.ca`) and the Vercel domain (`<project>.vercel.app`). `localhost` is there already.
5. Do **not** turn on Google Analytics for the project: the Privacy Policy says the site uses no analytics.

## 2. Create the database

1. **Build → Firestore Database → Create database**.
2. Location: **`northamerica-northeast1` (Montréal)** keeps the data in Canada. This cannot be changed later.
3. Start in **production mode**.

## 3. Publish the security rules

The rules in `firestore.rules` (in this repository) decide who can read and write what:

- a client reads their own profile, points history and bookings, and can edit only their name and phone;
- points, roles and bookings are written only by the site's server functions or by the admin;
- a partner reads their own profile, the referrals sent to them, and proposes profile changes that the owner reviews;
- the admin (the owner) can read and change everything.

To publish them: **Firestore Database → Rules**, replace everything with the contents of `firestore.rules`, press **Publish**.

(With the Firebase CLI instead: `npx firebase-tools login`, `npx firebase-tools init firestore` choosing this project and the existing `firestore.rules`, then `npx firebase-tools deploy --only firestore:rules`. Do not commit the generated `.firebaserc` if you prefer to keep the project ID out of the repo; it is not secret.)

## 4. Give the server its key

The functions under `api/` (bookings, points, admin actions, partner applications) use a service account.

1. **Project settings (gear) → Service accounts → Generate new private key**. A `.json` file downloads. **Keep it private**: anyone with it has full access to the database. Never commit it (put it in `secrets/`, which git ignores, or keep it outside the repository).
2. Add three environment variables in Vercel (Production and Preview), copied from that file:

```
vercel env add FIREBASE_PROJECT_ID        # "project_id", e.g. cargadostrategies-b7dfd
vercel env add FIREBASE_CLIENT_EMAIL      # "client_email"
vercel env add FIREBASE_PRIVATE_KEY       # "private_key", the whole value including the BEGIN/END lines
```

   Pasting the key with its `\n` sequences as they appear in the JSON is fine; the server turns them back into line breaks.

3. Add a random secret for the daily job that completes bookings:

```
vercel env add CRON_SECRET                # any long random text, e.g. from a password manager
```

   Vercel sends it automatically to `/api/cron/complete-bookings`, which runs every day at 09:00 UTC (`vercel.json`).

4. Redeploy (`vercel --prod`, or push) so the functions see the new variables.

## 5. Make yourself the admin

1. On the live site open `account.html` and sign up with the owner's email (or use "Continue with Google"). For email and password, open the verification email.
2. On your computer, in the repository folder:

```
node tools/make-admin.mjs owner@example.com --key=secrets/service-account.json
```

3. Sign out and back in: you now land on `admin.html`.

## How points work

- 5 points for each qualifying event, added automatically: a consultation the signed-in client booked is completed; the owner marks a service as acquired for the client in admin; a friend who signed up with the client's referral link completes their first consultation.
- Each event counts once, even if the daily job or a button runs twice (each award is stored under its event id).
- A booking becomes "completed" the day after its end time, unless the owner marked it cancelled or no-show in admin first.
- Manual adjustments in admin need a reason and show in the client's history.
- Points cannot be spent yet.

## How partner approval works

1. A professional applies on the For Professionals page (no login). The application is stored and emailed to the owner.
2. In admin, the owner approves or declines. On approval, if an account with the same **verified** email already exists it becomes a partner at once; otherwise the applicant gets an invitation email and becomes a partner on their first sign-in with that verified address.
3. To invite a different address, approve again with that email. Approval never publishes the partner on the site: `PARTNERS` in `config.js` stays hand-edited.

## What is stored

| Collection | Holds |
|---|---|
| `users/{uid}` | role (`client`, `partner`, `admin`), name, email, phone, points balance, referralCode, referredBy |
| `users/{uid}/points/{eventId}` | how each point was earned (kind, reason, date) |
| `bookings/{id}` | each consultation: time, contact details, status (`pending`, `confirmed`, `cancelled`, `no-show`, `completed`) |
| `partnerApplications/{id}` | each application and its status |
| `partners/{uid}` | an approved partner's profile, and proposed changes waiting for review |
| `acquisitions/{id}` | services the owner marked as acquired |
| `referrals/{id}` | referrals the owner assigned to partners |

## After setup: test the rules (optional, for a developer)

With Java installed, run the Firestore emulator and check the rules before changing them:

```
npx firebase-tools emulators:start --only firestore
```

Then, with `@firebase/rules-unit-testing` in a scratch folder (not this repository, which adds no dependencies), check at least: a client cannot change their own `role` or `points`; a client cannot read another user's profile, points or bookings; a client can read a booking whose `uid` is theirs or whose `email` is their verified email; a partner reads only referrals whose `partner` is their uid; nobody but the admin reads `partnerApplications`; the admin can read and write everything.

## Environment variables, all together

| Variable | Where it comes from | Needed for |
|---|---|---|
| `FIREBASE_PROJECT_ID` | service account JSON `project_id` | all server account features |
| `FIREBASE_CLIENT_EMAIL` | service account JSON `client_email` | the same |
| `FIREBASE_PRIVATE_KEY` | service account JSON `private_key` | the same |
| `CRON_SECRET` | any long random text | the daily job that completes bookings and awards points |
| `SITE_URL` (optional) | the live address, e.g. `https://www.cargadostrategies.ca` | links in partner invitations (otherwise the address the admin used) |
