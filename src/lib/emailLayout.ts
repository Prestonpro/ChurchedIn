import "server-only";

/**
 * Escapes a string for safe interpolation into HTML email markup. Every
 * template in emailTemplates.ts must run user-controlled content (names,
 * event titles, messages) through this before interpolating — these values
 * ultimately render in another person's inbox, so unescaped input would be
 * a real HTML-injection vector, not just a cosmetic bug.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND_NAME = "ChurchedIn";
const COLOR_BRAND = "#409688"; // --color-brand-600
const COLOR_BRAND_DARK = "#327b6f"; // --color-brand-700
const COLOR_BG = "#f1f8f7"; // --color-brand-50
const COLOR_INK = "#2b2420";
const COLOR_INK_SOFT = "#5c5248";
const COLOR_INK_FAINT = "#a99e90";
const COLOR_BORDER = "#e8e2d9";

const FONT_STACK =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type EmailCta = {
  label: string;
  url: string;
};

export type EmailLayoutOptions = {
  /** Hidden preview text shown in inbox lists (Gmail, Apple Mail, etc.) before the email is opened. */
  preheader: string;
  heading: string;
  /** Pre-built HTML for the body — callers are responsible for escapeHtml() on any interpolated values. */
  bodyHtml: string;
  cta?: EmailCta;
  footerNote?: string;
};

/**
 * Wraps template-specific content in the shared branded shell: wordmark
 * header, white content card, bulletproof table-based CTA button, footer.
 * Table-based layout with fully inlined styles throughout — this is a
 * deliberate email-HTML constraint, not a stylistic choice: Outlook desktop
 * renders email via Word's engine (no flexbox/grid, unreliable external/
 * <style>-block CSS), so tables + inline styles are what actually renders
 * consistently across clients. A system-font fallback stack covers clients
 * that don't load the web font at all.
 */
export function renderEmailLayout({
  preheader,
  heading,
  bodyHtml,
  cta,
  footerNote,
}: EmailLayoutOptions): string {
  const ctaHtml = cta
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0 4px 0;">
                <tr>
                  <td style="border-radius:10px; background-color:${COLOR_BRAND};">
                    <a href="${escapeHtml(cta.url)}" style="display:inline-block; padding: 13px 26px; font-family: ${FONT_STACK}; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:10px;">${escapeHtml(cta.label)}</a>
                  </td>
                </tr>
              </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(heading)}</title>
<!--[if !mso]><!-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
</style>
<!--<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${COLOR_BG}; font-family: ${FONT_STACK};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR_BG};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%; max-width:600px; background-color:#ffffff; border-radius:16px;">
          <tr>
            <td style="padding: 32px 40px 20px 40px;">
              <span style="font-family: ${FONT_STACK}; font-size:17px; font-weight:800; color:${COLOR_BRAND};">${BRAND_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 40px 8px 40px;">
              <h1 style="margin:0 0 14px 0; font-family: ${FONT_STACK}; font-size:21px; font-weight:800; color:${COLOR_INK}; line-height:1.35;">${escapeHtml(heading)}</h1>
              <div style="font-family: ${FONT_STACK}; font-size:15px; line-height:1.65; color:${COLOR_INK_SOFT};">
                ${bodyHtml}
              </div>${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 40px 32px 40px; border-top:1px solid ${COLOR_BORDER};">
              <p style="margin:0; font-family: ${FONT_STACK}; font-size:12px; line-height:1.6; color:${COLOR_INK_FAINT};">${footerNote ? escapeHtml(footerNote) : "Contact info stays private until a mentor accepts a connection."}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { COLOR_BRAND, COLOR_BRAND_DARK, COLOR_INK_SOFT };
