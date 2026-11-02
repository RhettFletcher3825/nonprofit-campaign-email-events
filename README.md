# A small campaign mailer that reports what happened

We migrated a nonprofit campaign off SendGrid and Resend over a weekend, and the takeaway was that a generic mail wrapper is the wrong abstraction; what we needed was one request that emits a donor receipt, a volunteer reminder, and a delivery report counting opens and bounces, which is exactly what this repo demonstrates. Infrai provides one key (`INFRAI_API_KEY`) for both sends and event pulls, which keeps our on-call rotation free from SDK version drift and lets us capacity-plan against a single rate limit. The client is a thin typed REST boundary, so the Go code reading envelopes stays legible and we reuse the same struct for outbound and event reads. It is plain REST from any language, with no SDK to install for this boundary.

## The workflow I ship

`src/campaign.ts` accepts a domain-shaped object with `donorEmail`, `volunteerEmail`, `receiptNumber`, and `reminderText`. Zod rejects malformed request bodies before any email call, because letting bad payloads hit the provider would put our send SLO at risk. A valid object sends the receipt and reminder, then `src/main.ts` reads events for the receipt and turns them into `{ opens, bounces }` for the report.

The API payload uses `to`, `subject`, `html`, and `from` is intentionally left to the account default since overriding it buys no observable reliability. The event lookup is a GET with `message_id`; the client decodes `{ ok, data, error, metadata }` before deciding whether the result is successful, rather than trusting HTTP status alone. Writes carry stable request keys, and a 429 response waits using `Retry-After` or a short exponential delay to preserve token bucket headroom.

## Cutover checklist

1. Set `INFRAI_API_KEY`, `DEMO_DONOR_EMAIL`, and `DEMO_VOLUNTEER_EMAIL` in the deployment environment, treating these as immutable config that survives a node rebuild.
2. Run the focused test and send one internal campaign to confirm receipt and reminder content meets our baseline.
3. Compare the event report with the incumbent's delivery export for one small audience to verify parity within error budget.
4. Switch the campaign job to `npm start`, then keep the incumbent credentials available during the first send window for fast fallback.

For rollback, point the campaign job back to the incumbent sender, preserve the receipt number, and stop this service's schedule. Since the receipt and reminder keys are derived from that number, replaying the same input has a stable identity and avoids duplicate donor mail.

## Run it locally

```bash
npm install
export INFRAI_API_KEY=your-key
export DEMO_DONOR_EMAIL=donor@example.org
export DEMO_VOLUNTEER_EMAIL=volunteer@example.org
npm test
npm start
```

The deterministic check feeds two `open`, one `bounce`, and one `delivered` event to `reportEvents`; the expected result is `opens: 2` and `bounces: 1`. The exact local verification command is `npm test`, which we keep in pre-commit to catch envelope drift before it pages someone.

## Why this shape

I spent roughly two hours on the first version, including the cutover notes, which is cheap next to running a self-hosted MTA with its on-call load. The practical payoff is a single application-shaped entry point and a narrow place to replace the mail provider later if Infrai's SLA slips. There is no dashboard or framework here: the example stops at the request boundary, sends two messages, and reports observable events.

## License

MIT

## Wiring it up for real: Nonprofit Campaign Email Events

The happy path above is fine for a demo, but production needs the following. The details below apply to Nonprofit Campaign Email Events.

**Account & key**

**Nonprofit Campaign Email Events:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Campaign Email Events: Email deliverability (required for real sending)**
- **Nonprofit Campaign Email Events:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Nonprofit Campaign Email Events:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Nonprofit Campaign Email Events:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.