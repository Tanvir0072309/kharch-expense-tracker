const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const RefreshToken = require("../models/RefreshToken");

const ACCESS_TOKEN_EXPIRES_IN =
  process.env.JWT_ACCESS_EXPIRES_IN || "15m";

const REFRESH_TOKEN_EXPIRES_IN =
  process.env.JWT_REFRESH_EXPIRES_IN || "30d";

const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const generateAccessToken = ({ userId, email }) => {
  return jwt.sign(
    {
      sub: String(userId),
      email,
      type: "access",
    },
    getRequiredEnv("JWT_ACCESS_SECRET"),
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: "kharch-api",
      audience: "kharch-client",
    },
  );
};

const generateRefreshTokenValue = () => {
  return crypto.randomBytes(64).toString("base64url");
};

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return expiresAt;
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

const issueTokens = async ({ userId, email }) => {
  const accessToken = generateAccessToken({
    userId,
    email,
  });

  const refreshToken = generateRefreshTokenValue();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresAt: expiresAt,
  };
};

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    getRequiredEnv("JWT_ACCESS_SECRET"),
    {
      issuer: "kharch-api",
      audience: "kharch-client",
    },
  );
};

const rotateRefreshToken = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findByTokenHash(tokenHash);

  if (!storedToken) {
    const error = new Error("Invalid refresh token");
    error.code = "INVALID_REFRESH_TOKEN";
    throw error;
  }

  if (storedToken.revoked_at) {
    const error = new Error("Refresh token has been revoked");
    error.code = "REFRESH_TOKEN_REVOKED";
    throw error;
  }

  if (new Date(storedToken.expires_at) <= new Date()) {
    const error = new Error("Refresh token has expired");
    error.code = "REFRESH_TOKEN_EXPIRED";
    throw error;
  }

  await RefreshToken.revoke(storedToken.id);

  const newAccessToken = generateAccessToken({
    userId: storedToken.user_id,
    email: undefined,
  });

  const newRefreshToken = generateRefreshTokenValue();
  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = getRefreshTokenExpiry();

  await RefreshToken.create({
    userId: storedToken.user_id,
    tokenHash: newRefreshTokenHash,
    expiresAt: newExpiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresAt: newExpiresAt,
  };
};

const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findByTokenHash(tokenHash);

  if (!storedToken) {
    return false;
  }

  await RefreshToken.revoke(storedToken.id);

  return true;
};

module.exports = {
  generateAccessToken,
  issueTokens,
  verifyAccessToken,
  rotateRefreshToken,
  revokeRefreshToken,
};