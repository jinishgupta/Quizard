import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config, validateConfig } from './config/env.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import authRoutes from './routes/auth.js';
import creditsRoutes from './routes/credits.js';
import gameRoutes from './routes/game.js';
import usersRoutes from './routes/users.js';
import leagueRoutes from './routes/league.js';
import aiRoutes from './routes/ai.js';
import challengeRoutes from './routes/challenge.js';
import telemetryRoutes from './routes/telemetry.js';
import adminRoutes from './routes/admin.js';
import leagueResetScheduler from './services/LeagueResetScheduler.js';
import weeklyDigestScheduler from './services/WeeklyDigestScheduler.js';
import challengeService from './services/ChallengeService.js';
import orangeAuthService from './services/OrangeAuthService.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://127.0.0.1:5173',
      'https://quizard-gljo.onrender.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (logs all requests)
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/league', leagueRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/admin', adminRoutes);

// Error logging middleware (must be after routes)
app.use(errorLogger);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Trivia Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ready: '/ready',
      auth: '/api/auth',
      credits: '/api/credits',
      game: '/api/game',
      users: '/api/users',
      league: '/api/league',
      ai: '/api/ai',
      challenge: '/api/challenge',
      telemetry: '/api/telemetry',
      admin: '/api/admin',
    },
  });
});

// WebSocket event handlers for real-time challenges
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      if (!token) {
        socket.emit('challenge:error', {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token required',
        });
        return;
      }

      // Verify token
      const orangeUser = await orangeAuthService.verifyToken(token);
      
      // Store user ID with socket
      socket.userId = orangeUser.id;
      
      // Register socket with challenge service
      challengeService.registerSocket(orangeUser.id, socket.id);
      
      socket.emit('authenticated', {
        success: true,
        userId: orangeUser.id,
      });
    } catch (error) {
      socket.emit('challenge:error', {
        code: 'AUTH_FAILED',
        message: 'Authentication failed',
      });
    }
  });

  // Handle challenge creation
  socket.on('challenge:create', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('challenge:error', {
          code: 'AUTH_REQUIRED',
          message: 'Please authenticate first',
        });
        return;
      }

      const { opponentId, categoryId, difficulty, token } = data;

      // Create challenge (charges CREDITS_SEND_CHALLENGE)
      const challenge = await challengeService.createChallenge(
        socket.userId,
        opponentId,
        categoryId,
        difficulty,
        token
      );

      // Challenger joins the socket room immediately
      socket.join(`challenge:${challenge.challengeId}`);

      // Emit to challenger
      socket.emit('challenge:created', challenge);

      // Notify opponent if they're connected
      const opponentSocketId = challengeService.getUserSocket(opponentId);
      if (opponentSocketId) {
        io.to(opponentSocketId).emit('challenge:received', {
          challengeId: challenge.challengeId,
          challenger: {
            id: socket.userId,
          },
          category: challenge.categoryId,
          difficulty: challenge.difficulty,
        });
      }
    } catch (error) {
      socket.emit('challenge:error', {
        code: 'CREATE_FAILED',
        message: error.message,
      });
    }
  });

  // Handle challenge join
  socket.on('challenge:join', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('challenge:error', {
          code: 'AUTH_REQUIRED',
          message: 'Please authenticate first',
        });
        return;
      }

      const { challengeId } = data;

      // Join challenge
      const result = await challengeService.joinChallenge(challengeId, socket.userId);

      // Join socket room for this challenge
      socket.join(`challenge:${challengeId}`);

      // Emit to both players that challenge has started
      io.to(`challenge:${challengeId}`).emit('challenge:started', {
        challengeId: result.challengeId,
        totalQuestions: result.totalQuestions,
      });

      // Send first question to both players
      io.to(`challenge:${challengeId}`).emit('challenge:question', {
        challengeId: result.challengeId,
        question: result.firstQuestion,
      });
    } catch (error) {
      socket.emit('challenge:error', {
        code: 'JOIN_FAILED',
        message: error.message,
      });
    }
  });

  // Handle answer submission
  socket.on('challenge:answer', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('challenge:error', {
          code: 'AUTH_REQUIRED',
          message: 'Please authenticate first',
        });
        return;
      }

      const { challengeId, questionIndex, answer, timeSpent } = data;

      // Submit answer
      const result = await challengeService.submitAnswer(
        challengeId,
        socket.userId,
        questionIndex,
        answer,
        timeSpent
      );

      // Emit result to the player who answered
      socket.emit('challenge:answer_result', {
        ...result,
        challengeId,
      });

      // Broadcast to opponent that this player answered
      socket.to(`challenge:${challengeId}`).emit('challenge:opponent_answer', {
        challengeId,
        questionIndex,
        answered: true,
      });

      // Check if this was the last question
      if (questionIndex + 1 >= result.totalQuestions) {
        // Check if both players have finished
        const challengeData = challengeService.activeChallenges.get(challengeId);
        if (
          challengeData &&
          challengeData.challengerAnswers.length === result.totalQuestions &&
          challengeData.opponentAnswers.length === result.totalQuestions
        ) {
          // End challenge
          const finalResult = await challengeService.endChallenge(challengeId);

          // Emit results to both players
          io.to(`challenge:${challengeId}`).emit('challenge:result', finalResult);
        }
      } else {
        // Send next question
        const nextQuestion = challengeService.getNextQuestion(challengeId, questionIndex);
        if (nextQuestion) {
          io.to(`challenge:${challengeId}`).emit('challenge:question', {
            challengeId,
            question: nextQuestion,
          });
        }
      }
    } catch (error) {
      socket.emit('challenge:error', {
        code: 'ANSWER_FAILED',
        message: error.message,
      });
    }
  });

  // Handle leaving a challenge
  socket.on('challenge:leave', async (data) => {
    try {
      if (!socket.userId) return;

      const { challengeId } = data;

      // Leave socket room
      socket.leave(`challenge:${challengeId}`);

      // Notify opponent
      socket.to(`challenge:${challengeId}`).emit('challenge:opponent_left', {
        challengeId,
      });
    } catch (error) {
      console.error('Error leaving challenge:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

    if (socket.userId) {
      // Handle challenge disconnection
      await challengeService.handleDisconnection(socket.userId);

      // Unregister socket
      challengeService.unregisterSocket(socket.id);
    }
  });
});

