require("dotenv").config();
const axios = require("axios");
const twilio = require("twilio");

const {
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
} = process.env;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const whatsappFromTwilio = "whatsapp:+14155238886"; // Twilio sandbox number

async function sendWhatsAppCloudMessage(toPhone, message) {
  try {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const data = {
      messaging_product: "whatsapp",
      to: toPhone,
      type: "text",
      text: { body: message },
    };

    const headers = {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, data, { headers });
    console.log("WhatsApp Cloud API message sent:", response.data);
  } catch (error) {
    console.error("Error sending WhatsApp Cloud API message:", error.response?.data || error.message);
  }
}

async function sendWhatsAppTwilioMessage(toPhone, message) {
  try {
    const response = await twilioClient.messages.create({
      from: whatsappFromTwilio,
      to: toPhone,
      body: message,
    });
    console.log("Twilio WhatsApp message sent:", response.sid);
  } catch (error) {
    console.error("Error sending Twilio WhatsApp message:", error.message);
  }
}

async function sendOrderWhatsAppMessage(order) {
  if (!order.shipping || !order.shipping.phone) {
    console.warn("No phone number in order shipping, skipping WhatsApp message");
    return;
  }

  let customerPhone = order.shipping.phone;
  // Normalize phone (example for Ghana numbers starting with 0)
  if (customerPhone.startsWith("0")) {
    customerPhone = "+233" + customerPhone.slice(1);
  }

  const whatsappTo = `whatsapp:${customerPhone}`;

  const message = `Hello ${order.shipping.fullName || "Customer"}, thank you for your order!
Order Ref: ${order.reference}
Total: GHS ${order.total}
Payment Method: ${order.paymentMethod}

We will contact you soon.`;

  if (WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    await sendWhatsAppCloudMessage(customerPhone, message);
  } else if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    await sendWhatsAppTwilioMessage(whatsappTo, message);
  } else {
    console.warn("No WhatsApp credentials found, skipping message.");
  }
}

module.exports = { sendOrderWhatsAppMessage };
