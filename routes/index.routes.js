const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant.model"); // Adjust the path accordingly

// Render the index.hbs template
router.get("/", async (req, res) => {
  try {
    // Fetch restaurants from MongoDB
    const restaurants = await Restaurant.find();

    // Render the index template with the fetched data
    res.render("index", {
      restaurants,
      userInSession: req.session.currentUser,
    });
  } catch (error) {
    console.error("Error fetching data from MongoDB:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Display individual restaurant page
router.get("/restaurants/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    res.render("restaurantPage", {
      restaurant,
      userInSession: req.session.currentUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
