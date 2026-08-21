const nodemailer = require("nodemailer");

const requiredEnv = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendOtpEmail = async ({ to, otp, expiresInSeconds }) => {
  const expiresInMinutes = Math.ceil(expiresInSeconds / 60);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Your Kharch verification code",
    text: `Your Kharch verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Kharch Email Verification</h2>
        <p>Your verification code is:</p>

        <div
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 6px;
          "
        >
          ${otp}
        </div>

        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p>
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

const verifyEmailTransport = async () => {
  await transporter.verify();
  console.log("Email SMTP connection successful");
};

module.exports = {
  sendOtpEmail,
  verifyEmailTransport,
};