// server.js - Enhanced with CMS functionality
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// ================== DB CONNECTION ==================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== FILE PATHS ==================
const DATA_PATH = path.join(__dirname, "data.json");
const USERS_PATH = path.join(__dirname, "users.json");        
const DONATIONS_PATH = path.join(__dirname, "donations.json"); 
const SPIRITUAL_PATH = path.join(__dirname, "spiritual.json");
const NOTIFICATIONS_PATH = path.join(__dirname, "notifications.json");
const CMS_POSTS_PATH = path.join(__dirname, "cms_posts.json"); // ✅ NEW: CMS posts storage
const SETTINGS_PATH = path.join(__dirname, "settings.json");   // ✅ NEW: Settings storage

// ================== UPLOADS ==================
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static(UPLOADS_DIR));

// ================== HELPERS ==================
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) return [];
    const content = fs.readFileSync(file);
    return content.toString() ? JSON.parse(content) : [];
  } catch (err) {
    console.error(`❌ Failed to read ${file}:`, err);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`❌ Failed to write ${file}:`, err);
  }
}

// ✅ NEW: Initialize default settings
function initializeSettings() {
  const defaultSettings = {
    siteName: "Pent-Shop",
    siteDescription: "Your Spiritual Shopping Destination",
    adminEmail: "admin@pentshop.com",
    enableNotifications: true,
    maintenanceMode: false,
    theme: "light",
    emailSettings: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpSecure: false,
    },
    lastUpdated: new Date().toISOString(),
  };

  if (!fs.existsSync(SETTINGS_PATH)) {
    writeJSON(SETTINGS_PATH, defaultSettings);
  }
  return readJSON(SETTINGS_PATH);
}

// Initialize settings on server start
const appSettings = initializeSettings();

// ================== EMAIL CONFIG ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ================== MODELS ==================
// ================== MODELS ==================
// ================== MODELS SECTION (Fix this first) ==================
let User, Order;

// Proper model loading
async function initializeModels() {
  try {
    // Check if models already exist
    try {
      User = mongoose.model('User');
      Order = mongoose.model('Order');
      console.log("✅ Models loaded from existing instances");
    } catch (e) {
      // Models don't exist, create them
      console.log("📝 Creating new model instances...");
      
      // User Schema
      const userSchema = new mongoose.Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
        createdAt: { type: Date, default: Date.now },
        lastLogin: { type: Date },
        updatedAt: { type: Date, default: Date.now }
      });

      // Order Schema  
      const orderSchema = new mongoose.Schema({
        userEmail: { type: String, required: true },
        amount: { type: Number, required: true },
        reference: { type: String, required: true, unique: true },
        status: { 
          type: String, 
          enum: ['Pending', 'Processing', 'Delivered', 'Cancelled'], 
          default: 'Pending' 
        },
        products: [{
          productId: { type: mongoose.Schema.Types.ObjectId },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, default: 1 }
        }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      User = mongoose.model('User', userSchema);
      Order = mongoose.model('Order', orderSchema);
      
      console.log("✅ Models created successfully");
    }
    return true;
  } catch (err) {
    console.error("❌ Model initialization failed:", err);
    return false;
  }
}

// ================== FIXED ORDER ROUTES (Remove duplicates and use only these) ==================

// GET all orders
app.get("/api/orders", async (req, res) => {
  try {
    console.log("📝 GET /api/orders - Fetching all orders");
    
    // Ensure models are initialized
    if (!Order) {
      const initialized = await initializeModels();
      if (!initialized) {
        return res.status(500).json({ 
          success: false, 
          message: "Order model not available. Please check server configuration." 
        });
      }
    }
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${orders.length} orders in MongoDB`);
    res.json(orders);
    
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch orders. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// PUT/UPDATE order status (This is the main fix for your error)
app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📝 PUT /api/orders/${id} - Updating order status to: ${status}`);
    
    // Input validation
    if (!status || !status.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required and cannot be empty" 
      });
    }
    
    // Validate status value
    const validStatuses = ["Pending", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID format" 
      });
    }
    
    // Ensure models are initialized
    if (!Order) {
      const initialized = await initializeModels();
      if (!initialized) {
        return res.status(500).json({ 
          success: false, 
          message: "Order model not available. Please check server configuration." 
        });
      }
    }
    
    // Update order in MongoDB
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { 
        status: status.trim(),
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).lean();
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found. It may have been deleted." 
      });
    }
    
    console.log(`✅ Order ${id} status updated to: ${status}`);
    
    // Optional: Send email notification (with error handling)
    try {
      if (updatedOrder.userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"Pent-Shop Orders" <${process.env.EMAIL_USER}>`,
          to: updatedOrder.userEmail,
          subject: `Order Status Update - ${status}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">Pent-Shop</h1>
                <p style="color: #666; margin: 5px 0;">Order Status Update</p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Order Status Updated</h3>
                <p style="color: #4b5563; line-height: 1.6;">
                  Your order <strong>#${id.slice(-8).toUpperCase()}</strong> status has been updated to: <strong>${status}</strong>
                </p>
                <p style="color: #4b5563;">
                  Order Amount: <strong>₵${(updatedOrder.amount || 0).toFixed(2)}</strong>
                </p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:5173" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View Order Details
                </a>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email notification sent to: ${updatedOrder.userEmail}`);
      }
    } catch (emailError) {
      console.warn("⚠️ Failed to send order status email:", emailError.message);
      // Don't fail the order update if email fails
    }
    
    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    });
    
  } catch (err) {
    console.error("❌ Error updating order:", err);
    
    // Handle specific MongoDB errors
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid order ID format" 
      });
    }
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: "Validation error: " + errors.join(', ')
      });
    }
    
    // Return detailed error for debugging
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while updating order status",
      error: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        stack: err.stack,
        name: err.name
      } : 'Internal server error'
    });
  }
});

// ================== FIXED ANALYTICS ENDPOINT ==================
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    console.log("📊 Fetching dashboard analytics...");
    
    const stats = {
      totalUsers: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      totalPosts: 0,
      recentActivity: []
    };

    // Ensure models are initialized
    if (!User || !Order) {
      await initializeModels();
    }

    // Get user count with better error handling
    try {
      if (User) {
        stats.totalUsers = await User.countDocuments();
        console.log(`✅ Found ${stats.totalUsers} users in MongoDB`);
      } else {
        // Fallback: try to read users from file
        try {
          const users = readJSON(USERS_PATH);
          stats.totalUsers = Array.isArray(users) ? users.length : 0;
          console.log(`⚠️ Using file-based user count: ${stats.totalUsers}`);
        } catch (fileErr) {
          console.warn("⚠️ Could not read users file:", fileErr.message);
          stats.totalUsers = 0;
        }
      }
    } catch (userErr) {
      console.error("❌ Error counting users:", userErr.message);
      stats.totalUsers = 0;
    }

    // Get order count and revenue with better error handling
    try {
      if (Order) {
        const orders = await Order.find().lean();
        stats.totalOrders = orders.length;
        stats.totalRevenue = orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (order.amount || 0), 0);
        console.log(`✅ Found ${stats.totalOrders} orders, revenue: ₵${stats.totalRevenue}`);
      }
    } catch (orderErr) {
      console.error("❌ Error counting orders:", orderErr.message);
      stats.totalOrders = 0;
      stats.totalRevenue = 0;
    }

    // Get product count
    try {
      const products = readJSON(DATA_PATH);
      stats.totalProducts = Array.isArray(products) ? products.length : 0;
      console.log(`✅ Found ${stats.totalProducts} products`);
    } catch (productErr) {
      console.warn("⚠️ Could not read products:", productErr.message);
      stats.totalProducts = 0;
    }

    // Get CMS posts count
    try {
      if (CMSPost) {
        stats.totalPosts = await CMSPost.countDocuments();
      } else {
        const posts = readJSON(CMS_POSTS_PATH);
        stats.totalPosts = Array.isArray(posts) ? posts.length : 0;
      }
      console.log(`✅ Found ${stats.totalPosts} CMS posts`);
    } catch (cmsErr) {
      console.warn("⚠️ Could not count CMS posts:", cmsErr.message);
      stats.totalPosts = 0;
    }

    // Get recent activity with error handling
    try {
      const spiritualSubmissions = readJSON(SPIRITUAL_PATH);
      const notifications = readJSON(NOTIFICATIONS_PATH);
      
      const recentSpiritual = Array.isArray(spiritualSubmissions) 
        ? spiritualSubmissions.slice(-5).map(s => ({
            type: 'spiritual_submission',
            message: `New spiritual form submission from ${s.name || 'Unknown'}`,
            timestamp: s.timestamp || new Date().toISOString()
          }))
        : [];

      const recentNotifications = Array.isArray(notifications)
        ? notifications.slice(-3).map(n => ({
            type: 'notification',
            message: `Email sent to ${n.name || 'Unknown'}`,
            timestamp: n.timestamp || new Date().toISOString()
          }))
        : [];

      stats.recentActivity = [...recentSpiritual, ...recentNotifications]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
        
      console.log(`✅ Found ${stats.recentActivity.length} recent activities`);
    } catch (activityErr) {
      console.warn("⚠️ Could not fetch recent activity:", activityErr.message);
      stats.recentActivity = [];
    }

    console.log("📊 Analytics fetched successfully:", stats);
    res.json({ success: true, stats });
    
  } catch (err) {
    console.error("❌ Error fetching analytics:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard analytics",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ================== INITIALIZE MODELS ON SERVER START ==================
// Add this near the server startup
mongoose.connection.once('open', async () => {
  console.log("🔗 MongoDB connected, initializing models...");
  await initializeModels();
});
// ================== PASSWORD RESET ROUTES ==================
// Add these routes to your server.js file (around line 200, after existing user routes)

// 1. Verify if email exists in database
app.post("/api/users/verify-email", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available. Please check server configuration." 
      });
    }
    
    const { email } = req.body;
    
    // Input validation
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }
    
    // Check if user exists in database
    const user = await User.findOne({ 
      email: email.trim().toLowerCase() 
    }).select('email name');
    
    if (user) {
      console.log(`✅ Email verification successful for: ${email}`);
      res.json({ 
        success: true, 
        message: "Email verified successfully",
        exists: true
      });
    } else {
      console.log(`❌ Email not found: ${email}`);
      res.status(404).json({ 
        success: false, 
        message: "No account found with this email address. Please check your email or create a new account." 
      });
    }
    
  } catch (err) {
    console.error("❌ Email verification error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while verifying email. Please try again." 
    });
  }
});

// 2. Reset user password
app.post("/api/users/reset-password", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available. Please check server configuration." 
      });
    }
    
    const { email, newPassword } = req.body;
    
    // Input validation
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "New password is required" 
      });
    }
    
    // Password strength validation
    const password = newPassword.trim();
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }
    
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain at least one uppercase letter" 
      });
    }
    
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain at least one lowercase letter" 
      });
    }
    
    if (!/\d/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must contain at least one number" 
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12); // Higher salt rounds for security
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { 
        password: hashedPassword,
        updatedAt: new Date(),
        // Optional: Add password reset timestamp
        passwordResetAt: new Date()
      },
      { new: true, select: 'email name updatedAt' }
    );
    
    if (user) {
      console.log(`✅ Password reset successful for: ${email}`);
      
      // Optional: Send confirmation email
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailOptions = {
            from: `"Pent-Shop Security" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: "🔒 Password Reset Successful - Pent-Shop",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #dc2626; margin: 0;">🔒 Pent-Shop</h1>
                  <p style="color: #666; margin: 5px 0;">Password Reset Confirmation</p>
                </div>
                
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                  <h3 style="color: #15803d; margin-top: 0;">✅ Password Successfully Updated</h3>
                  <p style="color: #166534; line-height: 1.6;">
                    Your password has been successfully updated on <strong>${new Date().toLocaleDateString()}</strong> at <strong>${new Date().toLocaleTimeString()}</strong>.
                  </p>
                  <p style="color: #166534; line-height: 1.6;">
                    If you did not make this change, please contact our support team immediately.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                  <a href="http://localhost:5173/login" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Login to Your Account
                  </a>
                </div>
                
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    This email was sent by Pent-Shop Security Team<br>
                    <a href="http://localhost:5173" style="color: #dc2626;">Visit our website</a> | 
                    <a href="mailto:support@pentshop.com" style="color: #dc2626;">Contact Support</a>
                  </p>
                </div>
              </div>
            `,
            text: `
Password Reset Successful - Pent-Shop

Your password has been successfully updated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.

If you did not make this change, please contact our support team immediately.

Login to your account: http://localhost:5173/login
Contact Support: support@pentshop.com

---
Pent-Shop Security Team
            `.trim()
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`📧 Password reset confirmation email sent to: ${email}`);
        }
      } catch (emailError) {
        console.warn("⚠️ Failed to send confirmation email:", emailError.message);
        // Don't fail the password reset if email fails
      }
      
      res.json({ 
        success: true, 
        message: "Password updated successfully. You can now login with your new password.",
        user: {
          email: user.email,
          name: user.name,
          updatedAt: user.updatedAt
        }
      });
    } else {
      console.log(`❌ User not found for password reset: ${email}`);
      res.status(404).json({ 
        success: false, 
        message: "Account not found. Please verify your email address." 
      });
    }
    
  } catch (err) {
    console.error("❌ Password reset error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while resetting password. Please try again." 
    });
  }
});

// 3. Optional: Password reset rate limiting (to prevent abuse)
const passwordResetAttempts = new Map(); // In production, use Redis or database

app.post("/api/users/check-reset-limit", (req, res) => {
  const { email } = req.body;
  const now = Date.now();
  const attempts = passwordResetAttempts.get(email) || [];
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(time => now - time < 3600000);
  
  if (recentAttempts.length >= 5) { // Max 5 attempts per hour
    return res.status(429).json({
      success: false,
      message: "Too many password reset attempts. Please try again later.",
      retryAfter: 3600000 - (now - recentAttempts[0])
    });
  }
  
  // Record this attempt
  recentAttempts.push(now);
  passwordResetAttempts.set(email, recentAttempts);
  
  res.json({ success: true, message: "Rate limit check passed" });
});

// 4. Enhanced user login with better error handling
app.post("/api/users/login", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available" 
      });
    }

    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.trim().toLowerCase() 
    });
    
    if (!user) {
      console.log(`❌ Login failed - User not found: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`❌ Login failed - Wrong password for: ${email}`);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date() 
    });

    console.log(`✅ Login successful for: ${email}`);
    
    res.json({
      success: true,
      message: "Login successful",
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        lastLogin: new Date()
      },
      // Optional: Add JWT token here for better security
      token: `user-${user._id}-${Date.now()}` // Simple token, use JWT in production
    });
    
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

// 5. Enhanced user signup with better validation
app.post("/api/users/signup", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available" 
      });
    }

    const { name, email, password } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email and password are required" 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.trim().toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "An account with this email already exists" 
      });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ 
      name: name.trim(), 
      email: email.trim().toLowerCase(), 
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    
    await newUser.save();
    
    console.log(`✅ New user registered: ${email}`);

    // Optional: Send welcome email
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const mailOptions = {
          from: `"Pent-Shop Welcome" <${process.env.EMAIL_USER}>`,
          to: email.trim(),
          subject: "🎉 Welcome to Pent-Shop!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #dc2626; margin: 0;">🎉 Welcome to Pent-Shop!</h1>
                <p style="color: #666; margin: 5px 0;">Your Spiritual Shopping Destination</p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Hello ${name.trim()}!</h3>
                <p style="color: #4b5563; line-height: 1.6;">
                  Thank you for joining Pent-Shop! Your account has been successfully created.
                </p>
                <p style="color: #4b5563; line-height: 1.6;">
                  You can now explore our spiritual products and enjoy a meaningful shopping experience.
                </p>
              </div>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="http://localhost:5173/login" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Start Shopping
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  This email was sent by Pent-Shop Team<br>
                  <a href="http://localhost:5173" style="color: #dc2626;">Visit our website</a>
                </p>
              </div>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`📧 Welcome email sent to: ${email}`);
      }
    } catch (emailError) {
      console.warn("⚠️ Failed to send welcome email:", emailError.message);
      // Don't fail signup if email fails
    }

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! You can now login.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
    
  } catch (err) {
    console.error("❌ Signup error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "An account with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error during registration" 
    });
  }
});

// 6. Get user profile (protected route)
app.get("/api/users/profile/:id", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available" 
      });
    }

    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        orders: user.orders || []
      }
    });
    
  } catch (err) {
    console.error("❌ Profile fetch error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// 7. Update user profile
app.put("/api/users/profile/:id", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available" 
      });
    }

    const { id } = req.params;
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Name and email are required" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      { 
        name: name.trim(), 
        email: email.trim().toLowerCase(),
        updatedAt: new Date()
      }, 
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser
    });
    
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// 8. Delete user account
app.delete("/api/users/:id", async (req, res) => {
  try {
    if (!User) {
      return res.status(500).json({ 
        success: false, 
        message: "User model not available" 
      });
    }

    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log(`🗑️ User account deleted: ${user.email}`);
    
    res.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });
    
  } catch (err) {
    console.error("❌ Account deletion error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ================== MIDDLEWARE FOR DEBUGGING ==================
// Add this middleware to log all API requests
app.use('/api', (req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  console.log('📦 Body:', req.body);
  next();
});

// ================== IMPROVED ERROR HANDLING ==================
// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

console.log("🔐 Enhanced password reset routes loaded successfully!");
// ✅ NEW: CMS POST MODEL (for MongoDB - optional)
const cmsPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['devotional', 'scripture', 'announcement'], default: 'devotional' },
  status: { type: String, enum: ['published', 'draft', 'scheduled'], default: 'published' },
  scheduledDate: { type: Date },
  author: { type: String, default: 'Admin' },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let CMSPost;
try {
  CMSPost = mongoose.model('CMSPost', cmsPostSchema);
} catch (e) {
  console.log("⚠️ Using file-based storage for CMS posts");
  CMSPost = null;
}

// ================== EXISTING ROUTES ==================


// ================== ADMIN AUTH ==================
const adminEmail = "admin@pentshop.com";
const adminPassword = "admin123";

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === adminEmail && password === adminPassword) {
    return res.json({
      success: true,
      admin: { name: "Admin" },
      token: "admin-token",
    });
  }
  return res.status(401).json({ success: false, message: "Invalid admin credentials" });
});

