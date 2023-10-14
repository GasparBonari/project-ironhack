const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant.model");
const jsonData = require("./restaurantsData");

// Use the existing connection from db/index.js
const db = mongoose.connection;
/*
// Save JSON data to the database
async function saveDataToDatabase() {
  try {
    // Clear existing data (optional)
    await Restaurant.deleteMany();

    // Insert new data
    await Restaurant.insertMany(jsonData);

    console.log("Data saved to the database!");
  } catch (error) {
    console.error("Error saving data to the database:", error.message);
  }
}

// Wait for the existing connection to be established
db.once("open", () => {
  console.log("Connected to Mongo!");
  saveDataToDatabase();
});
*/
