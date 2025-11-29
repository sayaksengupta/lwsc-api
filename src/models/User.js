// models/User.js
const mongoose = require("mongoose");

const childProfileSchema = new mongoose.Schema(
  {
    childId: {
      type: String,
      required: true,
      default: () => `child_${new mongoose.Types.ObjectId()}`, // e.g. child_671f3a9b8c1d2e3f4a5b6c7d
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 18 },
    dob: { type: Date },
    healthNotes: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, default: "/avatars/child-default.png" },
    coins: { type: Number, default: 50, min: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, unique: true, sparse: true }, // sparse = allows null
    avatarUrl: { type: String, default: null },

    // ── CHILD PROFILES SYSTEM (THE MAGIC) ─────────────────────
    childProfiles: [childProfileSchema],

    // Current active session context
    activeProfileId: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true; // null = parent mode
          return this.childProfiles.some((c) => c.childId === v);
        },
        message: "Invalid activeProfileId",
      },
    },

    // Optional: helpful flag
    hasChildren: {
      type: Boolean,
      default: false,
    },

    refreshToken: { type: String, default: null },
    hydrationGoalOz: { type: Number, default: 64 },
    coins: { type: Number, default: 0 }, // parent's coins

    // Password Reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    emergencySettings: {
      autoAlert: { type: Boolean, default: false },
      triggerThreshold: { type: Number, min: 1, max: 10, default: 8 },
      emergencyMessage: {
        type: String,
        default:
          "I am in severe pain and need immediate help. Please come or call ambulance.",
      },
      emergencyPin: { type: String },
    },

    settings: {
      notifications: {
        hydration: { type: Boolean, default: true },
        medication: { type: Boolean, default: true },
        mood: { type: Boolean, default: true },
        pain: { type: Boolean, default: true },
      },
      reminders: {
        hydrationTimes: { type: [String], default: [] },
        medication: { type: Boolean, default: true },
      },
      privacy: {
        shareWithConnections: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

// ── INDEXES ─────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ "childProfiles.childId": 1 }); // for fast lookup
userSchema.index({ activeProfileId: 1 });

// ── VIRTUAL: Full Name ───────────────────────────
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// ── PRE-SAVE: Update hasChildren flag ─────────────
userSchema.pre("save", function (next) {
  this.hasChildren = this.childProfiles.length > 0;
  next();
});

// ── METHOD: Get current active profile (parent or child) ─────
userSchema.methods.getActiveProfile = function () {
  if (!this.activeProfileId) {
    return {
      profileId: null,
      userId: this._id,
      name: this.fullName,
      type: "parent",
      coins: this.coins,
      avatarUrl: this.avatarUrl,
    };
  }

  const child = this.childProfiles.find(
    (c) => c.childId === this.activeProfileId
  );
  if (!child) {
    this.activeProfileId = null;
    this.save();
    return {
      profileId: null,
      userId: this._id,
      name: this.fullName,
      type: "parent",
      coins: this.coins,
      avatarUrl: this.avatarUrl,
    };
  }

  return {
    profileId: child.childId,
    userId: child.childId, // ← ALL LOGS USE THIS
    name: child.name,
    type: "child",
    age: child.age || this.calculateAge(child.dob),
    coins: child.coins,
    avatarUrl: child.avatarUrl,
    healthNotes: child.healthNotes,
  };
};

// ── HELPER: Calculate age from DOB
userSchema.methods.calculateAge = function (dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

module.exports = mongoose.model("User", userSchema);
