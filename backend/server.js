// server.js - Enhanced with CMS functionality and proper error handling
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors({ 
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
// Handle preflight requests for specific routes
app.options('/api/notifications', cors());
app.options('/api/orders', cors());
app.options('/api/users', cors());
// Add other routes as needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add specific CORS headers instead of blanket options
app.use('/api/notifications', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// ================== FILE PATHS ==================
const DATA_PATH = path.join(__dirname, "data.json");
const USERS_PATH = path.join(__dirname, "users.json");        
const DONATIONS_PATH = path.join(__dirname, "donations.json"); 
const SPIRITUAL_PATH = path.join(__dirname, "spiritual.json");
const NOTIFICATIONS_PATH = path.join(__dirname, "notifications.json");
const CMS_POSTS_PATH = path.join(__dirname, "cms_posts.json");
const SETTINGS_PATH = path.join(__dirname, "settings.json");
const ORDERS_FILE_PATH = path.join(__dirname, "file_orders.json");

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
    console.error(`Failed to read ${file}:`, err);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Failed to write ${file}:`, err);
  }
}

// Initialize default settings
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

const appSettings = initializeSettings();

// ================== EMAIL CONFIG ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ================== IMPROVED DB CONNECTION ==================
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize models immediately after successful connection
    await initializeModels();
    console.log("Models initialized successfully");
    
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Falling back to file-based storage");
    return false;
  }
};

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB shutdown:', err);
    process.exit(1);
  }
});

// Initialize DB connection
let mongoConnected = false;
connectDB().then((connected) => {
  mongoConnected = connected;
  console.log(`MongoDB connection status updated: ${connected}`);
});

// ================== MODELS ==================
let User, Order, CMSPost;

async function initializeModels() {
  if (!mongoose.connection.readyState) {
    console.log("MongoDB not connected, skipping model initialization");
    return false;
  }

  try {
    // Check if models already exist
    try {
      User = mongoose.model('User');
      Order = mongoose.model('Order');
      CMSPost = mongoose.model('CMSPost');
      console.log("Models loaded from existing instances");
      return true;
    } catch (e) {
      console.log("Creating new model instances...");
      
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
          productId: { type: String },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, default: 1 }
        }],
        paymentMethod: { type: String },
        customerInfo: {
          fullName: String,
          phone: String,
          address: String,
          city: String
        },
        paymentInfo: {
          momoNumber: String,
          momoNetwork: String,
          paypalEmail: String
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // CMS Post Schema
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

      User = mongoose.model('User', userSchema);
      Order = mongoose.model('Order', orderSchema);
      CMSPost = mongoose.model('CMSPost', cmsPostSchema);
      
      console.log("Models created successfully");
      return true;
    }
  } catch (err) {
    console.error("Model initialization failed:", err);
    return false;
  }
}

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

// ================== USER ROUTES ==================
// Replace your signup route with this updated version that sends welcome emails

app.post("/api/users/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
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

    let newUser;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (mongoConnected && User) {
      // Use MongoDB
      const existingUser = await User.findOne({ 
        email: cleanEmail 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "An account with this email already exists" 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      newUser = new User({ 
        name: cleanName, 
        email: cleanEmail, 
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await newUser.save();
      console.log(`New user registered: ${cleanEmail}`);
    } else {
      // Use file-based storage
      const users = readJSON(USERS_PATH);
      const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: "An account with this email already exists" 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      newUser = {
        id: Date.now().toString(),
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      users.push(newUser);
      writeJSON(USERS_PATH, users);
    }

    // SEND WELCOME EMAIL - This was missing!
    try {
      // Check email configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email not configured - skipping welcome email");
      } else {
        // Verify email connection with timeout
        const verifyPromise = transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email verification timeout')), 5000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        console.log("Email transporter verified for welcome email");
        
        const welcomeEmailOptions = {
          from: `"Pent-Shop Team" <${process.env.EMAIL_USER}>`,
          to: cleanEmail,
          subject: "Welcome to Pent-Shop! 🎉",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0; font-size: 32px;">Welcome to Pent-Shop!</h1>
                <p style="color: #666; margin: 10px 0; font-size: 16px;">Your Spiritual Shopping Destination</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 30px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0;">🎉 Account Created Successfully!</h2>
                <p style="margin: 0; font-size: 18px;">Hello ${cleanName}!</p>
              </div>
              
              <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">What's Next?</h3>
                <ul style="color: #4b5563; line-height: 1.8;">
                  <li>Browse our spiritual products and books</li>
                  <li>Read daily devotionals and scriptures</li>
                  <li>Join our community of believers</li>
                  <li>Get notified about new arrivals and special offers</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Start Shopping Now
                </a>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Thank you for joining Pent-Shop!<br>
                  If you have any questions, feel free to contact us.<br>
                  <strong>Account Email:</strong> ${cleanEmail}
                </p>
              </div>
            </div>
          `,
          text: `
Welcome to Pent-Shop! 🎉

Hello ${cleanName}!

Your account has been created successfully with email: ${cleanEmail}

What's Next?
- Browse our spiritual products and books
- Read daily devotionals and scriptures  
- Join our community of believers
- Get notified about new arrivals and special offers

Visit us at: http://localhost:5173

Thank you for joining Pent-Shop!
If you have any questions, feel free to contact us.

---
Pent-Shop Team
          `.trim()
        };

        // Send welcome email with timeout
        const sendPromise = transporter.sendMail(welcomeEmailOptions);
        const sendTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Welcome email timeout after 15 seconds')), 15000)
        );
        
        const info = await Promise.race([sendPromise, sendTimeoutPromise]);
        console.log("Welcome email sent successfully:", info.messageId);
        
        // Save welcome email to notifications for tracking
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
          id: Date.now(),
          name: cleanName,
          email: cleanEmail,
          message: `Welcome to Pent-Shop! Your account has been created successfully.`,
          timestamp: new Date().toISOString(),
          sent: true,
          type: 'welcome_email',
          emailInfo: {
            messageId: info.messageId,
            sentAt: new Date().toISOString()
          }
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);
      }
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
      // Don't fail registration if email fails, just log it
      
      // Save failed email attempt
      const notifications = readJSON(NOTIFICATIONS_PATH);
      notifications.push({
        id: Date.now(),
        name: cleanName,
        email: cleanEmail,
        message: `Welcome email failed to send during registration.`,
        timestamp: new Date().toISOString(),
        sent: false,
        type: 'welcome_email_failed',
        error: {
          message: emailError.message,
          timestamp: new Date().toISOString()
        }
      });
      writeJSON(NOTIFICATIONS_PATH, notifications);
    }

    // Return success response
    const userResponse = mongoConnected && User ? {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email
    } : {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };

    res.status(201).json({ 
      success: true, 
      message: "Account created successfully! You can now login. Check your email for welcome message.",
      user: userResponse
    });
    
  } catch (err) {
    console.error("Signup error:", err);
    
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

// Add this helper function to test email configuration on server start
async function testEmailConnection() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  EMAIL_USER or EMAIL_PASS not configured");
      return false;
    }

    console.log("🔄 Testing email connection...");
    
    const testPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email test timeout after 10 seconds')), 10000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    console.log("✅ Email service is ready");
    return true;
    
  } catch (error) {
    console.error("❌ Email service failed:", error.message);
    
    if (error.code === 'EAUTH') {
      console.error("   → Invalid email credentials. Check EMAIL_USER and EMAIL_PASS");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error("   → Cannot connect to Gmail servers. Check internet connection");
    } else if (error.message.includes('timeout')) {
      console.error("   → Email server connection timeout");
    }
    
    return false;
  }
}

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    if (mongoConnected && User) {
      // Use MongoDB
      const user = await User.findOne({ 
        email: email.trim().toLowerCase() 
      });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      await User.findByIdAndUpdate(user._id, { 
        lastLogin: new Date() 
      });

      res.json({
        success: true,
        message: "Login successful",
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email,
          lastLogin: new Date()
        },
        token: `user-${user._id}-${Date.now()}`
      });
    } else {
      // Use file-based storage
      const users = readJSON(USERS_PATH);
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid email or password" 
        });
      }

      // Update last login
      user.lastLogin = new Date().toISOString();
      writeJSON(USERS_PATH, users);

      res.json({
        success: true,
        message: "Login successful",
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email,
          lastLogin: user.lastLogin
        },
        token: `user-${user.id}-${Date.now()}`
      });
    }
    
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login" 
    });
  }
});

