import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const accountsStr = process.env.OUTLOOK_ACCOUNTS || "";
  const gmailUser = process.env.GMAIL_USER || "";
  
  const emails: string[] = [];
  
  if (accountsStr) {
    accountsStr.split(";").filter(Boolean).forEach(acc => {
      const [email] = acc.split(":");
      if (email && email.includes("@")) {
        emails.push(email.trim());
      }
    });
  }
  
  // If no outlook accounts are configured, fallback to GMAIL_USER if present
  if (emails.length === 0 && gmailUser) {
    emails.push(gmailUser);
  }
  
  // Also, if careers@kadellabs.com is not in the list but is desired as default, we can add it or make sure it's the first
  if (emails.length === 0) {
    emails.push("careers@kadellabs.com");
  }
  
  return NextResponse.json({ emails });
}
