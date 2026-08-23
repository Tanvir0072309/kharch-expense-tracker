const crypto = require("node:crypto");

const redisClient = require("../config/redis");
const { generateOtp, hashOtp } = require("../utils/otp");

const OTP_TTL_SECONDS = 5 * 60;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Short-lived, single-use token exchanged for a verified "password reset" OTP.
// Keeping this separate from the OTP means the OTP itself is never re-sent
// back and forth, and the token can only ever be used for one purpose.
const RESET_TOKEN_TTL_SECONDS = 10 * 60;
const RESET_TOKEN_BYTES = 32;

const VALID_PURPOSES = new Set(["signup", "login", "password_reset"]);

const assertValidPurpose = (purpose) => {
  if (!VALID_PURPOSES.has(purpose)) {
    throw new Error(`Invalid OTP purpose: ${purpose}`);
  }
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const createOtpKey = (email, purpose) =>
  `auth:otp:${purpose}:${normalizeEmail(email)}`;
const createAttemptsKey = (email, purpose) =>
  `auth:otp:${purpose}:attempts:${normalizeEmail(email)}`;
const createCooldownKey = (email, purpose) =>
  `auth:otp:${purpose}:cooldown:${normalizeEmail(email)}`;
const createResetTokenKey = (email) =>
  `auth:reset-token:${normalizeEmail(email)}`;

const generateAndStoreOtp = async (email, purpose) => {
  assertValidPurpose(purpose);

  const normalizedEmail = normalizeEmail(email);
  const cooldownKey = createCooldownKey(normalizedEmail, purpose);

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

  const otpKey = createOtpKey(normalizedEmail, purpose);
  const attemptsKey = createAttemptsKey(normalizedEmail, purpose);

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

const verifyOtp = async (email, otp, purpose) => {
  assertValidPurpose(purpose);

  const normalizedEmail = normalizeEmail(email);

  const otpKey = createOtpKey(normalizedEmail, purpose);
  const attemptsKey = createAttemptsKey(normalizedEmail, purpose);

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

  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    await redisClient.incr(attemptsKey);

    const error = new Error("Invalid OTP format");
    error.code = "INVALID_OTP";
    throw error;
  }

  const providedOtpHash = hashOtp(otp);

  // Both hashes are fixed-length sha256 hex digests, so this is always a
  // constant-time comparison and never throws on length mismatch.
  const isValid = crypto.timingSafeEqual(
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
    redisClient.del(createCooldownKey(normalizedEmail, purpose)),
  ]);

  return true;
};

const getOtpStatus = async (email, purpose) => {
  assertValidPurpose(purpose);

  const normalizedEmail = normalizeEmail(email);

  const otpKey = createOtpKey(normalizedEmail, purpose);
  const cooldownKey = createCooldownKey(normalizedEmail, purpose);

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

// Issued after a "password_reset" OTP has been verified. The raw token is
// only ever sent to the client once; we persist just its hash, the same way
// refresh tokens are handled, so a Redis read/leak alone can't be replayed.
const generateAndStoreResetToken = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const resetToken = crypto
    .randomBytes(RESET_TOKEN_BYTES)
    .toString("base64url");
  const tokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await redisClient.set(createResetTokenKey(normalizedEmail), tokenHash, {
    EX: RESET_TOKEN_TTL_SECONDS,
  });

  return {
    resetToken,
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  };
};

const verifyAndConsumeResetToken = async (email, resetToken) => {
  const normalizedEmail = normalizeEmail(email);
  const key = createResetTokenKey(normalizedEmail);

  const storedHash = await redisClient.get(key);

  if (
    !storedHash ||
    typeof resetToken !== "string" ||
    resetToken.length === 0
  ) {
    const error = new Error("Invalid or expired reset token");
    error.code = "INVALID_RESET_TOKEN";
    throw error;
  }

  const providedHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(storedHash, "hex"),
    Buffer.from(providedHash, "hex"),
  );

  if (!isValid) {
    const error = new Error("Invalid or expired reset token");
    error.code = "INVALID_RESET_TOKEN";
    throw error;
  }

  await redisClient.del(key);

  return true;
};

module.exports = {
  generateAndStoreOtp,
  verifyOtp,
  getOtpStatus,
  generateAndStoreResetToken,
  verifyAndConsumeResetToken,
};