app.post("/api/users/verify-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }
    
    let userExists = false;
    
    if (mongoConnected && User) {
      const user = await User.findOne({ 
        email: email.trim().toLowerCase() 
      }).select('email name');
      userExists = !!user;
    } else {
      const users = readJSON(USERS_PATH);
      userExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    }
    
    if (userExists) {
      res.json({ 
        success: true, 
        message: "Email verified successfully",
        exists: true
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "No account found with this email address. Please check your email or create a new account." 
      });
    }
    
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while verifying email. Please try again." 
    });
  }
});

app.post("/api/users/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
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
    
    const password = newPassword.trim();
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (mongoConnected && User) {
      const user = await User.findOneAndUpdate(
        { email: email.trim().toLowerCase() },
        { 
          password: hashedPassword,
          updatedAt: new Date(),
          passwordResetAt: new Date()
        },
        { new: true, select: 'email name updatedAt' }
      );
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "Account not found. Please verify your email address." 
        });
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
      const users = readJSON(USERS_PATH);
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
      
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "Account not found. Please verify your email address." 
        });
      }

      users[userIndex].password = hashedPassword;
      users[userIndex].updatedAt = new Date().toISOString();
      users[userIndex].passwordResetAt = new Date().toISOString();
      
      writeJSON(USERS_PATH, users);

      res.json({ 
        success: true, 
        message: "Password updated successfully. You can now login with your new password.",
        user: {
          email: users[userIndex].email,
          name: users[userIndex].name,
          updatedAt: users[userIndex].updatedAt
        }
      });
    }
    
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while resetting password. Please try again." 
    });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    if (mongoConnected && User) {
      const users = await User.find({}, { password: 0 });
      res.json(users);
    } else {
      const users = readJSON(USERS_PATH);
      const safeUsers = users.map(u => {
        const { password, ...safeUser } = u;
        return safeUser;
      });
      res.json(safeUsers);
    }
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================== ORDER ROUTES ==================
app.get("/api/orders", async (req, res) => {
  try {
    console.log("GET /api/orders - Fetching all orders");
    
    if (mongoConnected && Order) {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${orders.length} orders in MongoDB`);
      res.json(orders);
    } else {
      const orders = readJSON(ORDERS_FILE_PATH);
      console.log(`Found ${orders.length} orders in file storage`);
      res.json(orders);
    }
    
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch orders. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// app.put("/api/orders/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
    
//     console.log(`PUT /api/orders/${id} - Updating order status to: ${status}`);
    
//     if (!status || !status.trim()) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Status is required and cannot be empty" 
//       });
//     }
    
//     const validStatuses = ["Pending", "Processing", "Delivered", "Cancelled"];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
//       });
//     }
    
//     if (mongoConnected && Order) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: "Invalid order ID format" 
//         });
//       }
      
//       const updatedOrder = await Order.findByIdAndUpdate(
//         id,
//         { 
//           status: status.trim(),
//           updatedAt: new Date()
//         },
//         { 
//           new: true,
//           runValidators: true
//         }
//       ).lean();
      
//       if (!updatedOrder) {
//         return res.status(404).json({ 
//           success: false, 
//           message: "Order not found. It may have been deleted." 
//         });
//       }
      
//       res.json({
//         success: true,
//         message: "Order status updated successfully",
//         order: updatedOrder
//       });
//     } else {
//       const orders = readJSON(ORDERS_FILE_PATH);
//       const index = orders.findIndex(o => o._id === id);
      
//       if (index === -1) {
//         return res.status(404).json({ 
//           success: false, 
//           message: "Order not found. It may have been deleted." 
//         });
//       }
      
//       orders[index].status = status.trim();
//       orders[index].updatedAt = new Date().toISOString();
      
//       writeJSON(ORDERS_FILE_PATH, orders);
      
//       res.json({
//         success: true,
//         message: "Order status updated successfully",
//         order: orders[index]
//       });
//     }
    
//   } catch (err) {
//     console.error("Error updating order:", err);
    
//     if (err.name === 'CastError') {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid order ID format" 
//       });
//     }
    
//     if (err.name === 'ValidationError') {
//       const errors = Object.values(err.errors).map(e => e.message);
//       return res.status(400).json({ 
//         success: false, 
//         message: "Validation error: " + errors.join(', ')
//       });
//     }
    
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error occurred while updating order status",
//       error: process.env.NODE_ENV === 'development' ? {
//         message: err.message,
//         stack: err.stack,
//         name: err.name
//       } : 'Internal server error'
//     });
//   }
// });
app.post("/api/orders", async (req, res) => {
  try {
    console.log("POST /api/orders - Creating new order");
    console.log("Request body:", req.body);
    
    // Check if req.body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Request body is empty or missing" 
      });
    }
    
    const {
      userEmail,
      amount,
      reference,
      products,
      status = 'Pending',
      paymentMethod,
      customerInfo,
      paymentInfo
    } = req.body;
    
    if (!userEmail || !amount || !products || !Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: userEmail, amount, and products are required" 
      });
    }
    
    // ... rest of your order creation code remains the same ...
    
    if (products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Order must contain at least one product" 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid amount. Must be a positive number" 
      });
    }
    
    const orderReference = reference || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const orderData = {
      userEmail: userEmail.trim().toLowerCase(),
      amount: parseFloat(amount),
      reference: orderReference,
      status: status || 'Pending',
      products: products.map(product => ({
        productId: product.productId?.toString() || `temp_${Date.now()}_${Math.random()}`,
        name: product.name || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 1
      })),
      paymentMethod: paymentMethod || 'Unknown',
      customerInfo: customerInfo || {},
      paymentInfo: paymentInfo || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let savedOrder;
    
    if (mongoConnected && Order) {
      try {
        const existingOrder = await Order.findOne({ reference: orderReference }).maxTimeMS(5000);
        if (existingOrder) {
          return res.status(400).json({ 
            success: false, 
            message: "Order reference already exists" 
          });
        }
        
        const newOrder = new Order(orderData);
        savedOrder = await newOrder.save();
        console.log(`Order created in MongoDB: ${savedOrder._id}`);
        
      } catch (mongoError) {
        console.error("MongoDB order creation failed:", mongoError.message);
        console.log("Falling back to file-based storage");
        
        const orders = readJSON(ORDERS_FILE_PATH);
        const fileOrder = {
          _id: new Date().getTime().toString(),
          ...orderData
        };
        orders.push(fileOrder);
        writeJSON(ORDERS_FILE_PATH, orders);
        savedOrder = fileOrder;
        console.log(`Order saved to file: ${savedOrder._id}`);
      }
    } else {
      const orders = readJSON(ORDERS_FILE_PATH);
      
      const existingOrder = orders.find(o => o.reference === orderReference);
      if (existingOrder) {
        return res.status(400).json({ 
          success: false, 
          message: "Order reference already exists" 
        });
      }
      
      const fileOrder = {
        _id: new Date().getTime().toString(),
        ...orderData
      };
      orders.push(fileOrder);
      writeJSON(ORDERS_FILE_PATH, orders);
      savedOrder = fileOrder;
      console.log(`Order saved to file: ${savedOrder._id}`);
    }
    
    // ***** ADD THIS CODE TO SEND CONFIRMATION EMAIL *****
    try {
      const emailResult = await sendOrderConfirmationEmail(savedOrder);
      
      if (emailResult.success) {
        console.log(`Order confirmation email sent to ${savedOrder.userEmail}`);
        
        // Save email notification record
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
          id: Date.now(),
          name: customerInfo?.fullName || 'Customer',
          email: savedOrder.userEmail,
          message: `Order confirmation sent for order ${savedOrder.reference}`,
          timestamp: new Date().toISOString(),
          sent: true,
          type: 'order_confirmation',
          orderReference: savedOrder.reference,
          emailInfo: {
            messageId: emailResult.messageId,
            sentAt: new Date().toISOString()
          }
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);
        
      } else {
        console.warn(`Order confirmation email failed for ${savedOrder.userEmail}:`, emailResult.error || emailResult.reason);
        
        // Save failed email attempt
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
          id: Date.now(),
          name: customerInfo?.fullName || 'Customer',
          email: savedOrder.userEmail,
          message: `Order confirmation email failed for order ${savedOrder.reference}`,
          timestamp: new Date().toISOString(),
          sent: false,
          type: 'order_confirmation_failed',
          orderReference: savedOrder.reference,
          error: {
            message: emailResult.error || emailResult.reason,
            timestamp: new Date().toISOString()
          }
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);
      }
      
    } catch (emailError) {
      console.error("Unexpected error sending order confirmation:", emailError);
    }
    // ***** END OF EMAIL CODE *****
    
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
      _id: savedOrder._id,
      emailSent: true // Let frontend know email was attempted
    });
    
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while creating order",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// app.post("/api/orders", async (req, res) => {
//   try {
//     console.log("POST /api/orders - Creating new order");
    
//     const {
//       userEmail,
//       amount,
//       reference,
//       products,
//       status = 'Pending',
//       paymentMethod,
//       customerInfo,
//       paymentInfo
//     } = req.body;
    
//     if (!userEmail || !amount || !products || !Array.isArray(products)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Missing required fields: userEmail, amount, and products are required" 
//       });
//     }
    
//     if (products.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Order must contain at least one product" 
//       });
//     }
    
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(userEmail)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid email format" 
//       });
//     }
    
//     if (isNaN(amount) || amount <= 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid amount. Must be a positive number" 
//       });
//     }
    
//     const orderReference = reference || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
//     const orderData = {
//       userEmail: userEmail.trim().toLowerCase(),
//       amount: parseFloat(amount),
//       reference: orderReference,
//       status: status || 'Pending',
//       products: products.map(product => ({
//         productId: product.productId?.toString() || `temp_${Date.now()}_${Math.random()}`,
//         name: product.name || 'Unknown Product',
//         price: parseFloat(product.price) || 0,
//         quantity: parseInt(product.quantity) || 1
//       })),
//       paymentMethod: paymentMethod || 'Unknown',
//       customerInfo: customerInfo || {},
//       paymentInfo: paymentInfo || {},
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
    
//     let savedOrder;
    
//     if (mongoConnected && Order) {
//       try {
//         const existingOrder = await Order.findOne({ reference: orderReference }).maxTimeMS(5000);
//         if (existingOrder) {
//           return res.status(400).json({ 
//             success: false, 
//             message: "Order reference already exists" 
//           });
//         }
        
//         const newOrder = new Order(orderData);
//         savedOrder = await newOrder.save();
//         console.log(`Order created in MongoDB: ${savedOrder._id}`);
        
//       } catch (mongoError) {
//         console.error("MongoDB order creation failed:", mongoError.message);
//         console.log("Falling back to file-based storage");
        
//         const orders = readJSON(ORDERS_FILE_PATH);
//         const fileOrder = {
//           _id: new Date().getTime().toString(),
//           ...orderData
//         };
//         orders.push(fileOrder);
//         writeJSON(ORDERS_FILE_PATH, orders);
//         savedOrder = fileOrder;
//         console.log(`Order saved to file: ${savedOrder._id}`);
//       }
//     } else {
//       const orders = readJSON(ORDERS_FILE_PATH);
      
//       const existingOrder = orders.find(o => o.reference === orderReference);
//       if (existingOrder) {
//         return res.status(400).json({ 
//           success: false, 
//           message: "Order reference already exists" 
//         });
//       }
      
//       const fileOrder = {
//         _id: new Date().getTime().toString(),
//         ...orderData
//       };
//       orders.push(fileOrder);
//       writeJSON(ORDERS_FILE_PATH, orders);
//       savedOrder = fileOrder;
//       console.log(`Order saved to file: ${savedOrder._id}`);
//     }
    
//     res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       order: savedOrder,
//       _id: savedOrder._id
//     });
    
//   } catch (err) {
//     console.error("Error creating order:", err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Server error occurred while creating order",
//       error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
//     });
//   }
// });
app.get("/api/orders/reference/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!reference || !reference.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Order reference is required" 
      });
    }
    
    console.log(`GET /api/orders/reference/${reference} - Fetching order by reference`);
    
    let order = null;
    
    if (mongoConnected && Order) {
      // Search in MongoDB
      order = await Order.findOne({ reference: reference.trim() }).lean();
      console.log(`MongoDB search for reference ${reference}:`, order ? 'Found' : 'Not found');
    } else {
      // Search in file storage
      const orders = readJSON(ORDERS_FILE_PATH);
      order = orders.find(o => o.reference === reference.trim());
      console.log(`File search for reference ${reference}:`, order ? 'Found' : 'Not found');
    }
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: `Order with reference ${reference} not found` 
      });
    }
    
    // Return the order data directly
    res.json(order);
    
  } catch (err) {
    console.error("Error fetching order by reference:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while fetching order",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ================== ANALYTICS ROUTES ==================
app.get("/api/analytics/dashboard", async (req, res) => {
  try {
    console.log("Fetching dashboard analytics...");
    
    const stats = {
      totalUsers: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      totalPosts: 0,
      recentActivity: []
    };

    // Get user count with better error handling
    try {
      if (mongoConnected && User) {
        stats.totalUsers = await User.countDocuments();
        console.log(`Found ${stats.totalUsers} users in MongoDB`);
      } else {
        const users = readJSON(USERS_PATH);
        stats.totalUsers = Array.isArray(users) ? users.length : 0;
        console.log(`Using file-based user count: ${stats.totalUsers}`);
      }
    } catch (userErr) {
      console.error("Error counting users:", userErr.message);
      stats.totalUsers = 0;
    }

    // Get order count and revenue
    try {
      if (mongoConnected && Order) {
        const orders = await Order.find().lean();
        stats.totalOrders = orders.length;
        stats.totalRevenue = orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (order.amount || 0), 0);
        console.log(`Found ${stats.totalOrders} orders, revenue: ₵${stats.totalRevenue}`);
      } else {
        const orders = readJSON(ORDERS_FILE_PATH);
        stats.totalOrders = Array.isArray(orders) ? orders.length : 0;
        stats.totalRevenue = Array.isArray(orders) ? orders
          .filter(order => order.status === 'Delivered')
          .reduce((sum, order) => sum + (order.amount || 0), 0) : 0;
        console.log(`Using file-based order count: ${stats.totalOrders}, revenue: ₵${stats.totalRevenue}`);
      }
    } catch (orderErr) {
      console.error("Error counting orders:", orderErr.message);
      stats.totalOrders = 0;
      stats.totalRevenue = 0;
    }

    // Get product count
    try {
      const products = readJSON(DATA_PATH);
      stats.totalProducts = Array.isArray(products) ? products.length : 0;
      console.log(`Found ${stats.totalProducts} products`);
    } catch (productErr) {
      console.warn("Could not read products:", productErr.message);
      stats.totalProducts = 0;
    }

    // Get CMS posts count
    try {
      if (mongoConnected && CMSPost) {
        stats.totalPosts = await CMSPost.countDocuments();
      } else {
        const posts = readJSON(CMS_POSTS_PATH);
        stats.totalPosts = Array.isArray(posts) ? posts.length : 0;
      }
      console.log(`Found ${stats.totalPosts} CMS posts`);
    } catch (cmsErr) {
      console.warn("Could not count CMS posts:", cmsErr.message);
      stats.totalPosts = 0;
    }

    // Get recent activity
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
        
      console.log(`Found ${stats.recentActivity.length} recent activities`);
    } catch (activityErr) {
      console.warn("Could not fetch recent activity:", activityErr.message);
      stats.recentActivity = [];
    }

    console.log("Analytics fetched successfully:", stats);
    res.json({ success: true, stats });
    
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch dashboard analytics",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ================== CMS ROUTES ==================
app.get("/api/cms/posts", async (req, res) => {
  try {
    const { type, status, limit = 50, page = 1 } = req.query;
    
    if (mongoConnected && CMSPost) {
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
      let posts = readJSON(CMS_POSTS_PATH);
      
      if (type && type !== 'all') {
        posts = posts.filter(post => post.type === type);
      }
      if (status) {
        posts = posts.filter(post => post.status === status);
      }
      
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
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
    console.error("Error fetching CMS posts:", err);
    res.status(500).json({ success: false, message: "Failed to fetch posts" });
  }
});

app.get("/api/cms/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (mongoConnected && CMSPost) {
      const post = await CMSPost.findById(id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      post.views += 1;
      await post.save();
      
      res.json({ success: true, post });
    } else {
      const posts = readJSON(CMS_POSTS_PATH);
      const post = posts.find(p => p.id.toString() === id);
      
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }
      
      post.views = (post.views || 0) + 1;
      writeJSON(CMS_POSTS_PATH, posts);
      
      res.json({ success: true, post });
    }
  } catch (err) {
    console.error("Error fetching CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to fetch post" });
  }
});

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
    
    if (mongoConnected && CMSPost) {
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
    console.error("Error creating CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to create post" });
  }
});

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
    
    if (mongoConnected && CMSPost) {
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
    console.error("Error updating CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to update post" });
  }
});

app.delete("/api/cms/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (mongoConnected && CMSPost) {
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
    console.error("Error deleting CMS post:", err);
    res.status(500).json({ success: false, message: "Failed to delete post" });
  }
});

// ================== SETTINGS ROUTES ==================
app.get("/api/settings", (req, res) => {
  try {
    const settings = readJSON(SETTINGS_PATH);
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

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
    console.error("Error updating settings:", err);
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// ================== PRODUCT ROUTES ==================
const uploadMultiple = multer({ storage }).array("images", 5);

app.get("/api/products", (req, res) => {
  const products = readJSON(DATA_PATH);
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  try {
    const products = readJSON(DATA_PATH);
    const { id } = req.params;
    
    const product = products.find((p) => p.id === id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  } catch (err) {
    console.error("Failed to fetch product:", err);
    res.status(500).json({ message: "Server error" });
  }
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
    console.error("Failed to add product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/products/:id", uploadMultiple, (req, res) => {
  try {
    const products = readJSON(DATA_PATH);
    const { id } = req.params;
    const { name, price, description, colors, sizes } = req.body;
    
    if (!name || !price || !description) {
      return res.status(400).json({ message: "Name, price and description are required" });
    }

    const index = products.findIndex((p) => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingImages = products[index].images || [];
    const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const images = newImages.length > 0 ? newImages : existingImages;

    const updatedProduct = {
      ...products[index],
      name,
      price: parseFloat(price),
      description,
      colors: colors ? colors.split(",").map((c) => c.trim()) : [],
      sizes: sizes ? sizes.split(",").map((s) => s.trim()) : [],
      images,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    writeJSON(DATA_PATH, products);
    
    res.json(updatedProduct);
  } catch (err) {
    console.error("Failed to update product:", err);
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
    console.error("Failed to delete product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== NOTIFICATION ROUTES ==================
app.post("/api/notifications", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Input validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Email configuration check
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Email configuration missing" 
      });
    }

    // Save notification to database
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
      // Enhanced email verification with timeout
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email verification timeout after 10 seconds')), 10000)
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      console.log("Email transporter verified successfully");
      
      const mailOptions = {
        from: `"Pent-Shop Admin" <${process.env.EMAIL_USER}>`,
        to: email.trim(),
        subject: "Message from Pent-Shop Admin",
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

      // Send email with timeout
      const sendPromise = transporter.sendMail(mailOptions);
      const sendTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout after 30 seconds')), 30000)
      );
      
      const info = await Promise.race([sendPromise, sendTimeoutPromise]);
      console.log("Email sent successfully:", info.messageId);

      // Update notification status
      const updatedNotifications = readJSON(NOTIFICATIONS_PATH);
      const notificationIndex = updatedNotifications.findIndex(n => n.id === newNotification.id);
      if (notificationIndex > -1) {
        updatedNotifications[notificationIndex].sent = true;
        updatedNotifications[notificationIndex].emailInfo = {
          messageId: info.messageId,
          sentAt: new Date().toISOString(),
          response: info.response
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
      console.error("Email sending failed:", emailError);
      
      // Update notification with error
      const updatedNotifications = readJSON(NOTIFICATIONS_PATH);
      const notificationIndex = updatedNotifications.findIndex(n => n.id === newNotification.id);
      if (notificationIndex > -1) {
        updatedNotifications[notificationIndex].sent = false;
        updatedNotifications[notificationIndex].error = {
          message: emailError.message,
          code: emailError.code,
          timestamp: new Date().toISOString()
        };
        writeJSON(NOTIFICATIONS_PATH, updatedNotifications);
      }

      // Enhanced error handling
      let errorMessage = "Failed to send email";
      let statusCode = 500;
      
      if (emailError.message.includes('timeout')) {
        errorMessage = "Email sending timed out. Please check your internet connection and try again.";
        statusCode = 408;
      } else if (emailError.code === 'EAUTH') {
        errorMessage = "Email authentication failed. Please check EMAIL_USER and EMAIL_PASS configuration.";
        statusCode = 401;
      } else if (emailError.code === 'ENOTFOUND' || emailError.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to email server. Please check your internet connection.";
        statusCode = 503;
      } else if (emailError.responseCode === 535) {
        errorMessage = "Invalid email credentials. Please verify your email settings.";
        statusCode = 401;
      } else if (emailError.responseCode === 550) {
        errorMessage = "Email address rejected by server. Please verify the recipient email.";
        statusCode = 400;
      } else if (emailError.code === 'EMESSAGE') {
        errorMessage = "Invalid email content. Please check your message format.";
        statusCode = 400;
      }

      return res.status(statusCode).json({ 
        success: false, 
        message: errorMessage,
        notification: newNotification,
        sent: false,
        error: {
          code: emailError.code,
          message: emailError.message,
          ...(process.env.NODE_ENV === 'development' && { stack: emailError.stack })
        }
      });
    }

  } catch (err) {
    console.error("Notification processing error:", err);
    
    // Enhanced general error handling
    let errorMessage = "Server error while processing notification";
    let statusCode = 500;
    
    if (err.code === 'ENOENT') {
      errorMessage = "Notification storage error. Please try again.";
    } else if (err.name === 'SyntaxError') {
      errorMessage = "Invalid data format in request.";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err.stack,
          name: err.name 
        })
      }
    });
  }
});

// Add health check endpoint for notifications
app.get("/api/notifications/health", async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Email not configured" 
      });
    }

    // Quick verification with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    await transporter.verify();
    clearTimeout(timeoutId);
    
    res.json({ success: true, message: "Email service healthy" });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Email service unavailable",
      error: err.message 
    });
  }
});
// Add these routes to your server.js file in the USER ROUTES section

// Get user profile by ID
app.get("/api/users/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !id.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    if (mongoConnected && User) {
      // Use MongoDB
      let user;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id).select('-password');
      } else {
        // Fallback to search by other fields if not a valid ObjectId
        user = await User.findOne({ 
          $or: [
            { email: id },
            { _id: id }
          ]
        }).select('-password');
      }
      
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
          _id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          updatedAt: user.updatedAt
        }
      });
    } else {
      // Use file-based storage
      const users = readJSON(USERS_PATH);
      const user = users.find(u => 
        u.id === id || 
        u._id === id || 
        u.email === id
      );
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const { password, ...safeUser } = user;
      res.json({ 
        success: true, 
        user: safeUser
      });
    }
    
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching user profile" 
    });
  }
});

// Update user profile by ID
app.put("/api/users/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    if (!id || !id.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Name is required" 
      });
    }

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

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (mongoConnected && User) {
      // Use MongoDB
      let user;
      
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      } else {
        user = await User.findOne({ 
          $or: [
            { email: id },
            { _id: id }
          ]
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Check if email is already taken by another user
      if (user.email !== cleanEmail) {
        const existingUser = await User.findOne({ 
          email: cleanEmail,
          _id: { $ne: user._id }
        });
        
        if (existingUser) {
          return res.status(400).json({ 
            success: false, 
            message: "Email address is already taken by another user" 
          });
        }
      }

      // Update user
      user.name = cleanName;
      user.email = cleanEmail;
      user.updatedAt = new Date();
      
      await user.save();

      const responseUser = {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        updatedAt: user.updatedAt
      };

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: responseUser
      });
    } else {
      // Use file-based storage
      const users = readJSON(USERS_PATH);
      const userIndex = users.findIndex(u => 
        u.id === id || 
        u._id === id || 
        u.email === id
      );
      
      if (userIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const user = users[userIndex];

      // Check if email is already taken by another user
      if (user.email !== cleanEmail) {
        const existingUser = users.find(u => 
          u.email === cleanEmail && 
          u.id !== user.id
        );
        
        if (existingUser) {
          return res.status(400).json({ 
            success: false, 
            message: "Email address is already taken by another user" 
          });
        }
      }

      // Update user
      users[userIndex] = {
        ...user,
        name: cleanName,
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      };
      
      writeJSON(USERS_PATH, users);

      const { password, ...safeUser } = users[userIndex];
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: safeUser
      });
    }
    
  } catch (err) {
    console.error("Error updating user profile:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Email address is already taken" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error while updating user profile" 
    });
  }
});

// Get orders for a specific user (alternative endpoint)
app.get("/api/orders/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Email parameter is required" 
      });
    }

    const userEmail = decodeURIComponent(email.trim().toLowerCase());
    console.log(`Fetching orders for user email: ${userEmail}`);
    
    if (mongoConnected && Order) {
      const orders = await Order.find({ 
        userEmail: userEmail 
      })
      .sort({ createdAt: -1 })
      .lean();
      
      console.log(`Found ${orders.length} orders for user ${userEmail}`);
      res.json(orders);
    } else {
      const orders = readJSON(ORDERS_FILE_PATH);
      const userOrders = orders.filter(order => {
        const orderEmail = order.userEmail || order.email;
        return orderEmail && orderEmail.toLowerCase() === userEmail;
      });
      
      // Sort by creation date (newest first)
      userOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0);
        const dateB = new Date(b.createdAt || b.date || 0);
        return dateB - dateA;
      });
      
      console.log(`Found ${userOrders.length} orders for user ${userEmail}`);
      res.json(userOrders);
    }
    
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching orders",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Add endpoint to get notification statistics
app.get("/api/notifications/stats", (req, res) => {
  try {
    const notifications = readJSON(NOTIFICATIONS_PATH);
    
    const stats = {
      total: notifications.length,
      sent: notifications.filter(n => n.sent === true).length,
      failed: notifications.filter(n => n.sent === false).length,
      recent: notifications
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5)
        .map(n => ({
          id: n.id,
          name: n.name,
          email: n.email,
          sent: n.sent,
          timestamp: n.timestamp
        }))
    };
    
    res.json({ success: true, stats });
  } catch (err) {
    console.error("Error fetching notification stats:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch notification statistics" 
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
    console.error("Failed to save spiritual submission:", err.message);
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
      console.error("Paystack error:", data);
      return res.status(500).json({ 
        status: "error", 
        message: data.message || "Paystack initialization failed" 
      });
    }

    // Save order with fallback
    if (products && Array.isArray(products) && products.length > 0) {
      try {
        const orderData = {
          userEmail: email,
          amount: parseFloat(amount),
          reference: data.data.reference,
          products: products.map((p) => ({
            productId: p.productId?.toString() || Date.now().toString(),
            name: p.name || "Unknown Product",
            price: parseFloat(p.price) || 0,
            quantity: parseInt(p.quantity) || 1,
          })),
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        if (mongoConnected && Order) {
          const order = new Order(orderData);
          const savedOrder = await order.save();
          console.log("Order saved:", savedOrder._id);
          
          if (User) {
            await User.updateOne(
              { email: email },
              { $push: { orders: savedOrder._id } }
            );
          }
        } else {
          const orders = readJSON(ORDERS_FILE_PATH);
          const fileOrder = {
            _id: Date.now().toString(),
            ...orderData
          };
          orders.push(fileOrder);
          writeJSON(ORDERS_FILE_PATH, orders);
          console.log("Order saved to file:", fileOrder._id);
        }
      } catch (orderError) {
        console.error("Error saving order:", orderError);
        // Don't fail payment initialization if order save fails
      }
    }

    res.json({
      status: "success",
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("Paystack error:", err);
    res.status(500).json({ 
      status: "error", 
      message: "Payment initialization failed" 
    });
  }
});

// ================== PUBLIC CMS ENDPOINTS ==================
app.get("/api/public/posts", async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    if (mongoConnected && CMSPost) {
      let query = { status: 'published' };
      if (type && type !== 'all') query.type = type;
      
      const posts = await CMSPost.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('-updatedAt');
        
      res.json({ success: true, posts });
    } else {
      let posts = readJSON(CMS_POSTS_PATH);
      
      posts = posts.filter(post => post.status === 'published');
      
      if (type && type !== 'all') {
        posts = posts.filter(post => post.type === type);
      }
      
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      posts = posts.slice(0, parseInt(limit));
      
      res.json({ success: true, posts });
    }
  } catch (err) {
    console.error("Error fetching public posts:", err);
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

    console.log("Testing email connection...");
    await transporter.verify();
    console.log("Email server connection successful");

    const testEmail = {
      from: `"Pent-Shop Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Pent-Shop Email Test",
      html: `
        <h2>Email Test Successful!</h2>
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
    console.log("Test email sent:", info.messageId);

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      sentTo: process.env.EMAIL_USER
    });

  } catch (err) {
    console.error("Email test failed:", err);
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
    mongoConnected: mongoConnected,
    models: {
      User: !!User,
      Order: !!Order,
      CMSPost: !!CMSPost
    },
    features: {
      cms: true,
      settings: true,
      analytics: true,
      notifications: true,
      passwordReset: true
    }
  });
});
// Add these email helper functions to your server.js file

// ================== EMAIL HELPER FUNCTIONS ==================

async function sendOrderConfirmationEmail(orderData) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email not configured - skipping order confirmation email");
      return { success: false, reason: "Email not configured" };
    }

    // Verify email connection with timeout
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email verification timeout')), 5000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log("Email transporter verified for order confirmation");
    
    // Calculate total items
    const totalItems = orderData.products.reduce((sum, product) => sum + (product.quantity || 1), 0);
    
    // Generate products HTML
    const productsHTML = orderData.products.map(product => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; color: #374151;">${product.name}</td>
        <td style="padding: 12px; text-align: center; color: #374151;">₵${product.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: center; color: #374151;">${product.quantity || 1}</td>
        <td style="padding: 12px; text-align: right; color: #374151; font-weight: bold;">₵${((product.price || 0) * (product.quantity || 1)).toFixed(2)}</td>
      </tr>
    `).join('');

    const orderEmailOptions = {
      from: `"Pent-Shop Team" <${process.env.EMAIL_USER}>`,
      to: orderData.userEmail,
      subject: `Order Confirmation - ${orderData.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 32px;">Order Confirmation</h1>
            <p style="color: #666; margin: 10px 0; font-size: 16px;">Thank you for your purchase!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">✅ Order Placed Successfully!</h2>
            <p style="margin: 0; font-size: 18px;"><strong>Reference:</strong> ${orderData.reference}</p>
            <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Status:</strong> ${orderData.status}</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0; margin-bottom: 15px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #e5e7eb;">
                  <th style="padding: 12px; text-align: left; color: #374151; font-weight: bold;">Product</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-weight: bold;">Price</th>
                  <th style="padding: 12px; text-align: center; color: #374151; font-weight: bold;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #374151; font-weight: bold;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #ffffff; border: 2px solid #10b981; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; color: #374151; font-weight: bold;">Total Amount:</span>
                <span style="font-size: 24px; color: #10b981; font-weight: bold;">₵${orderData.amount.toFixed(2)}</span>
              </div>
              <div style="margin-top: 8px; text-align: right;">
                <span style="color: #6b7280; font-size: 14px;">${totalItems} item(s)</span>
              </div>
            </div>
          </div>
          
          <div style="padding: 20px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">What's Next?</h4>
            <ul style="color: #92400e; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>We'll process your order within 24 hours</li>
              <li>You'll receive email updates when your order status changes</li>
              <li>Contact us if you have any questions about your order</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Order placed on: ${new Date(orderData.createdAt).toLocaleString()}<br>
              <strong>Order Reference:</strong> ${orderData.reference}<br>
              <strong>Customer Email:</strong> ${orderData.userEmail}
            </p>
          </div>
        </div>
      `,
      text: `
Order Confirmation - ${orderData.reference}

Thank you for your purchase!

Order Details:
- Reference: ${orderData.reference}
- Status: ${orderData.status}
- Amount: ₵${orderData.amount.toFixed(2)}
- Items: ${totalItems}

Products:
${orderData.products.map(p => `- ${p.name} x${p.quantity || 1} - ₵${((p.price || 0) * (p.quantity || 1)).toFixed(2)}`).join('\n')}

What's Next?
- We'll process your order within 24 hours
- You'll receive email updates when your order status changes
- Contact us if you have any questions

Order placed: ${new Date(orderData.createdAt).toLocaleString()}

---
Pent-Shop Team
      `.trim()
    };

    // Send email with timeout
    const sendPromise = transporter.sendMail(orderEmailOptions);
    const sendTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Order confirmation email timeout after 15 seconds')), 15000)
    );
    
    const info = await Promise.race([sendPromise, sendTimeoutPromise]);
    console.log("Order confirmation email sent successfully:", info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      sentTo: orderData.userEmail 
    };
    
  } catch (emailError) {
    console.error("Order confirmation email failed:", emailError.message);
    return { 
      success: false, 
      error: emailError.message,
      code: emailError.code 
    };
  }
}

