const express = require("express");
const router = express.Router();

const Restaurant = require("../models/Restaurant.model.js");
const Order = require("../models/Order.model.js");
const Customer = require("../models/Customer.model.js");

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

router.post("/updateCart", (req, res) => {
  const { cartItems } = req.body;

  // Save the cartItems in the session
  req.session.cartItems = cartItems;

  res.json({ message: "Cart updated successfully" });
});

router.post("/checkout", async (req, res) => {
  try {
    const { name, email, street, restaurantName, total } = req.body;

    // Retrieve cartItems from the session
    const cartItems = req.session.cartItems || [];

    // Create a new order with the restaurantName
    const order = new Order({
      name,
      email,
      address: street,
      restaurantName,
      dish: cartItems,
      total,
    });

    // Save the order to the Order model
    await order.save();

    // Find the currently logged-in customer
    const customerId = req.session.currentUser._id;
    const customer = await Customer.findById(customerId);

    // Add only the restaurantName to the customer's order array
    customer.order.push({
      name: restaurantName,
      dish: cartItems,
      total: total,
    });

    // Save the updated customer document
    await customer.save();

    // Clear the cartItems from the session after the order is placed
    req.session.cartItems = [];

    res.render("checkoutConfirmation", { order });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
