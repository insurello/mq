import * as winston from "winston";

export type Logger = winston.Logger;

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || "info",
      format:
        process.env.NODE_ENV === "production"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.prettyPrint(),
              winston.format.simple()
            ),
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
});
