'use strict';

const config = require('../config/env');

/**
 * Base HTML email shell.
 * Every template calls this and injects its own content block.
 *
 * @param {{ title: string, preheader: string, content: string }} options
 * @returns {string} full HTML email
 */
const baseTemplate = ({ title, preheader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .preheader { display:none; max-height:0; overflow:hidden; }
    .wrapper { width:100%; background:#f4f4f5; padding: 32px 16px; box-sizing:border-box; }
    .card { max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .header { background:#1a1a2e; padding:28px 32px; text-align:center; }
    .header h1 { margin:0; color:#ffffff; font-size:22px; font-weight:600; letter-spacing:-0.3px; }
    .body { padding:32px; color:#3d3d3a; font-size:15px; line-height:1.6; }
    .body h2 { margin-top:0; font-size:19px; color:#1a1a2e; }
    .table-wrap { border:1px solid #e5e5e3; border-radius:8px; overflow:hidden; margin:20px 0; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th { background:#f9f9f8; padding:10px 14px; text-align:left; font-weight:500; color:#73726c; border-bottom:1px solid #e5e5e3; }
    td { padding:10px 14px; border-bottom:1px solid #f0f0ef; }
    tr:last-child td { border-bottom:none; }
    .total-row td { font-weight:600; background:#f9f9f8; }
    .btn { display:inline-block; margin:20px 0; padding:12px 28px; background:#534AB7; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:500; font-size:14px; }
    .badge { display:inline-block; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:500; }
    .badge-green  { background:#E1F5EE; color:#0F6E56; }
    .badge-red    { background:#FAECE7; color:#993C1D; }
    .badge-blue   { background:#EEEDFE; color:#3C3489; }
    .badge-orange { background:#FAEEDA; color:#854F0B; }
    .address-box { background:#f9f9f8; border:1px solid #e5e5e3; border-radius:8px; padding:14px 16px; font-size:14px; line-height:1.7; margin:16px 0; }
    .footer { padding:20px 32px; text-align:center; font-size:12px; color:#9c9a92; border-top:1px solid #f0f0ef; }
    .footer a { color:#534AB7; text-decoration:none; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>EcommerceApp</h1>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} EcommerceApp &nbsp;&middot;&nbsp;
        <a href="${config.frontendUrl}">Visit store</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = baseTemplate;
