import { campaignRequest, reportEvents, shipCampaignEmail } from "./campaign";
import { infrai } from "./infrai";

const input = { donorEmail: process.env.DEMO_DONOR_EMAIL ?? "donor@example.org", volunteerEmail: process.env.DEMO_VOLUNTEER_EMAIL ?? "volunteer@example.org", receiptNumber: "spring-2026-001", reminderText: "Please confirm Saturday's community pickup." };
campaignRequest.parse(input);
const sent = await shipCampaignEmail(input);
const events = await infrai.email.event.list(sent.receiptMessageId);
console.log({ sent, report: reportEvents(events) });
