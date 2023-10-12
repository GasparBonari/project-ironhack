const { Router } = require("express");
const router = new Router();
const Manager = require("../models/Manager.models.js");
const Restaurant = require("../models/Restaurant.model.js");

const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const saltRounds = 10;

// middleware
const {
  isManagerAndLoggedIn,
  managerLoggedin,
  managerLoggedout,
} = require("../middleware/route-guard.js");

// GET /manager/login
router.get("/managerLogin", managerLoggedout, (req, res) => {
  res.render("Manager/managerLogin");
});

// POST /manager/login
router.post("/ManagerLogin", (req, res, next) => {
  console.log("here it was hit");
  console.log("SESSION =====> ", req.session);

  const { username, password } = req.body;

  // Check that username and password are provided
  if (username === "" || password === "") {
    res.render("Manager/managerLogin", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });
    return;
  }

  // Search the database for a user with the username submitted in the form
  Manager.findOne({ username })
    .then((manager) => {
      if (!manager) {
        console.log("Login failed, account not registered. ");
        return res.render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (bcryptjs.compareSync(password, manager.passwordHash)) {
        //******* SAVE THE USER IN THE SESSION ********//
        req.session.currentUser = manager;
        console.log("Session data after login:", req.session);
        res.redirect("/manager/managerMain");
      } else {
        console.log("Incorrect password. ");
        res.render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      }
    })
    .catch((error) => {
      if (error) {
        res.render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (error.code === 11000) {
        console.log(
          "User not found and/or incorrect password, please try again! "
        );

        res.status(500).render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else {
        console.log("next");
        next(error);
      }
    }); // close .catch()
});

// GET route ==> to display the signup form to Manager
router.get("/managerCreate", managerLoggedout, (req, res) =>
  res.render("manager/managerCreate.hbs")
);

// POST route ==> to process form data
router.post("/managerCreate", (req, res, next) => {
  console.log("The form data: ", req.body);

  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password) {
    res.render("Manager/managerCreate", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email and password.",
    });
    return;
  } else if (password !== password2) {
    res.render("Manager/managerCreate", {
      errorMessage: "You have provided wrong password. Please, try again.",
    });
    return;
  }

  // make sure passwords are strong:
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("Manager/managerCreate", {
      errorMessage:
        "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      console.log("here");
      return Manager.create({
        username,
        email,
        passwordHash: hashedPassword,
      });
    })
    .then((userFromDB) => {
      userFromDB.save();
      console.log("Newly created user is: ", userFromDB);
      res.redirect(`/manager/managerNew/${userFromDB.username}`);
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res
          .status(500)
          .render("Manager/managerCreate", { errorMessage: error.message });
      } else if (error.code === 11000) {
        console.log(
          " Username and email need to be unique. Either username or email is already used. "
        );

        res.status(500).render("Manager/managerCreate", {
          errorMessage: "User not found and/or incorrect password.",
        });
      } else {
        next(error);
      }
    });
});

router.get("/ManagerMain", isManagerAndLoggedIn, (req, res) => {
  res.render("Manager/managerMain", {
    userInSession: req.session.currentUser,
  });
});

// GET route for managerNew
router.get("/managerNew/:username", (req, res) => {
  const { username } = req.params;
  res.render("Manager/managerNew", { username });
});

router.post("/managerLogout", managerLoggedin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.render("manager/managerLogin");
  });
});

module.exports = router;
