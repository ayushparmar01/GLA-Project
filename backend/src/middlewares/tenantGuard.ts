import { Request, Response, NextFunction } from 'express';

/**
 * Enforces student tenant isolation.
 * Verifies that the authenticated user is a STUDENT and that requested resource IDs
 * (e.g. req.params.studentId or req.query.studentId) match their own user ID.
 * ADMINs are permitted to bypass student boundary checks.
 */
export const ensureStudentTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Student access required for this operation.',
      },
    });
    return;
  }

  const requestedStudentId = req.params.studentId || req.query.studentId || req.body?.studentId;
  const currentUserId = req.user.userId || req.user.sub;

  if (requestedStudentId && requestedStudentId !== currentUserId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Access denied: You cannot access or modify another student\'s records.',
      },
    });
    return;
  }

  next();
};

/**
 * Enforces college tenant isolation.
 * Verifies that the authenticated user is a COLLEGE coordinator and matches requested collegeId.
 */
export const ensureCollegeTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'COLLEGE') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'College institution access required for this operation.',
      },
    });
    return;
  }

  const requestedCollegeId = req.params.collegeId || req.query.collegeId || req.body?.collegeId;
  const currentUserId = req.user.userId || req.user.sub;

  if (requestedCollegeId && requestedCollegeId !== currentUserId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Access denied: You cannot access or modify another college institution\'s records.',
      },
    });
    return;
  }

  next();
};

/**
 * Enforces employer tenant isolation.
 * Verifies that the authenticated user is an EMPLOYER and matches requested employerId.
 */
export const ensureEmployerTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'EMPLOYER') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Employer organization access required for this operation.',
      },
    });
    return;
  }

  const requestedEmployerId = req.params.employerId || req.query.employerId || req.body?.employerId;
  const currentUserId = req.user.userId || req.user.sub;

  if (requestedEmployerId && requestedEmployerId !== currentUserId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Access denied: You cannot access or modify another employer\'s job or candidate records.',
      },
    });
    return;
  }

  next();
};

/**
 * Generic IDOR prevention helper.
 * Validates that the resource owner identifier specified in req.params[paramKey]
 * matches the authenticated user's ID, unless the user has the ADMIN role.
 */
export const preventIdor = (paramKey: string, allowedRoles: string[] = ['ADMIN']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    const currentUserId = req.user.userId || req.user.sub;
    const targetId = req.params[paramKey] || req.query[paramKey];

    if (targetId && targetId !== currentUserId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'IDOR_ACCESS_DENIED',
          message: 'Access denied: You are not authorized to access or modify this specific resource.',
        },
      });
      return;
    }

    next();
  };
};
