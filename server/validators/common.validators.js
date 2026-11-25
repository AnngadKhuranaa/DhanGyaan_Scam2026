import { body, param, query } from 'express-validator';
import { HISTORY_RANGE_KEYS } from '../services/marketData.service.js';

const SYMBOL_REGEX = /^[A-Za-z0-9^][A-Za-z0-9.^=&-]{0,19}$/;
const SYMBOL_MESSAGE = 'symbol must be a ticker such as RELIANCE.NS or AAPL';

export const symbolParam = param('symbol')
  .isString()
  .trim()
  .matches(SYMBOL_REGEX)
  .withMessage(SYMBOL_MESSAGE)
  .customSanitizer((s) => s.toUpperCase());

export const symbolBody = body('symbol')
  .exists({ values: 'falsy' })
  .withMessage('symbol is required')
  .bail()
  .isString()
  .trim()
  .matches(SYMBOL_REGEX)
  .withMessage(SYMBOL_MESSAGE)
  .customSanitizer((s) => s.toUpperCase());

export const marketQuery = query('market')
  .optional()
  .isIn(['IN', 'US'])
  .withMessage('market must be IN or US');

export const rangeQuery = query('range')
  .optional()
  .isIn(HISTORY_RANGE_KEYS)
  .withMessage(`range must be one of ${HISTORY_RANGE_KEYS.join(', ')}`);

export const pagination = [
  query('page').optional().isInt({ min: 1, max: 10_000 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];
