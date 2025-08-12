const nodemailer = require("nodemailer");

async function sendOrderEmail(order) {
  // Configure your SMTP transport - for example Gmail SMTP or any SMTP service
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,       // Your Gmail address or SMTP user
      pass: process.env.EMAIL_PASS,       // Your Gmail app password or SMTP pass
    },
  });

  // Compose email content
  const itemsList = order.items.map(item => `${item.name} x ${item.quantity}`).join(", ");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: order.userEmail,  // send to customer's email
    subject: `Order Confirmation - ${order.reference}`,
    text: `
      Hi ${order.shipping.fullName},

      Thank you for your order!

      Order Reference: ${order.reference}
      Items: ${itemsList}
      Total: GHS ${order.total}
      Payment Method: ${order.paymentMethod}
      Shipping Address: ${order.shipping.address}, ${order.shipping.city}

      We appreciate your business!

      Best regards,
      Your Company Name
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent.");
  } catch (error) {
    console.error("❌ Failed to send order email:", error);
    throw error;  // rethrow to handle it upstream if needed
  }
}

module.exports = { sendOrderEmail };
