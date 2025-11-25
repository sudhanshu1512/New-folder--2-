import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors from express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Validation rules for updating a user profile
export const validateProfileUpdate = [
  // Personal details
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters.'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters.'),

  body('email')
    .isEmail().withMessage('A valid email address is required.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone('any', { strictMode: false }).withMessage('Invalid phone number format.'),

  // Company details
  body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Invalid website URL.'),

  body('panNo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 10 }).withMessage('PAN number must be 10 characters long.')
    .isAlphanumeric().withMessage('PAN number must be alphanumeric.'),

  body('gstNo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 15, max: 15 }).withMessage('GST number must be 15 characters long.')
    .isAlphanumeric().withMessage('GST number must be alphanumeric.'),

  // Address details
  body('pincode')
    .optional({ checkFalsy: true })
    .trim()
    .isPostalCode('IN').withMessage('Invalid Indian pincode.'),

  // This must be the last middleware in the chain to catch any errors
  handleValidationErrors
];
