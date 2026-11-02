import { z } from "zod";
import { infrai } from "./infrai";

export const campaignRequest = z.object({
  donorEmail: z.string().email(),
  volunteerEmail: z.string().email(),
  receiptNumber: z.string().min(1),
  reminderText: z.string().min(1)
});
export type CampaignRequest = z.infer<typeof campaignRequest>;

export async function shipCampaignEmail(input: unknown) {
  const campaign = campaignRequest.parse(input);
  const receipt = await infrai.email.send({ to: campaign.donorEmail, subject: `Receipt ${campaign.receiptNumber}`, html: `<p>Thank you for supporting our campaign. Receipt: ${campaign.receiptNumber}</p>` }, `receipt:${campaign.receiptNumber}`);
  const reminder = await infrai.email.send({ to: campaign.volunteerEmail, subject: "Volunteer reminder", html: `<p>${campaign.reminderText}</p>` }, `reminder:${campaign.receiptNumber}`);
  return { receiptMessageId: receipt.message_id, reminderMessageId: reminder.message_id };
}

export function reportEvents(events: Array<{ event: string }>) {
  return { opens: events.filter((event) => event.event === "open").length, bounces: events.filter((event) => event.event === "bounce").length };
}
