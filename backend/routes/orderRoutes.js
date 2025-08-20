const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const User = require("../models/user"); // ✅ fixed path

// ✅ Create order
router.post("/", async (req, res) => {
  try {
    const { userEmail, amount, reference, products } = req.body;

    if (!userEmail || !amount || !reference) {
      return res
        .status(400)
        .json({ message: "userEmail, amount, and reference are required" });
    }

    const existingOrder = await Order.findOne({ reference });
    if (existingOrder) {
      return res
        .status(400)
        .json({ message: "Order with this reference already exists" });
    }

    const order = new Order({
      userEmail,
      amount: Number(amount),
      reference,
      products: Array.isArray(products)
        ? products.map((p) => ({
            productId: p.productId,
            name: p.name,
            price: Number(p.price),
            quantity: Number(p.quantity),
          }))
        : [],
    });

    const savedOrder = await order.save();

    // ✅ Push into user's orders array
    await User.updateOne(
      { email: userEmail },
      { $push: { orders: savedOrder } }
    );

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("❌ Error creating order:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch all orders
router.get("/", async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch orders for a specific user
router.get("/user/:email", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.params.email }).sort({
      createdAt: -1,
    });

    res.json(
      orders.map((order) => ({
        _id: order._id,
        reference: order.reference,
        amount: order.amount,
        products: order.products || [],
        status: order.status || "Pending",
        createdAt: order.createdAt,
      }))
    );
  } catch (error) {
    console.error("❌ Error fetching user orders:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Get order by reference (must come before :id)
router.get("/reference/:reference", async (req, res) => {
  try {
    const order = await Order.findOne({ reference: req.params.reference });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get by ID (placed after reference route)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("❌ Error fetching order:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    await User.updateOne(
      { email: updatedOrder.userEmail, "orders._id": updatedOrder._id },
      { $set: { "orders.$.status": status } }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error("❌ Error updating order:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete order
router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder)
      return res.status(404).json({ message: "Order not found" });

    await User.updateOne(
      { email: deletedOrder.userEmail },
      { $pull: { orders: { _id: deletedOrder._id } } }
    );

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting order:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
