import { body, param, query, validationResult } from 'express-validator';

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Auth validation rules
export const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors
];

// User validation rules
export const validateCreateUser = [
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'student'])
    .withMessage('Role must be either admin or student'),
  handleValidationErrors
];

export const validateUsername = [
  param('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid username format'),
  handleValidationErrors
];

// Video validation rules
export const validateCreateVideo = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('folder')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder must be between 1 and 100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
];

export const validateUpdateVideo = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('folder')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder must be between 1 and 100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL must be a valid URL'),
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  handleValidationErrors
];

export const validateVideoId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Video ID must be a positive integer'),
  handleValidationErrors
];

// Progress validation rules
export const validateProgressUpdate = [
  body('video_id')
    .isInt({ min: 1 })
    .withMessage('Video ID must be a positive integer'),
  body('completed')
    .isBoolean()
    .withMessage('Completed must be a boolean value'),
  handleValidationErrors
];

export const validateBulkProgressUpdate = [
  body('updates')
    .isArray({ min: 1, max: 50 })
    .withMessage('Updates must be an array with 1-50 items'),
  body('updates.*.video_id')
    .isInt({ min: 1 })
    .withMessage('Each video_id must be a positive integer'),
  body('updates.*.completed')
    .isBoolean()
    .withMessage('Each completed must be a boolean value'),
  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export const validateFolderFilter = [
  query('folder')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder filter must be between 1 and 100 characters'),
  handleValidationErrors
];

export const validateProgressFilters = [
  query('folder')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder filter must be between 1 and 100 characters'),
  query('incompleteOnly')
    .optional()
    .isBoolean()
    .withMessage('incompleteOnly must be a boolean value'),
  query('all')
    .optional()
    .isBoolean()
    .withMessage('all must be a boolean value'),
  handleValidationErrors
];
