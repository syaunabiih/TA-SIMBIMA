const nodemailer = require("nodemailer");

// Buat transporter Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Kirim email reset password ke user.
 * @param {string} toEmail   - Alamat email tujuan
 * @param {string} namaUser  - Nama penerima (untuk sapaan)
 * @param {string} resetLink - URL reset password lengkap dengan token
 */
const sendResetPasswordEmail = async (toEmail, namaUser, resetLink) => {
  const transporter = createTransporter();

  const htmlBody = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Password SIMBIMA</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:36px 40px;text-align:center;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">SIMBIMA</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Sistem Informasi Manajemen Bina Mahasiswa</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e293b;">Reset Password Anda</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.7;">
                Halo <strong style="color:#1e293b;">${namaUser}</strong>, kami menerima permintaan untuk mereset password akun SIMBIMA Anda. 
                Klik tombol di bawah ini untuk membuat password baru.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                      Reset Password Sekarang
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                  ⏰ <strong>Link ini hanya berlaku selama 1 jam</strong> sejak email ini dikirim. 
                  Segera gunakan sebelum kadaluarsa.
                </p>
              </div>

              <!-- Info Note -->
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;line-height:1.7;">
                Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetLink}" style="color:#10b981;font-size:12px;text-decoration:none;">${resetLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px;"/>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                Jika Anda tidak merasa meminta reset password, abaikan email ini. 
                Password Anda tidak akan berubah. Jika Anda memiliki pertanyaan, 
                silakan hubungi administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} SIMBIMA — Sistem Informasi Manajemen Bina Mahasiswa
              </p>
              <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;">Email ini dikirim otomatis, mohon jangan membalas email ini.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "🔐 Reset Password Akun SIMBIMA Anda",
    html: htmlBody,
    // Fallback teks biasa jika client email tidak support HTML
    text: `Halo ${namaUser},\n\nKami menerima permintaan reset password untuk akun SIMBIMA Anda.\n\nGunakan link berikut untuk membuat password baru (berlaku 1 jam):\n${resetLink}\n\nJika Anda tidak meminta reset password, abaikan email ini.\n\nSIMBIMA`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendResetPasswordEmail };
