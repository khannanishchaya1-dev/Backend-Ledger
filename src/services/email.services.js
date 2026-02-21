require("dotenv").config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configure API key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, text, html) => {
  try {
    await transactionalEmailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "Backend-Ledger",
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });

    console.log("✅ Email sent via Brevo");
  } catch (error) {
    console.error("❌ Brevo email error:", error.message);
  }
};

const sendRegistrationEmail = async (to, name) => {
  const subject = "Welcome to Backend-Ledger 🎉";

  const text = `Hi ${name},

Welcome to Backend-Ledger!

Your account has been successfully created.
We're excited to have you on board 🚀

— Backend-Ledger Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#fff; padding:25px; border-radius:8px;">
        <h2 style="color:#2c3e50;">Welcome to Backend-Ledger 🎉</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Your account has been successfully created.</p>
        <p>We're excited to have you on board 🚀</p>
        <hr />
        <p><b>Backend-Ledger Team</b></p>
      </div>
    </div>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
};
