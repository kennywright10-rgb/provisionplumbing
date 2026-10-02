# Provision Plumbing — Website

Static one-page site for Provision Plumbing, LLC (Gulf Shores, AL) with a lead form that emails the business through a Vercel serverless function.

```
index.html        # the whole site (inline CSS/JS, Google Fonts)
api/contact.js    # POST /api/contact → emails the lead via Resend
vercel.json       # clean URLs + basic security headers
```

## Deploy

1. Push to GitHub:
   ```bash
   git remote add origin https://github.com/kennywright10/provision-plumbing.git
   git push -u origin main
   ```
2. In Vercel: **Add New → Project → Import** the repo. Framework preset: **Other**. No build command.
3. Add environment variables (Settings → Environment Variables), then redeploy:
   - `RESEND_API_KEY` — from resend.com
   - `CONTACT_TO` — `provisionplumbingsvc@gmail.com` (comma-separate to add more)
   - `CONTACT_FROM` — optional, e.g. `Provision Plumbing <leads@provisionplumbingllc.com>` once a domain is verified in Resend

Without `RESEND_API_KEY` the form shows a "please call" fallback instead of failing silently.

## Before going live

- Confirm hours (Birdeye lists M–F 8–5; Google has none set).
- Swap the domain in `<link rel="canonical">` and the schema `url` if it isn't provisionplumbingllc.com.
- Swap in more job photos as Jimmy sends them (`images/`).
- Add the Alabama plumbing license number to the footer if Jimmy wants it shown.