// ================== USER AUTH (existing) ==================
app.post("/api/users/signup", async (req, res) => {
  try {
    if (!User) return res.status(500).json({ success: false, message: "User model not available" });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    if (!User) return res.status(500).json({ success: false, message: "User model not available" });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    if (!User) return res.status(500).json({ success: false, message: "User model not available" });
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== CMS ROUTES ==================
// ✅ GET ALL POSTS
app.get("/api/cms/posts", async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    
    if (CMSPost) {
      // Use MongoDB if available
      let query = {};
      if (type && type !== 'all') query.type = type;
      if (status) query.status = status;
      
      const posts = await CMSPost.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
        
      const total = await CMSPost.countDocuments(query);
      
      res.json({
        success: true,
        posts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      // Use file-based storage
      let posts = readJSON(CMS_POSTS_PATH);
      
      // Apply filters
      if (type && type !== 'all') {
        posts = posts.filter(post => post.type === type);
      }
      if (status) {
        posts = posts.filter(post => post.status === status);
      }
      
      // Sort by creation date (newest first)
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedPosts = posts.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        posts: paginatedPosts,
        pagination: {
          total: posts.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(posts.length / parseInt(limit))
        }
      });
    }
  } catch (err) {
    console.error("❌ Error fetching CMS posts:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

// ✅ GET SINGLE POST
app.get("/api/cms/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (CMSPost) {
      const post = await CMSPost.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      // Increment view count
      post.views += 1;
      await post.save();
      
      res.json({ success: true, post });
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      const post = posts.find(p => p.id.toString() === id);
      
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      // Increment view count
      post.views = (post.views || 0) + 1;
      writeJSON(CMS_POSTS_PATH, posts);
      
      res.json({ success: true, post });
    }
  } catch (err) {
    console.error("❌ Error fetching CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to fetch post" });
  }
});

// ✅ CREATE POST
app.post("/api/cms/posts", async (req, res) => {
  try {
    const { title, content, type = 'devotional', status = 'published', scheduledDate, tags } = req.body;
    
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and content are required" 
      });
    }
    
    const postData = {
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      author: 'Admin',
      views: 0,
      likes: 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (CMSPost) {
      const post = new CMSPost(postData);
      await post.save();
      res.status(201).json({ success: true, post });
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      const newPost = {
        id: Date.now(),
        ...postData
      };
      posts.unshift(newPost);
      writeJSON(CMS_POSTS_PATH, posts);
      res.status(201).json({ success: true, post: newPost });
    }
  } catch (err) {
    console.error("❌ Error creating CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
});

// ✅ UPDATE POST
app.put("/api/cms/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, status, scheduledDate, tags } = req.body;
    
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and content are required" 
      });
    }
    
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      updatedAt: new Date()
    };
    
    if (CMSPost) {
      const post = await CMSPost.findByIdAndUpdate(id, updateData, { new: true });
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      res.json({ success: true, post });
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      const index = posts.findIndex(p => p.id.toString() === id);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      posts[index] = { ...posts[index], ...updateData };
      writeJSON(CMS_POSTS_PATH, posts);
      res.json({ success: true, post: posts[index] });
    }
  } catch (err) {
    console.error("❌ Error updating CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to update post" });
  }
});

