// backend/src/routes/queryRoutes.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { sendQueryEmail } from '../utils/mailer.js';
import { sendContactEmail } from '../utils/mailer.js';

const router = express.Router();

// Validation middleware
const validateQuery = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim(),
  body('userType').isIn(['agent', 'traveler']).withMessage('Invalid user type'),
  body('queryType').isIn(['new_booking', 'cancellation', 'reschedule', 'refund', 'other']).withMessage('Invalid query type'),
  body('pnr').optional().trim(),
  body('message').trim().notEmpty().withMessage('Message is required')
];

// In your QueryRoutes.js
router.post('/query', validateQuery, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Send email using the mailer utility
    const result = await sendQueryEmail(req.body);
    console.log('Email sent successfully:', result);

    res.status(200).json({ 
      success: true, 
      message: 'Your query has been submitted successfully!',
      data: result
    });

  } catch (error) {
    console.error('Error in query route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to process your query. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Contact form validation
const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim(),
  body('interest').trim().notEmpty().withMessage('Please select an area of interest'),
  body('message').trim().notEmpty().withMessage('Message is required')
];

// Contact form submission
router.post('/contact', validateContact, async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    // Send contact email
    const result = await sendContactEmail(req.body);
    console.log('Contact email sent successfully:', result);

    res.status(200).json({ 
      success: true, 
      message: 'Your message has been sent successfully! We will get back to you soon.',
      data: result
    });

  } catch (error) {
    console.error('Error in contact route:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to send your message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;