#!/usr/bin/env python3
"""Assemble the ReviewBoost HTML proposal with embedded app mockups + QR."""

qr = open('/Users/saqib/Downloads/reviewboost/docs/qr_b64.txt').read().strip()

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ReviewBoost — Proposal</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  :root{
    --bg:#0A0A0B; --surface:#131316; --raised:#1A1A1F; --border:#26262B; --bstrong:#34343C;
    --text:#FAFAFA; --muted:#A1A1AA; --faint:#71717A; --ghost:#52525B;
    --primary:#34D399; --psoft:rgba(52,211,153,.12); --pborder:rgba(52,211,153,.30);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;background:#050506;color:var(--text);-webkit-font-smoothing:antialiased;line-height:1.65}
  .page{max-width:840px;margin:0 auto;padding:56px 48px;background:radial-gradient(120% 55% at 50% -5%,#15151a 0%,var(--bg) 50%)}
  h1{font-size:38px;font-weight:800;letter-spacing:-.03em;line-height:1.12}
  h2{font-size:23px;font-weight:700;letter-spacing:-.02em;margin:6px 0 14px}
  p{color:var(--muted);font-size:15px}
  .lead{font-size:17px;color:var(--muted)}
  .eyebrow{color:var(--primary);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  .accent{color:var(--primary)} .strong{color:var(--text);font-weight:600}
  a{color:var(--primary);text-decoration:none;font-weight:500;word-break:break-all}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:44px}
  .brand-logo{width:44px;height:44px;border-radius:12px;background:var(--psoft);border:1px solid var(--pborder);display:flex;align-items:center;justify-content:center;color:var(--primary)}
  .brand-name{font-weight:700;font-size:19px;letter-spacing:-.01em}
  .brand-tag{color:var(--faint);font-size:12px}
  section{margin-top:48px}
  .callout{background:linear-gradient(135deg,rgba(52,211,153,.10),var(--surface) 60%);border:1px solid var(--pborder);border-radius:14px;padding:20px 22px;margin:20px 0;font-size:16px;font-weight:600;color:var(--text)}
  .step{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}
  .step-num{flex-shrink:0;min-width:26px;height:26px;padding:0 7px;border-radius:7px;background:var(--psoft);border:1px solid var(--pborder);color:var(--primary);font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;margin-top:2px}
  .step-body{font-size:15px;color:var(--muted)} .step-body .strong{color:var(--text)}
  .note{font-size:14px;color:var(--muted);margin-bottom:14px}
  .cap{text-align:center;font-size:12px;color:var(--faint);margin-top:10px}
  .footer{margin-top:60px;padding-top:22px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
  .muted-sm{font-size:12px;color:var(--ghost)}

  /* ---- App mockup ("screenshot") frame ---- */
  .shot-frame{background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:20px;margin:18px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .m-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
  .m-biz{display:flex;gap:10px;align-items:center}
  .m-logo{width:34px;height:34px;border-radius:9px;background:var(--psoft);border:1px solid var(--pborder);color:var(--primary);display:flex;align-items:center;justify-content:center}
  .m-title{font-size:14px;font-weight:700;color:var(--text)}
  .m-url{font-size:10px;color:var(--ghost)}
  .m-signout{font-size:11px;color:var(--muted);border:1px solid var(--border);border-radius:7px;padding:6px 10px}
  .m-redeem{background:linear-gradient(135deg,rgba(52,211,153,.07),var(--surface) 55%);border:1px solid var(--pborder);border-radius:12px;padding:16px;margin-bottom:14px}
  .m-redeem h4{font-size:13px;color:var(--text);margin-bottom:3px;display:flex;align-items:center;gap:7px}
  .m-redeem p{font-size:11px;color:var(--muted);margin-bottom:12px}
  .m-row{display:flex;gap:10px}
  .m-input{flex:1;background:var(--raised);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:ui-monospace,monospace;font-size:13px;letter-spacing:.12em;color:var(--ghost)}
  .m-btn{background:var(--primary);color:#04140D;border-radius:8px;padding:10px 16px;font-size:12px;font-weight:700;white-space:nowrap;display:flex;align-items:center}
  .m-btn.ghost{background:var(--raised);color:var(--text);border:1px solid var(--border)}
  .m-grid{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:12px;margin-bottom:14px}
  .m-card{background:var(--surface);border:1px solid var(--border);border-radius:11px;padding:14px}
  .m-qr{background:#fff;border-radius:8px;padding:8px;width:104px;height:104px;margin:0 auto 10px}
  .m-qr img{width:100%;height:100%;display:block}
  .m-statlabel{font-size:10px;color:var(--muted);display:flex;align-items:center;gap:5px;margin-bottom:6px}
  .m-statnum{font-size:22px;font-weight:700;color:var(--text)}
  .m-pin{display:flex;gap:6px;justify-content:center;margin:8px 0}
  .m-pin span{width:9px;height:9px;border-radius:50%;background:var(--muted)}
  .m-sub{display:flex;justify-content:space-between;align-items:center;background:var(--surface);border:1px solid var(--border);border-radius:9px;padding:11px 14px;margin-bottom:7px}
  .m-name{font-size:13px;font-weight:600;color:var(--text)}
  .m-meta{font-size:10px;color:var(--faint)}
  .m-code{font-family:ui-monospace,monospace;font-size:12px;font-weight:600;color:var(--muted);letter-spacing:.1em;background:var(--raised);border:1px solid var(--border);border-radius:6px;padding:5px 10px}
  .m-soft{font-size:11px;color:var(--muted)}

  /* ---- Phone screens ---- */
  .phones{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin:18px 0}
  .phone{width:176px;background:#000;border:6px solid #1f1f24;border-radius:26px;padding:12px 10px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pscreen{background:var(--bg);border-radius:16px;padding:16px 12px;min-height:280px;display:flex;flex-direction:column}
  .pbadge{width:34px;height:34px;border-radius:9px;background:var(--psoft);border:1px solid var(--pborder);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:2px auto 10px}
  .ptitle{font-size:13px;font-weight:700;text-align:center;color:var(--text)}
  .psub{font-size:10px;color:var(--faint);text-align:center;margin-top:4px;line-height:1.4}
  .pinput{background:var(--raised);border:1px solid var(--border);border-radius:7px;height:28px;margin-top:9px}
  .pbtn{background:var(--primary);color:#04140D;border-radius:7px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin-top:11px}
  .pbig{font-size:34px;font-weight:800;color:var(--primary);text-align:center;letter-spacing:-.03em;line-height:1;margin-top:12px}
  .pcode{font-family:ui-monospace,monospace;font-size:15px;font-weight:700;letter-spacing:.14em;text-align:center;background:var(--raised);border:1px dashed var(--bstrong);border-radius:7px;padding:7px;margin-top:9px;color:var(--text)}
  .pcap{text-align:center;font-size:10px;color:var(--faint);margin-top:9px}

  /* ---- Table-tent poster ---- */
  .poster{max-width:300px;margin:18px auto;background:linear-gradient(165deg,#15241d,#0A0A0B 60%);border:1px solid var(--pborder);border-radius:18px;padding:26px 22px;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .poster .eyebrow{font-size:11px}
  .poster h3{font-size:21px;font-weight:800;color:#fff;margin:8px 0 4px;letter-spacing:-.02em;line-height:1.15}
  .poster .off{font-size:38px;font-weight:800;color:var(--primary);letter-spacing:-.03em;margin:6px 0}
  .poster .qr{background:#fff;border-radius:12px;padding:12px;width:150px;height:150px;margin:14px auto 10px}
  .poster .qr img{width:100%;height:100%;display:block}
  .poster .scan{font-size:12px;color:var(--muted);font-weight:600}

  @media print{
    *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
    html,body{background:#0A0A0B !important}
    .page{background:#0A0A0B !important;max-width:100%;width:100%;padding:40px 44px}
    section{page-break-inside:avoid}
    .shot-frame,.phones,.poster{page-break-inside:avoid}
  }
  @page{margin:0;size:A4}
</style>
</head>
<body>
<div class="page">

  <div class="brand">
    <div class="brand-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
    <div><div class="brand-name">ReviewBoost</div><div class="brand-tag">rateus.space</div></div>
  </div>

  <div class="eyebrow">Proposal</div>
  <h1 style="margin-top:12px;">More Google reviews,<br/>more repeat customers.</h1>
  <p class="lead" style="margin-top:18px;">
    We help businesses gain scalable revenue and repeat customers through a simple mix of customer
    ratings and discounts. Studies show that <span class="strong">83% of customers check Google reviews</span>
    before visiting a place, and around <span class="strong">94% prefer a business with a higher number of
    ratings</span> over one with fewer.
  </p>
  <div class="callout">If your competitor has 1,300 Google reviews and your business has 400, most customers will choose your competitor.</div>

  <section>
    <div class="eyebrow">How we work</div>
    <h2>Reviews for long-term growth, discounts for repeat visits</h2>
    <p>With our platform, you ask customers for Google reviews and offer them a discount on their next visit in return. This increases your number of Google reviews — driving scalable, long-term growth — while the next-visit discount brings customers back, giving you repeat business in the short term.</p>
  </section>

  <section>
    <div class="eyebrow">Step 1</div>
    <h2>Onboard your business in 2 minutes</h2>
    <p class="note">We've already created a login for your business, but here are the steps to onboard a new business:</p>
    <div class="step"><div class="step-num">i</div><div class="step-body">Go to <a href="https://rateus.space/onboard">https://rateus.space/onboard</a></div></div>
    <div class="step"><div class="step-num">ii</div><div class="step-body">Add your <span class="strong">business name</span>.</div></div>
    <div class="step"><div class="step-num">iii</div><div class="step-body">Add your <span class="strong">Google review link</span>. You can watch this video to see how to find it: <a href="https://www.youtube.com/watch?v=zKpXIm0mTsc">https://www.youtube.com/watch?v=zKpXIm0mTsc</a></div></div>
    <div class="step"><div class="step-num">iv</div><div class="step-body">Add your <span class="strong">WhatsApp number</span> and click Continue.</div></div>
    <div class="step"><div class="step-num">v</div><div class="step-body">On the next page, create your <span class="strong">username and password</span> so you can log in from any device at the counter, or your staff can log in: <a href="https://rateus.space/login">https://rateus.space/login</a></div></div>
    <div class="step"><div class="step-num">vi</div><div class="step-body">The next screen is your <span class="strong">Admin dashboard</span>, where you can redeem codes, see total submissions, and edit your review link.</div></div>

    <!-- Admin mockup -->
    <div class="shot-frame">
      <div class="m-head">
        <div class="m-biz">
          <div class="m-logo"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 4.5 4h15L21 9.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5Z"/><path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/></svg></div>
          <div><div class="m-title">Haleem Ghar</div><div class="m-url">rateus.space/r/haleem-ghar</div></div>
        </div>
        <div class="m-signout">Sign out</div>
      </div>
      <div class="m-redeem">
        <h4><span class="accent">◫</span> Redeem a coupon</h4>
        <p>Customer tells you their code — enter it to apply the discount and mark it used.</p>
        <div class="m-row"><div class="m-input">RB-X7K2</div><div class="m-btn">Apply &amp; mark used</div></div>
      </div>
      <div class="m-grid">
        <div class="m-card" style="text-align:center"><div class="m-qr"><img src="__QR__" alt="QR"/></div><div class="m-btn ghost" style="justify-content:center;font-size:11px">Download QR</div></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="m-card"><div class="m-statlabel">Submissions</div><div class="m-statnum">12</div></div>
          <div class="m-card"><div class="m-statlabel">Discount</div><div class="m-statnum">15%</div></div>
        </div>
        <div class="m-card"><div class="m-statlabel" style="margin-bottom:8px">Staff PIN</div><div class="m-pin"><span></span><span></span><span></span><span></span></div><div class="m-btn ghost" style="justify-content:center;font-size:11px;margin-top:6px">Save PIN</div></div>
      </div>
      <div class="m-card" style="margin-bottom:14px"><div class="m-statlabel" style="margin-bottom:6px">Google review link</div><div class="m-soft" style="font-size:11px;word-break:break-all">https://search.google.com/local/writereview?placeid=…</div></div>
      <div class="m-sub"><div><div class="m-name">Ayesha</div><div class="m-meta">+9230xxxxxxx · 3m ago</div></div><div class="m-code">RB-9QFT</div></div>
      <div class="m-sub" style="margin-bottom:0"><div><div class="m-name">Bilal</div><div class="m-meta">+9230xxxxxxx · 1h ago</div></div><div class="m-code">RB-2KP8</div></div>
    </div>
    <div class="cap">Your live Admin dashboard</div>
  </section>

  <section>
    <div class="eyebrow">Step 2</div>
    <h2>Create awareness of the discount on every table</h2>
    <div class="step"><div class="step-num">i</div><div class="step-body">Download the <span class="strong">QR code</span> and place the design on each table with a message: <span class="strong">"Rate us on Google and get 15% off your next visit"</span> (or whatever discount your business is offering). A sample design is shown below.</div></div>
    <div class="step"><div class="step-num">ii</div><div class="step-body">Make sure as many customers as possible know they'll get a discount for leaving a review. Staff can also be trained to remind customers that they'll receive a discount on their next visit.</div></div>

    <div class="poster">
      <div class="eyebrow">Loved your visit?</div>
      <h3>Rate us on Google</h3>
      <div class="off">15% OFF</div>
      <div class="m-soft" style="font-size:12px">your next visit</div>
      <div class="qr"><img src="__QR__" alt="Scan to review"/></div>
      <div class="scan">Scan · Review · Get your discount</div>
    </div>
    <div class="cap">Sample table-tent / QR poster (your real QR is on your dashboard)</div>
  </section>

  <section>
    <div class="eyebrow">Step 3</div>
    <h2>The customer journey to avail the discount</h2>
    <div class="step"><div class="step-num">i</div><div class="step-body">The customer scans the QR code and fills in their <span class="strong">name and WhatsApp number</span>.</div></div>
    <div class="step"><div class="step-num">ii</div><div class="step-body">By clicking <span class="strong">"Leave a Review"</span>, your business review page opens in a new tab. The customer posts the review and takes a screenshot.</div></div>
    <div class="step"><div class="step-num">iii</div><div class="step-body">The customer uploads the screenshot of the posted review, and our AI verifies its authenticity. Once verified, a <span class="strong">discount coupon</span> is awarded, which they can save for their next visit.</div></div>

    <div class="phones">
      <div class="phone"><div class="pscreen">
        <div class="pbadge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        <div class="ptitle">Review Haleem Ghar</div><div class="psub">Leave a review and get 15% off your next visit</div>
        <div class="pinput"></div><div class="pinput"></div><div class="pbtn">Leave a Review →</div>
      </div><div class="pcap">1 · Scan &amp; enter details</div></div>

      <div class="phone"><div class="pscreen">
        <div class="pbadge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <div class="ptitle">Upload your screenshot</div><div class="psub">Snap your posted review so we can verify it</div>
        <div style="flex:1"></div><div class="pbtn">Get My Coupon →</div>
      </div><div class="pcap">2 · Review &amp; upload</div></div>

      <div class="phone"><div class="pscreen" style="background:linear-gradient(165deg,rgba(52,211,153,.12),var(--bg) 45%)">
        <div class="pbadge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8"/></svg></div>
        <div class="ptitle">Here's your reward</div><div class="pbig">15% OFF</div><div class="psub" style="margin-top:2px">your next visit</div>
        <div class="pcode">RB-X7K2</div><div class="pcap" style="margin-top:8px">Show to staff before billing</div>
      </div><div class="pcap">3 · Get the coupon</div></div>
    </div>

    <div class="step"><div class="step-num">iv</div><div class="step-body">On the next visit, at the time of billing, the customer shows the coupon to your staff, who verify it from your <span class="strong">Admin space</span>. They simply enter the coupon to redeem it. The system shows an error if the coupon is already redeemed, expired, or incorrect.</div></div>
    <div class="step"><div class="step-num">v</div><div class="step-body">On successful redemption, the <span class="strong">discount is applied to the total bill</span>.</div></div>

    <div class="shot-frame">
      <div class="m-redeem" style="margin-bottom:0">
        <h4><span class="accent">◫</span> Redeem a coupon</h4>
        <p>Customer tells you their code — enter it to apply the discount and mark it used.</p>
        <div class="m-row"><div class="m-input">RB-X7K2</div><div class="m-btn">Apply &amp; mark used</div></div>
        <div style="display:flex;align-items:center;gap:7px;margin-top:11px;font-size:12px;color:var(--primary);font-weight:600">✓ Redeemed — 15% off applied for Haleem Ghar</div>
      </div>
    </div>
    <div class="cap">Staff redeem the coupon from the dashboard in one tap</div>
  </section>

  <div class="footer">
    <div>
      <div class="brand-name" style="font-size:15px;">ReviewBoost</div>
      <div class="muted-sm">rateus.space</div>
    </div>
    <div style="text-align:right;">
      <div class="muted-sm">Contact</div>
      <div class="strong" style="font-size:14px;">WhatsApp: +92 316 5893850</div>
      <div class="accent" style="font-size:13px;font-weight:500;">Saqib@rateus.space</div>
    </div>
  </div>

</div>
</body>
</html>
"""

HTML = HTML.replace('__QR__', qr)
open('/Users/saqib/Downloads/reviewboost/docs/proposal.html', 'w').write(HTML)
print('Wrote proposal.html with embedded mockups + QR')
