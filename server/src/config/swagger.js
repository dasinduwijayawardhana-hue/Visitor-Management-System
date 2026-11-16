const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Visitor Management System API',
      version: '1.0.0',
      description:
        'REST API for managing visitor registration, check-in/check-out, employee hosting, departments, reports, authentication, and logging.',
      contact: { name: 'VMS Backend Team' },
    },
    servers: [{ url: env.apiBaseUrl, description: 'Current environment' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Resource not found' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: { field: { type: 'string' }, message: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registration, login, logout, token refresh' },
      { name: 'Users', description: 'Admin user management' },
      { name: 'Departments', description: 'Department management' },
      { name: 'Employees', description: 'Employee management' },
      { name: 'Visitors', description: 'Visitor registration and directory' },
      { name: 'Visits', description: 'Check-in / check-out and visit records' },
      { name: 'Reports', description: 'Daily/monthly/current-visitor reports' },
    ],
  },
  // Scans route files for JSDoc @swagger/@openapi comment blocks.
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
