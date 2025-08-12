const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;
const DATA_PATH = path.join(__dirname, "data.json");
const ORDERS_PATH = path.join(__dirname, "orders.json");

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Create data.json and orders.json if missing
if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, "[]", "utf8");
  console.log("Created empty data.json");
}
if (!fs.existsSync(ORDERS_PATH)) {
  fs.writeFileSync(ORDERS_PATH, "[]", "utf8");
  console.log("Created empty orders.json");
}

// Root route
app.get("/", (req, res) => {
  res.send("Backend server running on port 5001");
});

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Get order by reference
app.get("/api/orders/:orderId", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8"));
    const order = orders.find((o) => o.reference === req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("Error reading orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders (for admin dashboard)
app.get("/api/orders", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8"));
    res.json(orders);
  } catch (err) {
    console.error("Error reading orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders by user email
app.get("/api/orders/user/:email", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8"));
    const userOrders = orders.filter(order => order.userEmail === req.params.email);
    res.json(userOrders);
  } catch (err) {
    console.error("Error reading orders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new order
app.post("/api/orders", (req, res) => {
  try {
    const orders = JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8"));
    const order = req.body;

    if (
      !order.items ||
      !order.total ||
      !order.shipping ||
      !order.paymentMethod
    ) {
      return res.status(400).json({ message: "Missing order fields" });
    }

    // Generate unique order reference
    order.reference = `ORD-${Date.now()}`;

    orders.push(order);
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
    res.status(201).json(order);
  } catch (err) {
    console.error("Error saving order:", err);
    res.status(500).json({ message: "Failed to save order" });
  }
});
const SPIRITUAL_SUBMISSIONS_PATH = path.join(__dirname, "spiritual_submissions.json");

// Ensure the spiritual submissions file exists
if (!fs.existsSync(SPIRITUAL_SUBMISSIONS_PATH)) {
  fs.writeFileSync(SPIRITUAL_SUBMISSIONS_PATH, "[]", "utf8");
  console.log("Created empty spiritual_submissions.json");
}

// API to create spiritual submission
app.post("/api/spiritual-submissions", (req, res) => {
  try {
    const submissions = JSON.parse(fs.readFileSync(SPIRITUAL_SUBMISSIONS_PATH, "utf8"));
    const submission = req.body;

    if (
      !submission.fullName ||
      !submission.age ||
      !submission.region ||
      !submission.area ||
      !submission.mobile ||
      !submission.email
    ) {
      return res.status(400).json({ message: "Missing fields" });
    }

    submission.id = Date.now();
    submission.submittedAt = new Date();

    submissions.push(submission);
    fs.writeFileSync(SPIRITUAL_SUBMISSIONS_PATH, JSON.stringify(submissions, null, 2));
    res.status(201).json({ message: "Submission received", submission });
  } catch (err) {
    console.error("Error saving submission:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// API to get all spiritual submissions (for admin dashboard)
app.get("/api/spiritual-submissions", (req, res) => {
  try {
    const submissions = JSON.parse(fs.readFileSync(SPIRITUAL_SUBMISSIONS_PATH, "utf8"));
    res.json(submissions);
  } catch (err) {
    console.error("Error reading submissions:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Upload image route
app.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ imagePath: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error during upload" });
  }
});

// Product routes as before (unchanged)
app.get("/products/:id", (req, res) => {
  const products = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const product = products.find((p) => p.id.toString() === req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
});

app.delete("/products/:id", (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (!productId) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    let products = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    const productIndex = products.findIndex((p) => p.id === productId);

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    products.splice(productIndex, 1);
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Server error during product deletion" });
  }
});

app.get("/products", (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    res.json(products);
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Failed to read products" });
  }
});

app.post("/products", (req, res) => {
  try {
    const { name, price, img } = req.body;
    if (!name || !price || !img) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const products = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    const newProduct = {
      id: Date.now(),
      name,
      price,
      img,
    };
    products.push(newProduct);
    fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
    res.status(201).json({ message: "Product added!", product: newProduct });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Server error during product creation" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
