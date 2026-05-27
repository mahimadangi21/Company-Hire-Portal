import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getInterviewUrl } from "@/lib/utils";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function formInviteEmailTemplate(
  candidateName: string,
  jobRole: string,
  candidateId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${baseUrl}/candidate-form/${candidateId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Candidate Form Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:#3b82f6;border-radius:8px;display:inline-block;vertical-align:middle;"></div>
              <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;margin-left:10px;">kadellabs</span>
            </div>
            <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">Candidate Form Portal</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Form Invitation</p>
            <h1 style="color:#0f172a;font-size:26px;font-weight:700;margin:0 0 16px;line-height:1.3;">Hello, ${candidateName} 👋</h1>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
              Please complete your candidate form for the <strong style="color:#0f172a;">${jobRole}</strong> position. 
              This is a required step before we proceed with your application.
            </p>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                    Fill Candidate Form →
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;line-height:1.6;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${link}" style="color:#3b82f6;word-break:break-all;">${link}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              This is a one-time link. Do not share it with anyone else.<br>
              © 2025 kadellabs. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
function inviteEmailTemplate(
  candidateName: string,
  jobRole: string,
  interviewId: string,
  expiresAt: string
): string {
  const link = getInterviewUrl(interviewId);
  const expiryDate = new Date(expiresAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Invitation</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:#3b82f6;border-radius:8px;display:inline-block;vertical-align:middle;"></div>
              <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;margin-left:10px;">kadellabs</span>
            </div>
            <p style="color:#93c5fd;margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">AI Video Interview Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Interview Invitation</p>
            <h1 style="color:#0f172a;font-size:26px;font-weight:700;margin:0 0 16px;line-height:1.3;">Hello, ${candidateName} 👋</h1>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
              You've been invited to complete a video interview for the <strong style="color:#0f172a;">${jobRole}</strong> position. 
              Our AI-powered platform will guide you through the process.
            </p>
            
            <!-- Info Box -->
            <div style="background:#f1f5f9;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;">
                    <span style="color:#64748b;font-size:13px;">Position</span>
                    <div style="color:#0f172a;font-weight:600;font-size:15px;margin-top:2px;">${jobRole}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-top:1px solid #e2e8f0;margin-top:8px;">
                    <span style="color:#64748b;font-size:13px;margin-top:8px;display:block;">Link expires</span>
                    <div style="color:#dc2626;font-weight:600;font-size:15px;margin-top:2px;">${expiryDate}</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- What to expect -->
            <h3 style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 12px;">What to expect:</h3>
            <ul style="color:#475569;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 28px;">
              <li>The AI will ask you questions using voice</li>
              <li>You control when to start and stop recording each answer</li>
              <li>Your webcam will be on during the interview</li>
              <li>Ensure you are in a quiet, well-lit space</li>
            </ul>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;letter-spacing:0.3px;">
                    Begin Interview →
                  </a>
                </td>
              </tr>
            </table>
            
            <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;text-align:center;line-height:1.6;">
              If the button doesn't work, copy and paste this link:<br>
              <a href="${link}" style="color:#3b82f6;word-break:break-all;">${link}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">
              This is a one-time link. Do not share it with anyone else.<br>
              © 2025 kadellabs. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function completionEmailTemplate(
  candidateName: string,
  jobRole: string,
  reviewUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Interview Completed</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;text-align:center;">
            <div style="width:32px;height:32px;background:#10b981;border-radius:8px;display:inline-block;vertical-align:middle;"></div>
            <span style="color:#fff;font-size:20px;font-weight:700;vertical-align:middle;margin-left:10px;">kadellabs</span>
            <p style="color:#6ee7b7;margin:8px 0 0;font-size:13px;">Interview Completed ✓</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="color:#0f172a;font-size:24px;font-weight:700;margin:0 0 16px;">
              🎉 Interview Recording Ready
            </h1>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
              <strong>${candidateName}</strong> has completed their video interview for the <strong>${jobRole}</strong> position. 
              The recording is now available for review in your dashboard.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:12px;">
                    Review Interview →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 kadellabs. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, candidateName, jobRole, interviewId, expiresAt, reviewUrl, candidateId } = body;

    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject = "";
    let html = "";

    if (type === "invite") {
      subject = `Your Interview Invitation — ${jobRole} Position`;
      html = inviteEmailTemplate(candidateName, jobRole, interviewId, expiresAt);
    } else if (type === "form_invite") {
      subject = `Candidate Form — ${jobRole} Position`;
      html = formInviteEmailTemplate(candidateName, jobRole, candidateId);
    } else if (type === "completion") {
      subject = `Interview Completed: ${candidateName} — ${jobRole}`;
      html = completionEmailTemplate(candidateName, jobRole, reviewUrl);
    } else {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"kadellabs" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