async function sendOrderStatusUpdateEmail(orderData, oldStatus, newStatus) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email not configured - skipping status update email");
      return { success: false, reason: "Email not configured" };
    }

    // Verify email connection with timeout
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email verification timeout')), 5000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log("Email transporter verified for status update");
    
    // Status-specific content
    let statusMessage = "";
    let statusColor = "#6b7280";
    let nextSteps = "";
    
    switch (newStatus) {
      case 'Processing':
        statusMessage = "Great news! Your order is now being processed.";
        statusColor = "#f59e0b";
        nextSteps = "We're preparing your items for shipment. You'll be notified once they're ready to ship.";
        break;
      case 'Delivered':
        statusMessage = "Your order has been delivered successfully!";
        statusColor = "#10b981";
        nextSteps = "We hope you enjoy your purchase! If you have any issues, please contact our support team.";
        break;
      case 'Cancelled':
        statusMessage = "Your order has been cancelled.";
        statusColor = "#ef4444";
        nextSteps = "If you have any questions about this cancellation, please contact our support team.";
        break;
      default:
        statusMessage = `Your order status has been updated to ${newStatus}.`;
        statusColor = "#6b7280";
        nextSteps = "We'll keep you updated as your order progresses.";
    }

    const statusUpdateEmailOptions = {
      from: `"Pent-Shop Team" <${process.env.EMAIL_USER}>`,
      to: orderData.userEmail,
      subject: `Order Status Update - ${orderData.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 32px;">Order Status Update</h1>
            <p style="color: #666; margin: 10px 0; font-size: 16px;">Your order has been updated</p>
          </div>
          
          <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); padding: 30px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">${statusMessage}</h2>
            <p style="margin: 0; font-size: 18px;"><strong>Order:</strong> ${orderData.reference}</p>
            <div style="margin: 15px 0; padding: 10px; background-color: rgba(255,255,255,0.2); border-radius: 5px;">
              <span style="font-size: 14px;">Status changed from </span>
              <strong style="font-size: 16px;">${oldStatus}</strong>
              <span style="font-size: 14px;"> to </span>
              <strong style="font-size: 18px;">${newStatus}</strong>
            </div>
          </div>
          
          <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Order Summary</h3>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Reference:</strong> ${orderData.reference}</p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Amount:</strong> ₵${orderData.amount.toFixed(2)}</p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${newStatus}</span></p>
            <p style="color: #4b5563; margin: 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="padding: 20px; background-color: #eff6ff; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">Next Steps</h4>
            <p style="color: #1e40af; line-height: 1.6; margin: 0;">${nextSteps}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Visit Our Store
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from Pent-Shop<br>
              If you have questions, please contact our support team<br>
              <strong>Order Reference:</strong> ${orderData.reference}
            </p>
          </div>
        </div>
      `,
      text: `
Order Status Update - ${orderData.reference}

${statusMessage}

Order Details:
- Reference: ${orderData.reference}
- Status: ${oldStatus} → ${newStatus}
- Amount: ₵${orderData.amount.toFixed(2)}
- Updated: ${new Date().toLocaleString()}

Products:
${orderData.products.map(p => `- ${p.name} x${p.quantity || 1} - ₵${((p.price || 0) * (p.quantity || 1)).toFixed(2)}`).join('\n')}

Next Steps:
${nextSteps}

Visit our store: http://localhost:5173

---
Pent-Shop Team
      `.trim()
    };

    // Send email with timeout
    const sendPromise = transporter.sendMail(statusUpdateEmailOptions);
    const sendTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Status update email timeout after 15 seconds')), 15000)
    );
    
    const info = await Promise.race([sendPromise, sendTimeoutPromise]);
    console.log("Order status update email sent successfully:", info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      sentTo: orderData.userEmail,
      oldStatus,
      newStatus
    };
    
  } catch (emailError) {
    console.error("Order status update email failed:", emailError.message);
    return { 
      success: false, 
      error: emailError.message,
      code: emailError.code 
    };
  }
}

