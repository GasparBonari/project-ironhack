const { Schema, model } = require("mongoose");

const customerSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      // this match will disqualify all the emails with accidental empty spaces, missing dots in front of (.)com and the ones with no domain at all
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    greet: {
      type: String,
      required: true,
      default: "Hallo 💖",
    },
    role: {
      type: String,
      required: true,
      default: "customer",
    },
    fullname: {
      type: String,
      //required: true,
    },
    street: {
      type: String,
      //required: true,
    },
    housenumber: {
      type: String,
      //required: true,
    },
    postcode: {
      type: Number,
      //required: true,
    },
    city: {
      type: String,
      //required: true,
    },
    country: {
      type: String,
      //required: true,
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Customer = model("Customer", customerSchema);

module.exports = Customer;
