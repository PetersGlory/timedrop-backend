const winston = require('winston');
const { format } = winston;

class LoggerService {
  constructor() {
    const logFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}] : ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
      }
      return msg;
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
        format.colorize(),
        logFormat
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      ]
    });
  }

  // Log API request
  logApiRequest(req, startTime) {
    const duration = Date.now() - startTime;
    this.logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.id,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent')
    });
  }

  // Log API response
  logApiResponse(req, res, startTime) {
    const duration = Date.now() - startTime;
    this.logger.info('API Response', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  }

  // Log API error
  logApiError(req, error, startTime) {
    const duration = Date.now() - startTime;
    this.logger.error('API Error', {
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      duration: `${duration}ms`
    });
  }

  // Log database query
  logDbQuery(query, duration) {
    this.logger.debug('Database Query', {
      query: query.sql,
      parameters: query.bindings,
      duration: `${duration}ms`
    });
  }

  // Log database error
  logDbError(error, query) {
    this.logger.error('Database Error', {
      error: error.message,
      query: query?.sql,
      parameters: query?.bindings,
      stack: error.stack
    });
  }

  // Log authentication events
  logAuth(event, userId, success, details = {}) {
    const level = success ? 'info' : 'warn';
    this.logger.log(level, 'Authentication Event', {
      event,
      userId,
      success,
      ...details
    });
  }

  // Log shipment events
  logShipment(event, shipmentId, userId, details = {}) {
    this.logger.info('Shipment Event', {
      event,
      shipmentId,
      userId,
      ...details
    });
  }

  // Log notification events
  logNotification(event, userId, success, details = {}) {
    const level = success ? 'info' : 'warn';
    this.logger.log(level, 'Notification Event', {
      event,
      userId,
      success,
      ...details
    });
  }

  // Log system events
  logSystem(event, details = {}) {
    this.logger.info('System Event', {
      event,
      ...details
    });
  }

  // Log security events
  logSecurity(event, severity = 'warn', details = {}) {
    this.logger.log(severity, 'Security Event', {
      event,
      ...details
    });
  }
}

module.exports = new LoggerService();