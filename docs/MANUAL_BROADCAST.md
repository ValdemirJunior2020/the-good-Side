# Manual news and push sending

Netlify hosts the admin dashboard at `apps/admin` after configuration/deployment.

## Editorial flow

1. Sign in as a user carrying a trusted Firebase custom claim `admin: true`.
2. In **Manual news**, add headline, original publisher, source HTTPS URL, source date, category and factual summary.
3. Verify the article link, then approve it in Review queue.
4. In **Send notification**, choose that approved story and the matching-category or all-opted-in audience.
5. Preview eligible users/devices and explicitly confirm.
6. Inspect **Delivery logs** for Expo push accepted/error statuses.

This first version limits a manual send to 75 devices to avoid long-running requests and Apps Script quota failure. The user must have notification permissions and an enabled token. The system cannot assert handset delivery based on Expo acceptance.

**Security and correctness:** Non-admins are rejected by Firebase custom claims in the Node API. The browser does not contain the Apps Script secret. Only an approved article with a publisher and valid HTTPS source is sendable. Reuse an identical `request_id` on a retry for idempotency; the current dashboard creates one request ID per fresh send. Users who opt out are excluded.

**Next scale step:** transactional notification queue with worker retries, persistent batch progress, Expo receipt polling, deep link testing, quiet hours, country/language targeting, and admin content revisions. Google Sheets is not a reliable large-volume delivery queue.

**No deployment yet:** commit does not configure a Netlify site, Firebase, or Google Apps Script deployment; configure these services as documented in SETUP.md.
