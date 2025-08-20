// server/routes/email.js
import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  const { to, subject, text, html } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

export default router;
