const sendEmergencySMS = async (to, message, userName) => {
    const fullMessage = `[EMERGENCY] ${userName}: ${message}\nLocation: https://maps.google.com/?q=...`;
    
    // In real app: Use Twilio, AWS SNS, etc.
    console.log(`SMS to ${to}:`, fullMessage);
    return { success: true, sid: 'mock-sms-123' };
  };
  
  module.exports = { sendEmergencySMS };