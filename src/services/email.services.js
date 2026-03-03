require("dotenv").config();
const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configure API key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

const sendEmail = async (to, subject, text, html) => {
  console.log(`Sending email to: ${to}, subject: ${subject}`);
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
    console.error("❌ Brevo email error:", error.message || error);
  }
};

const sendRegistrationEmail = async (to, name) => {

  const subject = "Welcome to BankGo 🎉 Your Account is Ready";

  const text = `
Hi ${name},

Welcome to BankGo!

Your account has been successfully created.
You can now securely manage your banking online.

If you did not create this account, please contact support immediately.

— BankGo Team
  `;

  const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f6fb; padding:30px;">

    <div style="max-width:550px; margin:auto; background:white; border-radius:14px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg,#4f46e5,#7c3aed); padding:25px; text-align:center;">
        <h2 style="color:white; margin:0; letter-spacing:2px;">BankGo</h2>
        <p style="color:#e0e7ff; margin-top:6px; font-size:13px;">
          Secure • Fast • Digital Banking
        </p>
      </div>

      <!-- Body -->
      <div style="padding:30px;">

        <h3 style="margin-top:0; color:#111827;">
          Welcome aboard, ${name}! 🎉
        </h3>

        <p style="font-size:14px; color:#555; line-height:1.6;">
          Your BankGo account has been successfully created.
          You can now enjoy seamless digital banking with real-time transfers,
          secure transactions, and smart account management.
        </p>

        <!-- Feature Box -->
        <div style="
          margin-top:20px;
          padding:15px;
          border-radius:10px;
          background:#f9fafb;
          border-left:4px solid #4f46e5;
        ">
          <p style="margin:6px 0; font-size:13px; color:#444;">
            ✔ Real-time money transfers
          </p>
          <p style="margin:6px 0; font-size:13px; color:#444;">
            ✔ Secure MPIN authentication
          </p>
          <p style="margin:6px 0; font-size:13px; color:#444;">
            ✔ Ledger-based transparent transactions
          </p>
        </div>

        <!-- Security Notice -->
        <p style="font-size:12px; color:#888; margin-top:25px;">
          If you did not create this account, please contact BankGo support immediately.
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#f3f4f6; padding:18px; text-align:center; font-size:12px; color:#777;">
        © ${new Date().getFullYear()} BankGo. All rights reserved.<br/>
        This is an automated email. Please do not reply.
      </div>

    </div>

  </div>
  `;

  await sendEmail(to, subject, text, html);
};
const sendTransactionEmail = async (to, amount, transactionId, type) => {

  const isDebit = type === "DEBIT";
  const formattedAmount = Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const subject = isDebit
    ? "BankGo Alert: Amount Debited"
    : "BankGo Alert: Amount Credited";

  const text = isDebit
    ? `₹ ${formattedAmount} has been debited from your account. Transaction ID: ${transactionId}`
    : `₹ ${formattedAmount} has been credited to your account. Transaction ID: ${transactionId}`;

  const html = `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6fb; padding:30px;">
    
    <div style="max-width:500px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,0.05);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg,#4f46e5,#7c3aed); padding:20px; text-align:center;">
        <h2 style="color:white; margin:0; letter-spacing:2px;">BankGo</h2>
        <p style="color:#e0e7ff; margin:5px 0 0; font-size:12px;">
          Secure Digital Banking
        </p>
      </div>

      <!-- Body -->
      <div style="padding:25px;">

        <h3 style="margin-top:0; color:${isDebit ? "#dc2626" : "#16a34a"};">
          ${isDebit ? "Amount Debited" : "Amount Credited"}
        </h3>

        <p style="font-size:14px; color:#555;">
          ${isDebit
            ? "An amount has been debited from your account."
            : "An amount has been credited to your account."}
        </p>

        <!-- Transaction Card -->
        <div style="
          background:#f9fafb;
          border-radius:10px;
          padding:15px;
          margin-top:20px;
          border-left:5px solid ${isDebit ? "#dc2626" : "#16a34a"};
        ">

          <p style="margin:5px 0; font-size:13px; color:#666;">
            <strong>Amount:</strong> ₹ ${formattedAmount}
          </p>

          <p style="margin:5px 0; font-size:13px; color:#666;">
            <strong>Transaction ID:</strong> ${transactionId}
          </p>

          <p style="margin:5px 0; font-size:13px; color:#666;">
            <strong>Status:</strong> Successful
          </p>

        </div>

        <p style="font-size:12px; color:#999; margin-top:25px;">
          If you did not initiate this transaction, please contact BankGo support immediately.
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#f3f4f6; padding:15px; text-align:center; font-size:11px; color:#777;">
        © ${new Date().getFullYear()} BankGo. All rights reserved.
      </div>

    </div>

  </div>
  `;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail
};