// ================== UPDATED ORDER CREATION ROUTE ==================
// Replace your existing POST /api/orders route with this updated version

app.post("/api/orders", async (req, res) => {
  try {
    console.log("POST /api/orders - Creating new order");
    
    const {
      userEmail,
      amount,
      reference,
      products,
      status = 'Pending',
      paymentMethod,
      customerInfo,
      paymentInfo
    } = req.body;
    
    if (!userEmail || !amount || !products || !Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: userEmail, amount, and products are required" 
      });
    }
    
    if (products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Order must contain at least one product" 
      });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid amount. Must be a positive number" 
      });
    }
    
    const orderReference = reference || `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const orderData = {
      userEmail: userEmail.trim().toLowerCase(),
      amount: parseFloat(amount),
      reference: orderReference,
      status: status || 'Pending',
      products: products.map(product => ({
        productId: product.productId?.toString() || `temp_${Date.now()}_${Math.random()}`,
        name: product.name || 'Unknown Product',
        price: parseFloat(product.price) || 0,
        quantity: parseInt(product.quantity) || 1
      })),
      paymentMethod: paymentMethod || 'Unknown',
      customerInfo: customerInfo || {},
      paymentInfo: paymentInfo || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    let savedOrder;
    
    if (mongoConnected && Order) {
      try {
        const existingOrder = await Order.findOne({ reference: orderReference }).maxTimeMS(5000);
        if (existingOrder) {
          return res.status(400).json({ 
            success: false, 
            message: "Order reference already exists" 
          });
        }
        
        const newOrder = new Order(orderData);
        savedOrder = await newOrder.save();
        console.log(`Order created in MongoDB: ${savedOrder._id}`);
        
      } catch (mongoError) {
        console.error("MongoDB order creation failed:", mongoError.message);
        console.log("Falling back to file-based storage");
        
        const orders = readJSON(ORDERS_FILE_PATH);
        const fileOrder = {
          _id: new Date().getTime().toString(),
          ...orderData
        };
        orders.push(fileOrder);
        writeJSON(ORDERS_FILE_PATH, orders);
        savedOrder = fileOrder;
        console.log(`Order saved to file: ${savedOrder._id}`);
      }
    } else {
      const orders = readJSON(ORDERS_FILE_PATH);
      
      const existingOrder = orders.find(o => o.reference === orderReference);
      if (existingOrder) {
        return res.status(400).json({ 
          success: false, 
          message: "Order reference already exists" 
        });
      }
      
      const fileOrder = {
        _id: new Date().getTime().toString(),
        ...orderData
      };
      orders.push(fileOrder);
      writeJSON(ORDERS_FILE_PATH, orders);
      savedOrder = fileOrder;
      console.log(`Order saved to file: ${savedOrder._id}`);
    }
    
    // *** SEND ORDER CONFIRMATION EMAIL - THIS WAS MISSING! ***
    try {
      const emailResult = await sendOrderConfirmationEmail(savedOrder);
      
      if (emailResult.success) {
        console.log(`Order confirmation email sent to ${savedOrder.userEmail}`);
        
        // Save email notification record
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
          id: Date.now(),
          name: customerInfo?.fullName || 'Customer',
          email: savedOrder.userEmail,
          message: `Order confirmation sent for order ${savedOrder.reference}`,
          timestamp: new Date().toISOString(),
          sent: true,
          type: 'order_confirmation',
          orderReference: savedOrder.reference,
          emailInfo: {
            messageId: emailResult.messageId,
            sentAt: new Date().toISOString()
          }
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);
        
      } else {
        console.warn(`Order confirmation email failed for ${savedOrder.userEmail}:`, emailResult.error || emailResult.reason);
        
        // Save failed email attempt
        const notifications = readJSON(NOTIFICATIONS_PATH);
        notifications.push({
          id: Date.now(),
          name: customerInfo?.fullName || 'Customer',
          email: savedOrder.userEmail,
          message: `Order confirmation email failed for order ${savedOrder.reference}`,
          timestamp: new Date().toISOString(),
          sent: false,
          type: 'order_confirmation_failed',
          orderReference: savedOrder.reference,
          error: {
            message: emailResult.error || emailResult.reason,
            timestamp: new Date().toISOString()
          }
        });
        writeJSON(NOTIFICATIONS_PATH, notifications);
      }
      
    } catch (emailError) {
      console.error("Unexpected error sending order confirmation:", emailError);
    }
    
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
      _id: savedOrder._id,
      emailSent: true // Let frontend know email was attempted
    });
    
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred while creating order",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ================== UPDATED ORDER STATUS UPDATE ROUTE ==================
// Replace your existing PUT /api/orders/:id route with this updated version

app.put("/api/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`PUT /api/orders/${id} - Updating order status to: ${status}`);
    
    if (!status || !status.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required and cannot be empty" 
      });
    }
    
    const validStatuses = ["Pending", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    let updatedOrder;
    let oldStatus;
    
    if (mongoConnected && Order) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid order ID format" 
        });
      }
      
      // First get the current order to capture old status
      const currentOrder = await Order.findById(id).lean();
      if (!currentOrder) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found. It may have been deleted." 
        });
      }
      
      oldStatus = currentOrder.status;
      
      // Now update the order
      updatedOrder = await Order.findByIdAndUpdate(
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
      
    } else {
      const orders = readJSON(ORDERS_FILE_PATH);
      const index = orders.findIndex(o => o._id === id);
      
      if (index === -1) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found. It may have been deleted." 
        });
      }
      
      oldStatus = orders[index].status;
      
      orders[index].status = status.trim();
      orders[index].updatedAt = new Date().toISOString();
      
      writeJSON(ORDERS_FILE_PATH, orders);
      updatedOrder = orders[index];
    }
    
    // *** SEND STATUS UPDATE EMAIL - THIS WAS MISSING! ***
    // Only send email if status actually changed
    if (oldStatus !== status.trim()) {
      try {
        const emailResult = await sendOrderStatusUpdateEmail(updatedOrder, oldStatus, status.trim());
        
        if (emailResult.success) {
          console.log(`Status update email sent to ${updatedOrder.userEmail} for order ${updatedOrder.reference}`);
          
          // Save email notification record
          const notifications = readJSON(NOTIFICATIONS_PATH);
          notifications.push({
            id: Date.now(),
            name: updatedOrder.customerInfo?.fullName || 'Customer',
            email: updatedOrder.userEmail,
            message: `Order status update email sent: ${oldStatus} → ${status.trim()} for order ${updatedOrder.reference}`,
            timestamp: new Date().toISOString(),
            sent: true,
            type: 'status_update',
            orderReference: updatedOrder.reference,
            statusChange: {
              from: oldStatus,
              to: status.trim()
            },
            emailInfo: {
              messageId: emailResult.messageId,
              sentAt: new Date().toISOString()
            }
          });
          writeJSON(NOTIFICATIONS_PATH, notifications);
          
        } else {
          console.warn(`Status update email failed for ${updatedOrder.userEmail}:`, emailResult.error || emailResult.reason);
          
          // Save failed email attempt
          const notifications = readJSON(NOTIFICATIONS_PATH);
          notifications.push({
            id: Date.now(),
            name: updatedOrder.customerInfo?.fullName || 'Customer',
            email: updatedOrder.userEmail,
            message: `Status update email failed for order ${updatedOrder.reference}`,
            timestamp: new Date().toISOString(),
            sent: false,
            type: 'status_update_failed',
            orderReference: updatedOrder.reference,
            statusChange: {
              from: oldStatus,
              to: status.trim()
            },
            error: {
              message: emailResult.error || emailResult.reason,
              timestamp: new Date().toISOString()
            }
          });
          writeJSON(NOTIFICATIONS_PATH, notifications);
        }
        
      } catch (emailError) {
        console.error("Unexpected error sending status update email:", emailError);
      }
    } else {
      console.log("Status unchanged, skipping email notification");
    }
    
    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
      statusChanged: oldStatus !== status.trim(),
      emailSent: oldStatus !== status.trim() // Let frontend know if email was attempted
    });
    
  } catch (err) {
    console.error("Error updating order:", err);
    
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

// ================== EMAIL TESTING ENDPOINT ==================
// Add this route to test email functionality

app.post("/api/test-order-email", async (req, res) => {
  try {
    const { type = 'confirmation' } = req.body;
    
    // Mock order data for testing
    const mockOrder = {
      userEmail: process.env.EMAIL_USER, // Send to yourself for testing
      reference: `TEST-${Date.now()}`,
      amount: 50.00,
      status: 'Pending',
      products: [
        { name: 'Test Product 1', price: 25.00, quantity: 1 },
        { name: 'Test Product 2', price: 25.00, quantity: 1 }
      ],
      customerInfo: { fullName: 'Test Customer' },
      createdAt: new Date()
    };
    
    let emailResult;
    
    if (type === 'confirmation') {
      emailResult = await sendOrderConfirmationEmail(mockOrder);
    } else if (type === 'status_update') {
      emailResult = await sendOrderStatusUpdateEmail(mockOrder, 'Pending', 'Processing');
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid email type. Use 'confirmation' or 'status_update'"
      });
    }
    
    if (emailResult.success) {
      res.json({
        success: true,
        message: `Test ${type} email sent successfully`,
        messageId: emailResult.messageId,
        sentTo: emailResult.sentTo
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Test ${type} email failed`,
        error: emailResult.error || emailResult.reason
      });
    }
    
  } catch (err) {
    console.error("Email test error:", err);
    res.status(500).json({
      success: false,
      message: "Email test failed",
      error: err.message
    });
  }
});

