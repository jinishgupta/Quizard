/**
 * Request logging middleware
 * Logs all incoming requests and responses
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log incoming request
  console.log('\n' + '='.repeat(60));
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  console.log('Time:', new Date().toISOString());
  console.log('IP:', req.ip);
  console.log('User-Agent:', req.get('user-agent'));
  
  if (req.headers.authorization) {
    const token = req.headers.authorization.substring(7, 27);
    console.log('Auth Token (first 20 chars):', token + '...');
  } else {
    console.log('Auth Token: None');
  }
  
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log('Query:', JSON.stringify(req.query, null, 2));
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`📤 Response: ${res.statusCode} (${duration}ms)`);
    
    if (res.statusCode >= 400) {
      console.log('❌ Error Response:', data);
    } else {
      console.log('✅ Success');
    }
    
    console.log('='.repeat(60) + '\n');
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Error logging middleware
 * Logs all unhandled errors
 */
export function errorLogger(err, req, res, next) {
  console.error('\n' + '!'.repeat(60));
  console.error('💥 UNHANDLED ERROR');
  console.error('!'.repeat(60));
  console.error('Request:', req.method, req.originalUrl);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('!'.repeat(60) + '\n');
  
  res.status(500).json({
    error: {
      code: 'SERVER_INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: err.message,
      timestamp: new Date().toISOString(),
    },
  });
}
