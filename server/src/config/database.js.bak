const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');
const env = require('./env');

// A single shared Prisma instance avoids exhausting MySQL connections
// (each PrismaClient() opens its own pool).
const prisma = new PrismaClient({
  log:
    env.nodeEnv === 'development'
      ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }]
      : [{ emit: 'event', level: 'error' }],
});

prisma.$on('error', (e) => logger.error(`Prisma error: ${e.message}`));

if (env.nodeEnv === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
  });
}

module.exports = prisma;
