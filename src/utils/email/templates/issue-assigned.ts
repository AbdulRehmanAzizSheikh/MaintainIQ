export default function issueAssignedEmail({
  technicianName,
  issueTitle,
  assetName,
  issueUrl,
  priority,
  status,
}: {
  technicianName: string;
  issueTitle: string;
  assetName: string;
  issueUrl: string;
  priority: string;
  status: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 16px 48px rgba(15,23,42,.15);">
        <div style="background:#0ea5e9; color:#ffffff; padding:24px; text-align:center;">
          <h1 style="margin:0; font-size:24px;">New maintenance task assigned</h1>
        </div>
        <div style="padding:24px; color:#0f172a;">
          <p style="margin:0 0 16px; font-size:16px;">Hello ${technicianName},</p>
          <p style="margin:0 0 16px; font-size:15px; color:#334155;">
            A new issue has been assigned to you. Please review the details and take action as soon as possible.
          </p>
          <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700; width:30%;">Issue</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0;">${issueTitle}</td>
            </tr>
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700;">Asset</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0;">${assetName}</td>
            </tr>
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700;">Priority</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0;">${priority}</td>
            </tr>
            <tr>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0; font-weight:700;">Status</td>
              <td style="padding:10px; background:#f8fafc; border:1px solid #e2e8f0;">${status.replace("_", " ")}</td>
            </tr>
          </table>
          <div style="text-align:center; margin-bottom:24px;">
            <a href="${issueUrl}" style="display:inline-block; padding:14px 22px; background:#0ea5e9; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;">View issue details</a>
          </div>
          <p style="margin:0; font-size:14px; color:#475569;">If you have any questions, open the maintenance dashboard and confirm the task status after you start work.</p>
        </div>
        <div style="background:#f8fafc; padding:16px; color:#64748b; font-size:13px; text-align:center;">
          MaintainIQ — Maintenance task notification
        </div>
      </div>
    </div>
  `;
}