// ✅ DELETE POST
app.delete("/api/cms/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (CMSPost) {
      const post = await CMSPost.findByIdAndDelete(id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      res.json({ success: true, message: "Post deleted successfully" });
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      const index = posts.findIndex(p => p.id.toString() === id);
      
      if (index === -1) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      posts.splice(index, 1);
      writeJSON(CMS_POSTS_PATH, posts);
      res.json({ success: true, message: "Post deleted successfully" });
    }
  } catch (err) {
    console.error("❌ Error deleting CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
});

// ================== SETTINGS ROUTES ==================
// ✅ GET SETTINGS
app.get("/api/settings", (req, res) => {
  try {
    const settings = readJSON(SETTINGS_PATH);
    res.json({ success: true, settings });
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

// ✅ UPDATE SETTINGS
app.put("/api/settings", (req, res) => {
  try {
    const currentSettings = readJSON(SETTINGS_PATH);
    const updatedSettings = {
      ...currentSettings,
      ...req.body,
      lastUpdated: new Date().toISOString()
    };
    
    writeJSON(SETTINGS_PATH, updatedSettings);
    res.json({ success: true, settings: updatedSettings });
  } catch (err) {
    console.error("❌ Error updating settings:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// ================== EXISTING ROUTES (products, notifications, etc.) ==================
const uploadMultiple = multer({ storage }).array("images", 5);

app.get("/api/products", (req, res) => {
  const products = readJSON(DATA_PATH);
  res.json(products);
});

app.post("/api/products", uploadMultiple, (req, res) => {
  try {
    const products = readJSON(DATA_PATH);
    const { name, price, description, colors, sizes } = req.body;
    
    if (!name || !price || !description) {
      return res.status(400).json({ message: "Name, price and description are required" });
    }

    const newProduct = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      description,
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      images: req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [],
    };

    products.push(newProduct);
    writeJSON(DATA_PATH, products);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Failed to add product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const products = readJSON(DATA_PATH);
    const { id } = req.params;
    const index = products.findIndex((p) => p.id === id);
    
    if (index === -1) return res.status(404).json({ message: "Product not found" });

    const removedProduct = products.splice(index, 1)[0];
    if (removedProduct.images && removedProduct.images.length) {
      removedProduct.images.forEach((imgPath) => {
        const filePath = path.join(__dirname, imgPath);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    writeJSON(DATA_PATH, products);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== EXISTING NOTIFICATIONS ROUTE ==================
app.post("/api/notifications", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Email configuration missing" 
      });
    }

    const notifications = readJSON(NOTIFICATIONS_PATH);
    const newNotification = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      sent: false
    };

    notifications.push(newNotification);
    writeJSON(NOTIFICATIONS_PATH, notifications);

    try {
      await transporter.verify();
      
      const mailOptions = {
        from: `"Pent-Shop Admin" <${process.env.EMAIL_USER}>`,
        to: email.trim(),
        subject: "📧 Message from Pent-Shop Admin",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #dc2626; margin: 0;">Pent-Shop</h1>
              <p style="color: #666; margin: 5px 0;">Admin Message</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Hello ${name.trim()},</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-line;">${message.trim()}</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This email was sent by Pent-Shop Admin Team<br>
                <a href="http://localhost:5173" style="color: #dc2626;">Visit our website</a>
              </p>
            </div>
          </div>
        `,
        text: `
Hello ${name.trim()},

${message.trim()}

---
Pent-Shop Admin Team
Visit: http://localhost:5173
        `.trim()
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);

      const updatedNotifications = readJSON(NOTIFICATIONS_PATH);
      const notificationIndex = updatedNotifications.findIndex(n => n.id === newNotification.id);
      if (notificationIndex > -1) {
        updatedNotifications[notificationIndex].sent = true;
        updatedNotifications[notificationIndex].emailInfo = {
          messageId: info.messageId,
          sentAt: new Date().toISOString()
        };
        writeJSON(NOTIFICATIONS_PATH, updatedNotifications);
      }

      res.json({ 
        success: true, 
        notification: newNotification, 
        sent: true,
        messageId: info.messageId,
        message: `Email sent successfully to ${email.trim()}`
      });

    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      
      const updatedNotifications = readJSON(NOTIFICATIONS_PATH);
      const notificationIndex = updatedNotifications.findIndex(n => n.id === newNotification.id);
      if (notificationIndex > -1) {
        updatedNotifications[notificationIndex].sent = false;
        updatedNotifications[notificationIndex].error = emailError.message;
        writeJSON(NOTIFICATIONS_PATH, updatedNotifications);
      }

      let errorMessage = "Failed to send email";
      if (emailError.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check EMAIL_USER and EMAIL_PASS";
      } else if (emailError.code === 'ENOTFOUND') {
        errorMessage = "Email server not found. Please check your internet connection";
      } else if (emailError.responseCode === 535) {
        errorMessage = "Invalid email credentials. Please check your email settings";
      }

      return res.status(500).json({ 
        success: false, 
        message: errorMessage,
        notification: newNotification,
        sent: false,
        error: emailError.message
      });
    }

  } catch (err) {
    console.error("❌ Notification error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while processing notification",
      error: err.message 
    });
  }
});

// ================== SPIRITUAL SUBMISSIONS ==================
app.get("/api/spiritual-submissions", (req, res) => {
  const submissions = readJSON(SPIRITUAL_PATH);
  res.json(submissions);
});

app.post("/api/spiritual-submissions", (req, res) => {
  const submissions = readJSON(SPIRITUAL_PATH);
  const newSubmission = { id: Date.now(), ...req.body };
  submissions.push(newSubmission);

  try {
    writeJSON(SPIRITUAL_PATH, submissions);
    res.json({ success: true, submission: newSubmission });
  } catch (err) {
    console.error("❌ Failed to save spiritual submission:", err.message);
    res.status(500).json({ success: false, message: "Failed to save submission" });
  }
});

// ================== PAYSTACK PAYMENT ==================
app.post("/api/paystack/initiate", async (req, res) => {
  const { email, amount, fullName, products } = req.body;
  
  if (!email || !amount) {
    return res.status(400).json({ 
      status: "error", 
      message: "Email and amount are required" 
    });
  }

  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ 
        status: "error", 
        message: "Paystack configuration missing" 
      });
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(parseFloat(amount) * 100),
        currency: "GHS",
        metadata: { fullName: fullName || "Customer" },
      }),
    });

    const data = await response.json();
    
    if (!data.status) {
      console.error("❌ Paystack error:", data);
      return res.status(500).json({ 
        status: "error", 
        message: data.message || "Paystack initialization failed" 
      });
    }

    if (Order && products) {
      try {
        const order = new Order({
          userEmail: email,
          amount: parseFloat(amount),
          reference: data.data.reference,
          products: Array.isArray(products) ? products.map((p) => ({
            productId: mongoose.Types.ObjectId.isValid(p.productId) 
              ? new mongoose.Types.ObjectId(p.productId) 
              : new mongoose.Types.ObjectId(),
            name: p.name || "Unknown Product",
            price: parseFloat(p.price) || 0,
            quantity: parseInt(p.quantity) || 1,
          })) : [],
        });
        
        const savedOrder = await order.save();
        console.log("✅ Order saved:", savedOrder._id);
        
        if (User) {
          await User.updateOne(
            { email: email },
            { $push: { orders: savedOrder } }
          );
        }
      } catch (orderError) {
        console.error("❌ Error saving order:", orderError);
      }
    }

    res.json({
      status: "success",
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("❌ Paystack error:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Payment initialization failed" 
    });
  }
});


// ================== ANALYTICS ENDPOINTS ==================
// ✅ NEW: Dashboard Analytics
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    const stats = {
      totalUsers: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      totalPosts: 0,
      recentActivity: []
    };

    // Get user count
    if (User) {
      stats.totalUsers = await User.countDocuments();
    } else {
      const users = readJSON(USERS_PATH);
      stats.totalUsers = users.length;
    }

    // Get order count and revenue
    if (Order) {
      const orders = await Order.find();
      stats.totalOrders = orders.length;
      stats.totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    }

    // Get product count
    const products = readJSON(DATA_PATH);
    stats.totalProducts = products.length;

    // Get CMS posts count
    if (CMSPost) {
      stats.totalPosts = await CMSPost.countDocuments();
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      stats.totalPosts = posts.length;
    }

    // Get recent activity
    const spiritualSubmissions = readJSON(SPIRITUAL_PATH);
    const notifications = readJSON(NOTIFICATIONS_PATH);
    
    stats.recentActivity = [
      ...spiritualSubmissions.slice(-5).map(s => ({
        type: 'spiritual_submission',
        message: `New spiritual form submission from ${s.name}`,
        timestamp: s.timestamp || new Date().toISOString()
      })),
      ...notifications.slice(-3).map(n => ({
        type: 'notification',
        message: `Email sent to ${n.name}`,
        timestamp: n.timestamp
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({ success: true, stats });
  } catch (err) {
    console.error("❌ Error fetching analytics:", err);
    res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
});

// ✅ NEW: Content Analytics
app.get("/api/analytics/content", async (req, res) => {
  try {
    let posts = [];
    
    if (CMSPost) {
      posts = await CMSPost.find().sort({ views: -1 }).limit(10);
    } else {
      posts = readJSON(CMS_POSTS_PATH);
      posts.sort((a, b) => (b.views || 0) - (a.views || 0));
      posts = posts.slice(0, 10);
    }

    const analytics = {
      topPosts: posts.map(post => ({
        id: post.id || post._id,
        title: post.title,
        type: post.type,
        views: post.views || 0,
        likes: post.likes || 0,
        createdAt: post.createdAt
      })),
      postsByType: {
        devotional: posts.filter(p => p.type === 'devotional').length,
        scripture: posts.filter(p => p.type === 'scripture').length,
        announcement: posts.filter(p => p.type === 'announcement').length,
      },
      totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
      totalLikes: posts.reduce((sum, post) => sum + (post.likes || 0), 0)
    };

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("❌ Error fetching content analytics:", err);
    res.status(500).json({ success: false, message: "Failed to fetch content analytics" });
  }
});

// ================== PUBLIC CMS ENDPOINTS (for frontend display) ==================
// ✅ NEW: Public endpoint to get published posts
app.get("/api/public/posts", async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    if (CMSPost) {
      let query = { status: 'published' };
      if (type && type !== 'all') query.type = type;
      
      const posts = await CMSPost.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-updatedAt'); // Exclude internal fields
        
      res.json({ success: true, posts });
    } else {
      let posts = readJSON(CMS_POSTS_PATH);
      
      // Filter published posts
      posts = posts.filter(post => post.status === 'published');
      
      // Apply type filter
      if (type && type !== 'all') {
        posts = posts.filter(post => post.type === type);
      }
      
      // Sort and limit
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      posts = posts.slice(0, parseInt(limit));
      
      res.json({ success: true, posts });
    }
  } catch (err) {
    console.error("❌ Error fetching public posts:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

// ================== TEST ENDPOINTS ==================
app.post("/api/test-email", async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Email configuration missing",
        config: {
          EMAIL_USER: !!process.env.EMAIL_USER,
          EMAIL_PASS: !!process.env.EMAIL_PASS
        }
      });
    }

    console.log("🔧 Testing email connection...");
    await transporter.verify();
    console.log("✅ Email server connection successful");

    const testEmail = {
      from: `"Pent-Shop Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🧪 Pent-Shop Email Test",
      html: `
        <h2>Email Test Successful! ✅</h2>
        <p>This is a test email from your Pent-Shop server.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this, your email configuration is working correctly.</p>
      `,
      text: `
Email Test Successful!
This is a test email from your Pent-Shop server.
Timestamp: ${new Date().toISOString()}
If you received this, your email configuration is working correctly.
      `.trim()
    };

    const info = await transporter.sendMail(testEmail);
    console.log("✅ Test email sent:", info.messageId);

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      sentTo: process.env.EMAIL_USER
    });

  } catch (err) {
    console.error("❌ Email test failed:", err);
    res.status(500).json({
      success: false,
      message: "Email test failed",
      error: err.message,
      code: err.code
    });
  }
});

// ================== HEALTH CHECK ==================
app.get("/api/health", (_req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    models: {
      User: !!User,
      Order: !!Order,
      CMSPost: !!CMSPost
    },
    features: {
      cms: true,
      settings: true,
      analytics: true,
      notifications: true
    }
  });
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "Route not found" });
  }
  res.status(404).send("Not found");
});
// Add these routes to your server.js
app.post("/api/users/verify-email", async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    email = email.trim().toLowerCase(); // normalize

    const user = await User.findOne({ email });
    if (user) {
      res.json({ success: true, message: "Email verified" });
    } else {
      res.status(404).json({ success: false, message: "No account found with this email" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Models loaded - User: ${!!User}, Order: ${!!Order}, CMSPost: ${!!CMSPost}`);
  console.log(`🚀 Features enabled: CMS, Settings, Analytics, Enhanced Notifications`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
});