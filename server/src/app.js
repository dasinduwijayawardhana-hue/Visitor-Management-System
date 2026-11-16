const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const requestLogger = require('./middleware/requestLogger.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const routes = require('./routes');

const app = express();

// --- Security & parsing middleware -------------------------------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})); // sets safe HTTP headers with cross-origin resource policy allowed for static assets
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Static files (profile image uploads) --------------------------------
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

// --- Logging -------------------------------------------------------------
app.use(requestLogger);

// --- Rate limiting (global) ----------------------------------------------
app.use('/api', apiLimiter);

// --- Health check ----------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'VMS API is healthy', timestamp: new Date().toISOString() });
});

// --- API docs --------------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'VMS API Docs' }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// --- API routes --------------------------------------------------------------
app.use('/api', routes);

// --- 404 + centralized error handling ----------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
