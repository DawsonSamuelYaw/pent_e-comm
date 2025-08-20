// routes/paystack.js
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/order"); // adjust path if needed
const router = express.Router();

// Correct fetch import for Node.js
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

router.post("/api/paystack/initiate", async (req, res) => {
  const { email, amount, fullName, products } = req.body;

  // Validate required fields
  if (!email || !amount) {
    return res
      .status(400)
      .json({ status: "error", message: "Email and amount are required" });
  }

  try {
    // Initialize Paystack transaction
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: parseFloat(amount) * 100, // convert GH₵ to kobo
        currency: "GHS",
        metadata: { fullName: fullName || "" },
      }),
    });

    const data = await response.json();

    if (!data.status) {
      return res
        .status(500)
        .json({ status: "error", message: "Paystack initialization failed" });
    }

    // Save order to DB
    if (Order && products) {
      const order = new Order({
        userEmail: email,
        amount,
        reference: data.data.reference,
        products: products.map((p) => ({
          productId: mongoose.Types.ObjectId.isValid(p.productId)
            ? mongoose.Types.ObjectId(p.productId)
            : null, // handle invalid IDs
          name: p.name,
          price: p.price,
          quantity: p.quantity,
        })),
      });
      await order.save();
    }

    // Return Paystack authorization URL & reference
    res.json({
      status: "success",
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("❌ Paystack error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Paystack initialization failed" });
  }
});

module.exports = router;
