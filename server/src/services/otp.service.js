const crypto = require("node:crypto");

const redisClient = require("../config/redis");
const { generateOtp, hashOtp } = require("../utils/otp");

const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const normalizeEmail = (email) => email.trim().toLowerCase();

const createOtpKey = (email) => `auth:otp:${normalizeEmail(email)}`;
const createAttemptsKey = (email) =>
  `auth:otp:attempts:${normalizeEmail(email)}`;
const createCooldownKey = (email) =>
  `auth:otp:cooldown:${normalizeEmail(email)}`;

const generateAndStoreOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const cooldownKey = createCooldownKey(normalizedEmail);

  const cooldownExists = await redisClient.exists(cooldownKey);

  if (cooldownExists) {
    const ttl = await redisClient.ttl(cooldownKey);

    const error = new Error("OTP resend cooldown is active");
    error.code = "OTP_RESEND_COOLDOWN";
    error.retryAfter = Math.max(ttl, 0);

    throw error;
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  const otpKey = createOtpKey(normalizedEmail);
  const attemptsKey = createAttemptsKey(normalizedEmail);

  await redisClient
    .multi()
    .set(otpKey, otpHash, {
      EX: OTP_TTL_SECONDS,
    })
    .set(attemptsKey, "0", {
      EX: OTP_TTL_SECONDS,
    })
    .set(cooldownKey, "1", {
      EX: OTP_RESEND_COOLDOWN_SECONDS,
    })
    .exec();

  return {
    otp,
    expiresIn: OTP_TTL_SECONDS,
  };
};

const verifyOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);

  const otpKey = createOtpKey(normalizedEmail);
  const attemptsKey = createAttemptsKey(normalizedEmail);

  const [storedOtpHash, attemptsValue] = await Promise.all([
    redisClient.get(otpKey),
    redisClient.get(attemptsKey),
  ]);

  if (!storedOtpHash) {
    const error = new Error("OTP expired or does not exist");
    error.code = "OTP_EXPIRED";
    throw error;
  }

  const attempts = Number(attemptsValue ?? 0);

  if (attempts >= OTP_MAX_ATTEMPTS) {
    await Promise.all([
      redisClient.del(otpKey),
      redisClient.del(attemptsKey),
    ]);

    const error = new Error("Maximum OTP attempts exceeded");
    error.code = "OTP_ATTEMPTS_EXCEEDED";

    throw error;
  }

  if (!/^\d{6}$/.test(otp)) {
    await redisClient.incr(attemptsKey);

    const error = new Error("Invalid OTP format");
    error.code = "INVALID_OTP";
    throw error;
  }

  const providedOtpHash = hashOtp(otp);

  const isValid =
    crypto.timingSafeEqual(
      Buffer.from(storedOtpHash, "hex"),
      Buffer.from(providedOtpHash, "hex"),
    );

  if (!isValid) {
    const nextAttempts = await redisClient.incr(attemptsKey);

    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      await Promise.all([
        redisClient.del(otpKey),
        redisClient.del(attemptsKey),
      ]);
    }

    const error = new Error("Invalid OTP");
    error.code = "INVALID_OTP";
    throw error;
  }

  await Promise.all([
    redisClient.del(otpKey),
    redisClient.del(attemptsKey),
    redisClient.del(createCooldownKey(normalizedEmail)),
  ]);

  return true;
};

const getOtpStatus = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const otpKey = createOtpKey(normalizedEmail);
  const cooldownKey = createCooldownKey(normalizedEmail);

  const [otpTtl, cooldownTtl] = await Promise.all([
    redisClient.ttl(otpKey),
    redisClient.ttl(cooldownKey),
  ]);

  return {
    otpExists: otpTtl > 0,
    otpTtl: Math.max(otpTtl, 0),
    cooldownTtl: Math.max(cooldownTtl, 0),
  };
};

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
  getOtpStatus,
};