// Start server
function startServer() {
  try {
    console.log('\n========================================');
    console.log('🚀 STARTING QUIZARD BACKEND SERVER');
    console.log('========================================');
    
    validateConfig();
    
    console.log('\n📋 Configuration:');
    console.log('  - Environment:', config.server.nodeEnv);
    console.log('  - Host:', config.server.host);
    console.log('  - Port:', config.server.port);
    console.log('  - Database:', config.database.url ? 'Connected' : 'Not configured');
    console.log('  - Bedrock Tenant ID:', config.bedrock.tenantId);
    console.log('  - Bedrock Base URL:', config.bedrock.baseUrl);
    console.log('  - Orange Game Pass API:', config.orange.gamePassApiUrl);
    console.log('  - Gemini API Key:', config.gemini.apiKey ? 'Present' : 'Missing');
    
    httpServer.listen(config.server.port, config.server.host, () => {
      console.log('\n✅ Server running on http://' + config.server.host + ':' + config.server.port);
      console.log('✅ Environment:', config.server.nodeEnv);
      console.log('\n📡 Available endpoints:');
      console.log('  - GET  /health');
      console.log('  - GET  /ready');
      console.log('  - POST /api/auth/*');
      console.log('  - GET  /api/users/*');
      console.log('  - GET  /api/credits/*');
      console.log('  - POST /api/game/*');
      console.log('  - GET  /api/league/*');
      console.log('  - POST /api/challenge/*');
      console.log('  - POST /api/ai/*');
      console.log('\n========================================');
      console.log('✅ SERVER READY - Waiting for requests...');
      console.log('========================================\n');
      
      // Start league reset scheduler (Sunday 00:00 UTC)
      leagueResetScheduler.start();
      
      // Start weekly digest scheduler (Monday 01:00 UTC)
      weeklyDigestScheduler.start();
    });
  } catch (error) {
    console.error('\n❌ FAILED TO START SERVER:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  leagueResetScheduler.stop();
  weeklyDigestScheduler.stop();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  leagueResetScheduler.stop();
  weeklyDigestScheduler.stop();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

startServer();

export { app, io };