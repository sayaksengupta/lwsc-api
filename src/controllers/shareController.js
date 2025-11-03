const PainLog = require('../models/PainLog');
const MoodLog = require('../models/MoodLog');
const Connection = require('../models/Connection');
const SharedPainLog = require('../models/SharedPainLog');
const SharedMoodLog = require('../models/SharedMoodLog');

const sharePain = async (req, res) => {
  const { logId, connectionIds, message } = req.body;
  const userId = req.user._id;

  const painLog = await PainLog.findOne({ _id: logId, userId });
  if (!painLog) {
    return res.status(404).json({ error: { code: 'PAIN_LOG_NOT_FOUND' } });
  }

  const connections = await Connection.find({
    _id: { $in: connectionIds },
    userId
  });

  if (connections.length !== connectionIds.length) {
    return res.status(400).json({ error: { code: 'INVALID_CONNECTIONS' } });
  }

  const shareRecords = connections.map(conn => ({
    painLogId: painLog._id,
    sharedBy: userId,
    sharedWith: conn._id, // assuming connection stores other user's ID
    message
  }));

  await SharedPainLog.insertMany(shareRecords);

  const deliveredTo = connections.map(c => c._id.toString());

  console.log(`Pain log ${logId} shared with:`, deliveredTo);
  res.json({ deliveredTo });
};

const shareMood = async (req, res) => {
  const { logId, connectionIds, message } = req.body;
  const userId = req.user._id;

  const moodLog = await MoodLog.findOne({ _id: logId, userId });
  if (!moodLog) {
    return res.status(404).json({ error: { code: 'MOOD_LOG_NOT_FOUND' } });
  }

  const connections = await Connection.find({
    _id: { $in: connectionIds },
    userId
  });

  if (connections.length !== connectionIds.length) {
    return res.status(400).json({ error: { code: 'INVALID_CONNECTIONS' } });
  }

  const shareRecords = connections.map(conn => ({
    moodLogId: moodLog._id,
    sharedBy: userId,
    sharedWith: conn._id,
    message
  }));

  await SharedMoodLog.insertMany(shareRecords);

  const deliveredTo = connections.map(c => c._id.toString());

  console.log(`Mood log ${logId} shared with:`, deliveredTo);
  res.json({ deliveredTo });
};

module.exports = { sharePain, shareMood };