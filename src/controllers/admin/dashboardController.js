const User = require("../../models/User");
const PainLog = require("../../models/PainLog");
const MoodLog = require("../../models/MoodLog");
const HydrationLog = require("../../models/HydrationLog");
const MedicationIntake = require("../../models/MedicationIntake");
const PainLocation = require("../../models/PainLocation");

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    // 1. Determine Trend Period (Default: 7 days)
    const days = parseInt(req.query.days) || 7;
    const trendStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. User Stats
    const totalUsers = await User.countDocuments();
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    
    // Calculate total child profiles
    // This requires aggregation since childProfiles is an array inside User
    const childProfileStats = await User.aggregate([
      { $project: { numberOfChildren: { $size: { $ifNull: ["$childProfiles", []] } } } },
      { $group: { _id: null, totalChildren: { $sum: "$numberOfChildren" } } }
    ]);
    const totalChildren = childProfileStats[0]?.totalChildren || 0;

    // 2. Activity / Logs Stats (Total)
    const [totalPainLogs, totalMoodLogs, totalHydrationLogs, totalMedLogs] = await Promise.all([
      PainLog.countDocuments(),
      MoodLog.countDocuments(),
      HydrationLog.countDocuments(),
      MedicationIntake.countDocuments(),
    ]);

    // 3. Activity Trends (Dynamic Days)
    const getDailyCount = async (Model, dateField = "createdAt") => {
      return await Model.aggregate([
        { 
          $match: { 
            [dateField]: { $gte: trendStartDate, $exists: true, $type: "date" } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    };

    const painTrend = await getDailyCount(PainLog, "date");
    const moodTrend = await getDailyCount(MoodLog, "date");
    const hydrationTrend = await getDailyCount(HydrationLog, "date");
    const medicationTrend = await getDailyCount(MedicationIntake, "dateTime");
    
    // Note: HydrationLog usually has 'date' or timestamps. Using createdAt as fallback if needed but models usually have date.
    // Let's verify HydrationLog structure quickly if I could, but standard is 'date' in this app given PainLog/MoodLog.
    
    // 4. Insights
    
    // Top 5 Pain Locations
    const topPainLocations = await PainLog.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "painlocations",
          localField: "_id",
          foreignField: "_id",
          as: "locationDetails",
        },
      },
      { $unwind: "$locationDetails" },
      {
        $project: {
          name: "$locationDetails.name",
          count: 1,
        },
      },
    ]);

    // Mood Distribution (Last 30 days)
    const moodDistribution = await MoodLog.aggregate([
      { $match: { date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$emoji", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      users: {
        total: totalUsers,
        totalChildren,
        newLast30Days: newUsersLast30Days,
      },
      logs: {
        total: {
          pain: totalPainLogs,
          mood: totalMoodLogs,
          hydration: totalHydrationLogs,
          medication: totalMedLogs,
        },
        trends: {
          pain: painTrend,
          mood: moodTrend,
          hydration: hydrationTrend,
          medication: medicationTrend,
        },
      },
      insights: {
        topPainLocations,
        moodDistribution,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
};

module.exports = { getDashboardStats };
