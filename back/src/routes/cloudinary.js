// file: routes/cloudinary.js

import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';



const router = Router();
// Configure Cloudinary (you can also do this in a central config file)
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// The signature endpoint we created
router.get('/sign-upload', (req, res) => {
    try {
        const timestamp = Math.round((new Date).getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            { timestamp: timestamp },
            process.env.CLOUDINARY_API_SECRET
        );
        res.status(200).json({ 
            signature, 
            timestamp, 
            apiKey: process.env.CLOUDINARY_API_KEY 
        });
    } catch (error) {
        logger.error("Error signing upload:", error);
        res.status(500).json({ message: "Could not sign upload request." });
    }
});

export default router;