import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Run a list of express-validator chains, then fail with a 400 listing every
 * invalid field. Usage: router.post('/x', validate(rules), controller)
 */
export const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest(errors[0].message, errors));
  },
];
