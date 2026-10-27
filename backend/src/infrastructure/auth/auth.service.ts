import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { query } from '../database/connection';
import { appConfig } from '../../common/config/app.config';
import { logger } from '../observability/logger';
import { JWTPayload, RegisterRequest, LoginRequest, LoginResponse } from '../../common/types/auth.types';

export class AuthService {
  static async register(data: RegisterRequest): Promise<{ userId: string; email: string }> {
    const { email, password, firstName, lastName, phone, userType } = data;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, appConfig.bcryptRounds);

    // Create user
    const userId = uuidv4();
    const userRole = userType === 'doctor' ? 'doctor' : 'patient';

    const result = await query(
      `INSERT INTO users (id, email, password_hash, phone, role, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())
       RETURNING id, email`,
      [userId, email, hashedPassword, phone, userRole]
    );

    // Create user profile
    await query(
      `INSERT INTO profiles (id, user_id, first_name, last_name, bio, avatar_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, null, null, NOW(), NOW())`,
      [uuidv4(), userId, firstName, lastName]
    );

    logger.info('User registered successfully', { userId, email, userType });

    return {
      userId: result.rows[0].id,
      email: result.rows[0].email,
    };
  }

  static async login(data: LoginRequest): Promise<LoginResponse> {
    const { email, password, totpCode } = data;

    // Get user by email
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.mfa_enabled, u.mfa_secret,
              p.first_name, p.last_name
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Verify MFA if enabled
    if (user.mfa_enabled) {
      if (!totpCode) {
        throw new Error('MFA code required');
      }

      const isValidMfa = verify({ token: totpCode, secret: user.mfa_secret });
      if (!isValidMfa) {
        throw new Error('Invalid MFA code');
      }
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token in cache (with expiry)
    const cacheKey = `refresh_token:${user.id}:${refreshToken}`;
    // Note: cache service should be called here but keeping it simple for now

    logger.info('User logged in successfully', { userId: user.id, email });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        mfaEnabled: user.mfa_enabled,
      },
    };
  }

  static async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, appConfig.jwtRefreshSecret) as JWTPayload;

      // Get user to verify they still exist
      const userResult = await query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const newAccessToken = this.generateAccessToken(user.id, user.email, user.role);

      return newAccessToken;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async setupMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = generateSecret();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(
      generateURI({
        label: userId,
        issuer: appConfig.mfaIssuer,
        secret,
      })
    );

    logger.info('MFA setup initiated', { userId });

    return { secret, qrCode };
  }

  static async verifyMFASetup(userId: string, totpCode: string, secret: string): Promise<void> {
    const isValid = verify({ token: totpCode, secret });

    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    // Enable MFA for user
    await query(
      'UPDATE users SET mfa_enabled = true, mfa_secret = $1 WHERE id = $2',
      [secret, userId]
    );

    logger.info('MFA enabled successfully', { userId });
  }

  static async disableMFA(userId: string, password: string): Promise<void> {
    // Get user
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Disable MFA
    await query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = null WHERE id = $1',
      [userId]
    );

    logger.info('MFA disabled successfully', { userId });
  }

  static generateAccessToken(userId: string, email: string, role: string): string {
    const payload: JWTPayload = {
      userId,
      email,
      role: role as 'patient' | 'doctor' | 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };

    return jwt.sign(payload, appConfig.jwtAccessSecret);
  }

  static generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    return jwt.sign(payload, appConfig.jwtRefreshSecret);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, appConfig.jwtAccessSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }
}
