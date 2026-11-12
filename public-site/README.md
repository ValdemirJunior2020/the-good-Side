# The Good Side public website

Public editorial website for **thegoodsidenews.com**, hosted separately from the existing private Command Center.

- Source: `public-site/`
- Deployment: Netlify **the-good-side-news**
- Root repository: `ValdemirJunior2020/the-good-Side`
- Production branch: `feature/hybrid-render-local-ai`
- Netlify base directory: `public-site`
- Build command: **leave blank** (static HTML/CSS/JS)
- Publish directory: `.` (relative to base directory)
- Public API: `https://the-good-side-api.onrender.com/news?limit=50`
- No secrets or contact lists stored in the browser.
- The public website links to original reporting; it does not republish articles in full.

## DNS
After adding the custom domain to the **new public site only**, follow Netlify's exact DNS instructions in GoDaddy for `thegoodsidenews.com` and `www`. Avoid editing existing MX, TXT and mail records. Do **not** point the private Command Center at the public domain.

## Email
`infojr.83@gmail.com` is a public contact/reply address. For automated verification/reset mail, use Supabase SMTP via a domain-authenticated provider. No Gmail password or app-password should go into GitHub or the client bundle.

## Future
Replace iOS Coming Soon with an actual App Store link only after the app has been approved and published. Review legal/privacy disclosures before public distribution.
