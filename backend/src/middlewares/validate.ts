import { Request, Response, NextFunction } from 'express';

export interface FieldValidationRule {
  field: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'objectId' | 'date';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  pattern?: RegExp;
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates a value against a single FieldValidationRule.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateRule(val: any, rule: FieldValidationRule): string | null {
  if (val === undefined || val === null || val === '') {
    if (rule.required) {
      return `${rule.field} is required.`;
    }
    return null;
  }

  if (rule.type === 'objectId') {
    if (typeof val !== 'string' || !OBJECT_ID_REGEX.test(val)) {
      return `${rule.field} must be a valid 24-character hexadecimal ObjectId.`;
    }
  }

  if (rule.type === 'string') {
    if (typeof val !== 'string') {
      return `${rule.field} must be a string.`;
    }
    if (rule.minLength !== undefined && val.length < rule.minLength) {
      return `${rule.field} must be at least ${rule.minLength} characters.`;
    }
    if (rule.maxLength !== undefined && val.length > rule.maxLength) {
      return `${rule.field} cannot exceed ${rule.maxLength} characters.`;
    }
    if (rule.pattern && !rule.pattern.test(val)) {
      return `${rule.field} is not in a valid format.`;
    }
  }

  if (rule.type === 'number') {
    const num = Number(val);
    if (isNaN(num)) {
      return `${rule.field} must be a valid number.`;
    }
    if (rule.min !== undefined && num < rule.min) {
      return `${rule.field} must be at least ${rule.min}.`;
    }
    if (rule.max !== undefined && num > rule.max) {
      return `${rule.field} cannot exceed ${rule.max}.`;
    }
  }

  if (rule.type === 'array') {
    if (!Array.isArray(val)) {
      return `${rule.field} must be an array.`;
    }
    if (rule.minLength !== undefined && val.length < rule.minLength) {
      return `${rule.field} must contain at least ${rule.minLength} items.`;
    }
    if (rule.maxLength !== undefined && val.length > rule.maxLength) {
      return `${rule.field} cannot contain more than ${rule.maxLength} items.`;
    }
  }

  if (rule.type === 'date') {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return `${rule.field} must be a valid date.`;
    }
  }

  if (rule.enum && !rule.enum.includes(val)) {
    return `${rule.field} must be one of: ${rule.enum.join(', ')}.`;
  }

  return null;
}

/**
 * Creates an Express validation middleware for body, query, and params rules.
 */
export function validateRequest(rules: {
  body?: FieldValidationRule[];
  query?: FieldValidationRule[];
  params?: FieldValidationRule[];
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    if (rules.params && req.params) {
      for (const rule of rules.params) {
        const err = validateRule(req.params[rule.field], rule);
        if (err) errors.push(err);
      }
    }

    if (rules.query && req.query) {
      for (const rule of rules.query) {
        const err = validateRule(req.query[rule.field], rule);
        if (err) errors.push(err);
      }
    }

    if (rules.body && req.body) {
      for (const rule of rules.body) {
        const err = validateRule(req.body[rule.field], rule);
        if (err) errors.push(err);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request input.',
          details: errors,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Common pagination validator middleware.
 * Ensures page >= 1 and limit is clamped between 1 and 100.
 */
export const validatePagination = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query.page) {
    const page = parseInt(req.query.page as string, 10);
    req.query.page = isNaN(page) || page < 1 ? '1' : page.toString();
  }

  if (req.query.limit) {
    const limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) {
      req.query.limit = '10';
    } else if (limit > 100) {
      req.query.limit = '100';
    } else {
      req.query.limit = limit.toString();
    }
  }

  next();
};
