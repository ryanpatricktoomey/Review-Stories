# Reps — Daily Review Push Notifications

**Status: code prepared, not activated.** Do **not** change `reps-push-config.js` to `enabled: true` until the Cloud Functions, secrets, and Firestore security rules are deployed. GitHub Pages alone cannot send push notifications.

## What students see

- Open the existing 🔔 bell without signing in to Google.
- Opt in (or unsubscribe) for review-ready notifications on **that device**.
- When Reps is installed as a home-screen app, a one-time explanatory prompt offers to opt in. It asks the system's permission **only after** the student taps to enable.
- iPhone/iPad: install to Home Screen and open the app first (iOS 16.4+).
- No push notifications are sent for personal replies. Signed-in users can still read their existing in-app reply notifications.

## What the teacher sees

- The existing Teacher Dashboard has **Notify Students**.
- It requires the authorized teacher Google account. The server verifies the teacher UID.
- After a confirmation, at most one announcement can be started per **Asia/Seoul** calendar date.
- The dashboard shows a count of messages accepted by push services (not a guarantee that phones displayed them). Failed/expired subscriptions are counted and expired endpoints removed.
- Avoid pressing if review files are incomplete. The notification links to the `#review-stories` section.

## Firebase setup required (project `review-stories-f251f`)

1. Check that the project has an active **Blaze** billing plan and Firebase Functions/Firestore are enabled.
2. Review the live Firestore rules *before* changes. **Preserve the existing student / Word Bank / chat rules.** Merge and deploy the **server-only** rules for collections `reviewPushSubscriptions` and `reviewPushAnnouncements`. The repository's `english-corner.firestore.rules` is explicitly *proposed only*, not automatically deployed. Push subscriptions contain device endpoint and encryption keys and **must not be publicly readable or writable**.
3. Install the Firebase CLI and sign in:
   ```bash
   npm install -g firebase-tools
   firebase login
   cd functions
   npm install
   cd ..
   ```
4. Create a **new** VAPID key pair (keep the private key secret):
   ```bash
   npx web-push generate-vapid-keys --json
   ```
5. In the project, configure Firebase Function secrets. Paste the matching key values when prompted:
   ```bash
   firebase functions:secrets:set REPS_VAPID_PUBLIC_KEY --project review-stories-f251f
   firebase functions:secrets:set REPS_VAPID_PRIVATE_KEY --project review-stories-f251f
   ```
6. Deploy only the three Functions:
   ```bash
   firebase deploy --only functions:manageReviewPush,functions:reviewPushStatus,functions:sendReviewReady --project review-stories-f251f
   ```
7. Edit `reps-push-config.js`: set `vapidPublicKey` to the **public** VAPID key and `enabled: true`. Confirm the deployed `manageReviewPush` endpoint matches `manageEndpoint` (region: `asia-northeast3`). Commit it to GitHub. The **private** VAPID key must never be committed or entered into browser JavaScript.
8. Install Reps on a test phone; visit Notifications, tap Enable, accept the OS permission. Confirm a subscription document was written and verify the Teacher Dashboard can query daily status.
9. Test with a *single consenting* device in a controlled environment before notifying the full class. This sender deliberately blocks sending twice on the same Korea date.

## Troubleshooting

- The announcement is intentionally **off** until backend configuration is complete. In this state the student page displays a setup message and the teacher send button is disabled.
- Cloud Functions are necessary because GitHub Pages is static hosting. The Teacher Dashboard must not expose push credentials or send private push HTTP requests directly.
- On iPhone, browser-tab push permission is not supported; install Reps as a Home Screen app first.
- Push permissions are per device, not per Google profile.
- If the send function reports a partial failure or error, check Firebase Functions logs. The once-per-day lock may already exist. Do **not** simply delete it and resend: phones that received the first attempt might receive a duplicate.
- Logs show delivery acceptance by a push service, not that a device displayed the alert.

## Security

- Anonymous **subscriptions** are intentionally permitted via the dedicated HTTP function, with strict endpoint validation and origin checks; clients cannot browse the list.
- Only the teacher's signed-in Google identity can invoke `sendReviewReady`.
- Endpoints and encryption keys are stored in a server-only Firestore collection. The VAPID private key is a Firebase secret.
- Public activity caching in Reps stores only published activity fields in the local device's browser storage, never student profiles, replies, or private account data.
