const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant.model'); // Adjust the path accordingly

// Define a route to render the index.hbs template
router.get('/', async (req, res) => {
  try {
    // Fetch restaurants from MongoDB
    const restaurants = await Restaurant.find();

    // Render the index template with the fetched data
    res.render('index', { restaurants });
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
