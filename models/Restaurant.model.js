const { Schema, model } = require("mongoose");

const restaurantSchema = new Schema({
  name: String,
  image: String,
  address: String,
  menu: [
    {
      name: String,
      price: Number,
      image: String,
    }
  ],
});

const Restaurant = model("Restaurant", restaurantSchema);

module.exports = Restaurant;
