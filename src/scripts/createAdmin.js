// scripts/createAdmin.js
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Admin = require("../models/Admin");

const ADMIN_EMAIL = "admin@sicklehealth.app";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Super Admin";

(async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found! Check your .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }

  try {
    const existing = await Admin.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("Admin already exists:", existing.email);
      process.exit(0);
    }

    await Admin.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: "superadmin",
      isActive: true,
    });

    console.log("\nFIRST ADMIN CREATED SUCCESSFULLY!");
    console.log("Login Details:");
    console.log(`   Email   : ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role    : superadmin`);
    console.log("\nSECURITY: CHANGE PASSWORD IMMEDIATELY AFTER LOGIN!");
    console.log("   → POST /api/v1/admin/auth/change-password\n");

    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err.message);
    process.exit(1);
  }
})();
