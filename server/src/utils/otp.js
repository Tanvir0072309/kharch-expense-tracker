const crypto = require("node:crypto");

const OTP_LENGTH = 6;

const generateOtp = () => {
  const max = 10 ** OTP_LENGTH;

  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
};

const hashOtp = (otp) => {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
};

module.exports = {
  generateOtp,
  hashOtp,
};