const mongoose = require("mongoose");

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
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    refreshToken: { type: String, default: null },
    hydrationGoalOz: { type: Number, default: 64 },
    coins: { type: Number, default: 0 },

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
      emergencyPin: {
        type: String,
      },
    },

    // Settings
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });

userSchema.pre("save", async function (next) {
  if (
    this.isModified("emergencySettings.emergencyPin") &&
    this.emergencySettings.emergencyPin
  ) {
    this.emergencySettings.emergencyPin = await bcrypt.hash(
      this.emergencySettings.emergencyPin,
      12
    );
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
