// utils/formatRecentLog.js
const { formatDistanceToNow } = require('date-fns');

/**
 * Convert any log (pain, mood, hydration) → Recent Logs UI format
 */
function formatRecentLog(log) {
  const base = {
    id: log._id.toString(),
    loggedAt: log.date.toISOString(),
    loggedAgo: formatDistanceToNow(log.date, { addSuffix: true }), // "2 hours ago"
  };

  // ── PAIN LOG ─────────────────────────────────────
  if (log.intensity !== undefined && (log.location || log.painType)) {
    const painTitles = {
      headache: 'Headache',
      chest: 'Chest Pain',
      joint: 'Joint Pain',
      abdominal: 'Abdominal Pain',
      leg: 'Leg Pain',
      back: 'Back Pain',
      other: 'Pain'
    };

    const intensityLabels = ['Very Mild', 'Mild', 'Moderate', 'Severe', 'Very Severe'];
    const intensityLabel = intensityLabels[Math.floor(log.intensity / 2)] || 'Moderate';
    const title = painTitles[log.painType] || log.painType || 'Pain';

    // Safe location name
    let locName = 'Unknown';
    if (log.location) {
      if (typeof log.location === 'string') {
        locName = log.location;
      } else if (log.location.name) {
        locName = log.location.name;
      }
    }

    return {
      ...base,
      type: 'pain',
      title: `${intensityLabel} ${title}`,
      subtitle: locName.charAt(0).toUpperCase() + locName.slice(1),
      emoji: 'red cross',
      intensity: log.intensity,
    };
  }

  // ── MOOD LOG ─────────────────────────────────────
  if (log.emoji && log.intensity !== undefined) {
    const moodTitles = {
      'smiling face': 'Feeling Great',
      'slightly smiling face': 'Feeling Good',
      'neutral face': 'Feeling Okay',
      'slightly frowning face': 'Feeling Down',
      'crying face': 'Feeling Bad',
      'weary face': 'Feeling Terrible',
    };

    return {
      ...base,
      type: 'mood',
      title: moodTitles[log.emoji] || 'Mood Logged',
      subtitle: log.desc || null,
      emoji: log.emoji,
      intensity: log.intensity,
    };
  }

  // ── HYDRATION LOG ────────────────────────────────
  if (log.amountOz !== undefined) {
    const typeLabels = {
      glass: 'Glass of Water',
      bottle: 'Bottle',
      custom: 'Water Intake',
    };

    const totalOz = log.amountOz * (log.quantity || 1);
    const subtitle = log.note || `${totalOz}oz`;

    return {
      ...base,
      type: 'hydration',
      title: typeLabels[log.type] || 'Water Intake',
      subtitle,
      emoji: 'water drop',
      amountOz: totalOz,
    };
  }

  // Fallback
  return {
    ...base,
    type: 'unknown',
    title: 'Logged Entry',
    emoji: 'magnifying glass',
  };
}

module.exports = formatRecentLog;