import { reportEvents } from "../src/campaign";

const report = reportEvents([{ event: "open" }, { event: "open" }, { event: "bounce" }, { event: "delivered" }]);
if (report.opens !== 2 || report.bounces !== 1) throw new Error(`unexpected report: ${JSON.stringify(report)}`);
console.log("campaign event decision: passed");