// ================== EMAIL STATUS ENDPOINT ==================
// Add this route to check email configuration status
// ================== EMAIL STATUS ENDPOINT ==================
// Add this route to check email configuration status

app.get("/api/email-status", async (req, res) => {
  try {
    const status = {
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      emailUser: process.env.EMAIL_USER || 'Not configured',
      emailPass: process.env.EMAIL_PASS ? 'Configured' : 'Not configured',
      connection: false,
      error: null
    };
    
    if (status.configured) {
      try {
        // Test email connection with timeout
        const verifyPromise = transporter.verify();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        await Promise.race([verifyPromise, timeoutPromise]);
        status.connection = true;
      } catch (connError) {
        status.connection = false;
        status.error = connError.message;
      }
    }
    
    res.json({
      success: true,
      emailStatus: status
    });
    
  } catch (err) {
    console.error("Email status check error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to check email status",
      error: err.message
    });
  }
});

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ================== 404 HANDLER ==================
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "Route not found" });
  }
  res.status(404).send("Not found");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`MongoDB Connected: ${mongoConnected}`);
  console.log(`Models loaded - User: ${!!User}, Order: ${!!Order}, CMSPost: ${!!CMSPost}`);
  console.log(`Features enabled: CMS, Settings, Analytics, Enhanced Notifications, Password Reset`);
  console.log(`Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  
  // Test email connection on startup
  testEmailConnection().then((emailReady) => {
    if (emailReady) {
      console.log("📧 Email service ready for notifications");
    } else {
      console.log("📧 Email service not available - check configuration");
    }
  });
  
  // Initialize models if MongoDB is connected
  if (mongoConnected) {
    initializeModels().then(() => {
      console.log("Models initialization completed");
    });
  }
});