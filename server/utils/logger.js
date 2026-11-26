import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'http' : process.env.NODE_ENV === 'test' ? 'error' : 'debug');

// Console only: hosts like Render/Railway capture stdout, and their disks are ephemeral.
const logger = winston.createLogger({
  level,
  format: combine(
    // ANSI colours only locally; hosted log viewers show them as garbage.
    ...(process.env.NODE_ENV === 'production' ? [] : [colorize()]),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level: lvl, message, timestamp: ts, stack }) => `${ts} [${lvl}]: ${stack || message}`)
  ),
  transports: [new winston.transports.Console()],
});

/** Stream adapter so morgan's HTTP access logs go through winston. */
export const httpLogStream = {
  write: (line) => logger.http(line.trim()),
};

export default logger;
