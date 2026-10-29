import { Request, Response } from 'express';
import { User } from '../models/user.model.js';
import { hashPassword, comparePassword, generateToken, validatePasswordStrength } from '../utils/auth.js';
import { getDbStatus } from '../config/db.js';
import { config } from '../config/env.js';
import { Role } from '../types/index.js';

const COOKIE_NAME = 'cb_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, password, role, preferredLanguage, phoneNumber, institutionName } = req.body;

  // 1. Validate required fields
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Full name is required and must be at least 2 characters long.',
      },
    });
    return;
  }

  if (!email || typeof email !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A valid email address is required.',
      },
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email format is invalid.',
      },
    });
    return;
  }

  // 2. Validate role
  const validRoles: Role[] = ['STUDENT', 'EMPLOYER', 'COLLEGE'];
  if (!role || !validRoles.includes(role as Role)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: `Account role must be one of: ${validRoles.join(', ')}.`,
      },
    });
    return;
  }

  // 3. Validate password strength
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: passwordCheck.message || 'Password does not meet complexity requirements.',
      },
    });
    return;
  }

  // 4. Verify Database connectivity before performing database operations
  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently offline. Cannot create new user accounts.',
      },
    });
    return;
  }

  try {
    // 5. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists. Please log in instead.',
        },
      });
      return;
    }

    // 6. Hash password
    const passwordHash = await hashPassword(password);

    // 7. Assemble role-specific initial profile
    const userRole = role as Role;
    const initialStudentProfile = userRole === 'STUDENT' ? {
      collegeName: typeof institutionName === 'string' ? institutionName.trim() : undefined,
      skills: [],
      careerInterests: [],
      preferredWorkLocation: [],
      profileCompletionScore: 0,
    } : undefined;

    const initialEmployerProfile = userRole === 'EMPLOYER' ? {
      organizationName: typeof institutionName === 'string' ? institutionName.trim() : undefined,
      hiringInterests: [],
    } : undefined;

    const initialCollegeProfile = userRole === 'COLLEGE' ? {
      institutionName: typeof institutionName === 'string' ? institutionName.trim() : undefined,
    } : undefined;

    const newUser = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage.trim() : 'en',
      phoneNumber: typeof phoneNumber === 'string' && phoneNumber.trim() ? phoneNumber.trim() : undefined,
      studentProfile: initialStudentProfile,
      employerProfile: initialEmployerProfile,
      collegeProfile: initialCollegeProfile,
    });

    if (userRole === 'STUDENT') {
      newUser.studentProfile!.profileCompletionScore = newUser.calculateStudentScore();
    }

    await newUser.save();

    // 8. Generate JWT & Set HttpOnly cookie
    const token = generateToken({
      sub: String(newUser._id),
      email: newUser.email,
      role: newUser.role,
    });

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    res.status(201).json({
      success: true,
      data: {
        user: newUser.toSafeObject(),
        token,
      },
    });
  } catch (error: unknown) {
    // Catch MongoDB duplicate key error (code 11000) if race condition occurs
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email address already exists. Please log in instead.',
        },
      });
      return;
    }

    console.error('[Registration Error] Persistence failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'PERSISTENCE_ERROR',
        message: 'Failed to persist user registration to database. Please check database connectivity.',
      },
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently offline. Cannot verify user credentials.',
      },
    });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      // Avoid revealing whether account exists
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This account has been deactivated. Please contact support.',
        },
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
      return;
    }

    const token = generateToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    console.error('[Login Error] Database query error:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database communication failed during authentication. Please try again.',
      },
    });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
    return;
  }

  const dbStatus = getDbStatus();
  if (dbStatus.status !== 'connected') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is currently offline. Cannot load user profile.',
      },
    });
    return;
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Authenticated user profile not found.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('[GetMe Error] Query failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to retrieve user profile from database.',
      },
    });
  }
};
