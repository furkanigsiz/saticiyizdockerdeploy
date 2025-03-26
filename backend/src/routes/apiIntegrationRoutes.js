   // Example: backend/src/routes/apiIntegrationRoutes.js
   const express = require('express');
   const router = express.Router();
   const { ApiIntegration } = require('../models');
   const authenticateToken = require('../middleware/authenticateToken');

   router.get('/credentials', authenticateToken, async (req, res) => {
       try {
           const credentials = await ApiIntegration.findOne({
               where: { user_id: req.user.id }
           });

           if (!credentials) {
               return res.status(404).json({ error: 'API credentials not found' });
           }

           console.log('Authorization Header:', `Basic ${credentials}`);
           console.log('User-Agent Header:', userAgent);

           res.json(credentials);
       } catch (error) {
           res.status(500).json({ error: 'Error fetching API credentials' });
       }
   });

   module.exports = router;