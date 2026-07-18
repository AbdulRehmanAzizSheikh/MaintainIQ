export default function roleAssignedEmail({
  username,
  role,
  loginUrl,
}: {
  username: string;
  role: string;
  loginUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background:#eff2f7; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 40px rgba(15,23,42,.1);">
        <div style="background:#2563eb; color:#ffffff; padding:24px; text-align:center;">
          <h1 style="margin:0; font-size:24px;">Role Updated</h1>
        </div>
        <div style="padding:24px; color:#0f172a;">
          <p style="margin:0 0 16px; font-size:16px;">Hello ${username},</p>
          <p style="margin:0 0 16px; font-size:15px; color:#334155;">
            Your account role has been updated to <strong>${role}</strong>.
          </p>
          <p style="margin:0 0 24px; font-size:15px; color:#334155;">
            You can now sign in and access the features allowed for your new role.
          </p>
          <div style="text-align:center; margin-bottom:24px;">
            <a href="${loginUrl}" style="display:inline-block; padding:14px 22px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:10px; font-weight:700;">Sign in to MaintainIQ</a>
          </div>
          <p style="margin:0; font-size:14px; color:#64748b;">If you did not expect this role change, please contact your administrator.</p>
        </div>
        <div style="background:#f8fafc; padding:16px; color:#475569; font-size:13px; text-align:center;">
          MaintainIQ — User role notification
        </div>
      </div>
    </div>
  `;
}
