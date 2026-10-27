import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../infrastructure/auth/auth.service';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { logger } from '../../infrastructure/observability/logger';
import { RegisterRequest, LoginRequest, VerifyMFARequest, RefreshTokenRequest } from '../../common/types/auth.types';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, userType } = req.body as RegisterRequest;

    // Validation
    if (!email || !password || !firstName || !lastName || !phone || !userType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const user = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      userType: userType as 'patient' | 'doctor',
    });

    res.status(201).json({
      success: true,
      data: user,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Registration error', { error });
    next(error);
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, totpCode } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const loginResponse = await AuthService.login({
      email,
      password,
      totpCode,
    });

    res.status(200).json({
      success: true,
      data: loginResponse,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    const message = error instanceof Error ? error.message : 'Login failed';

    if (message.includes('Invalid email or password')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as RefreshTokenRequest;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const accessToken = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Token refresh error', { error });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }
});

// Setup MFA endpoint (requires auth)
router.post('/mfa/setup', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { secret, qrCode } = await AuthService.setupMFA(userId);

    res.status(200).json({
      success: true,
      data: { secret, qrCode },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('MFA setup error', { error });
    next(error);
  }
});

// Verify MFA endpoint (requires auth)
router.post('/mfa/verify', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { totpCode, secret } = req.body as VerifyMFARequest & { secret: string };

    if (!totpCode || !secret) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'TOTP code and secret are required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    await AuthService.verifyMFASetup(userId, totpCode, secret);

    res.status(200).json({
      success: true,
      data: { message: 'MFA enabled successfully' },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('MFA verification error', { error });
    const message = error instanceof Error ? error.message : 'MFA verification failed';

    if (message.includes('Invalid MFA code')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MFA_CODE',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Disable MFA endpoint (requires auth)
router.post('/mfa/disable', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { password } = req.body as { password: string };

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    await AuthService.disableMFA(userId, password);

    res.status(200).json({
      success: true,
      data: { message: 'MFA disabled successfully' },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('MFA disable error', { error });
    const message = error instanceof Error ? error.message : 'MFA disable failed';

    if (message.includes('Invalid password')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

export default router;
