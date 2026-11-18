import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/publicOrigin";
import { safeNext } from "@/lib/safeNext";

/**
 * Landing point of the links sent by email.
 *
 * The template carries `{{ .TokenHash }}` instead of `{{ .ConfirmationURL }}`, so the link is
 * self-contained: it is verified here, on whatever device opened it. Nothing depends on the
 * browser that asked for the email, which is what broke the reset on a phone.
 *
 * `code` is still accepted for links sent before the template changed (PKCE, same device only).
 */
const OTP_TYPES = ["recovery", "email", "signup", "invite", "magiclink", "email_change"] as const;
type OtpType = (typeof OTP_TYPES)[number];

function isOtpType(value: string): value is OtpType {
  return (OTP_TYPES as readonly string[]).includes(value);
}

function go(url: string) {
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = publicOrigin(request);
  const type = searchParams.get("type") ?? "";
  // a recovery link with no usable destination belongs on the password form, not on the path
  const next = safeNext(searchParams.get("next"), type === "recovery" ? "/login/reset" : "/learn");
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");

  const supabase = await createClient();

  if (tokenHash && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return go(`${origin}${next}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return go(`${origin}${next}`);
  }

  // A dead recovery link belongs on the reset page: it offers to send a fresh one.
  const target = type === "recovery" || next.startsWith("/login/reset") ? "/login/reset" : "/login?error=link";
  return go(`${origin}${target}`);
}
