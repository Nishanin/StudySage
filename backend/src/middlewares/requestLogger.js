const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  // Log request details
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log response when finished
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '🔴' : 
                       statusCode >= 400 ? '🟡' : 
                       statusCode >= 300 ? '🔵' : '🟢';
    
    console.log(`[${timestamp}] ${statusColor} ${method} ${url} - ${statusCode}`);
  });

  next();
};

module.exports = requestLogger;
