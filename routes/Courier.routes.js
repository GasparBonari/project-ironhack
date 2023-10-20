const { Router } = require("express");
const router = new Router();
const Courier = require("../models/Courier.models"); // Import the Courier model
const Order = require("../models/Order.model");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const saltRounds = 10;

// Middleware
const {
  courierLoggedin,
  courierLoggedout,
  isManagerAndLoggedIn,
} = require("../middleware/route-guard.js");

// GET /manager/login
router.get("/courierLogin", courierLoggedout, (req, res) => {
  res.render("Manager/courierLogin");
});

// POST /manager/login
router.post("/courierLogin", (req, res, next) => {
  console.log("here it was hit");
  console.log("SESSION =====> ", req.session);

  const { username, password } = req.body;

  // Check that username and password are provided
  if (username === "" || password === "") {
    return res.render("Manager/courierLogin", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });
  }

  // Search the database for a user with the username submitted in the form
  Courier.findOne({ username })
    .then((courier) => {
      if (!courier) {
        console.log("Login failed, account not registered.");
        return res.render("Manager/courierLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (bcryptjs.compareSync(password, courier.passwordHash)) {
        // Save the user in the session
        req.session.currentUser = courier;
        console.log("Session data after login:", req.session);
        return res.redirect("/manager/courierMain");
      } else {
        console.log("Incorrect password.");
        return res.render("Manager/courierLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      }
    })
    .catch((error) => {
      if (error.code === 11000) {
        console.log(
          "User not found and/or incorrect password, please try again!"
        );
        return res.status(500).render("Manager/courierLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else {
        next(error);
      }
    });
});

// GET route to display the signup form for Courier
router.get("/courierCreate", courierLoggedout, (req, res) => {
  res.render("Manager/courierCreate");
});

// POST route to process form data for Courier registration
router.post("/courierCreate", (req, res, next) => {
  console.log("The form data: ", req.body);

  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password) {
    return res.render("Manager/courierCreate", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email, and password.",
    });
  } else if (password !== password2) {
    return res.render("Manager/courierCreate", {
      errorMessage: "Passwords do not match. Please, try again.",
    });
  }

  // Make sure passwords are strong:
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render("Manager/courierCreate", {
        errorMessage:
          "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.",
      });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return Courier.create({
        username,
        email,
        passwordHash: hashedPassword,
      });
    })
    .then((userFromDB) => {
      console.log("Newly created user is: ", userFromDB);
      return res.redirect(`/manager/courierNew/${userFromDB.username}`);
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        return res
          .status(500)
          .render("Manager/courierCreate", { errorMessage: error.message });
      } else if (error.code === 11000) {
        console.log("Username or email is already in use.");
        return res.status(500).render("Manager/courierCreate", {
          errorMessage: "Username or email is already in use.",
        });
      } else {
        next(error);
      }
    });
});

// GET route to display Courier main page
router.get("/courierMain", courierLoggedin, (req, res) => {
  res.render("Manager/courierMain", {
    userInSession: req.session.currentUser,
  });
});

// GET route for courierNew
router.get("/courierNew/:username", (req, res) => {
  const { username } = req.params;
  res.render("Manager/courierNew", { username });
});

// edit/delete Courier profile:

router.get("/courier/:CourierId/edit", courierLoggedin, (req, res, next) => {
  const { CourierId } = req.params;

  Courier.findById(CourierId)
    .then((CourierToEdit) => {
      Courier.find().then((courier) => {
        res.render("Manager/courierEdit", {
          userInSession: req.session.currentUser,
          managerToEdit: CourierToEdit,
        });
      });
    })
    .catch((error) => next(error));
});

router.post("/courier/:CourierId/edit", courierLoggedin, (req, res, next) => {
  const { CourierId } = req.params;
  const { username, email, birthday, country, city } = req.body;

  Courier.findByIdAndUpdate(
    CourierId,
    {
      username,
      email,
      birthday,
      country,
      city,
    },
    { new: true }
  )
    .then((updatedCourier) => {
      req.session.currentUser = updatedCourier;
      res.redirect(`/manager/courier/${CourierId}/edit`);
    })
    .catch((error) => next(error));
});

router.post(
  "/courierMain/:CourierId/delete",
  courierLoggedin,
  (req, res, next) => {
    const { CourierId } = req.params;
    Courier.findByIdAndDelete(CourierId)
      .then(() => {
        req.session.destroy((err) => {
          if (err) next(err);
          res.render("Manager/courierDeleted");
        });
      })
      .catch((error) => next(error));
  }
);

// POST route to log out a Courier
router.post("/courierLogout", courierLoggedin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    return res.render("Manager/courierLogin");
  });
});

// CRUD Couriers BEGIN

// GET route ==> to display the create form for Courier
router.get("/managerMain/courierCreate", isManagerAndLoggedIn, (req, res) =>
  res.render("manager/courierCreate")
);

// POST route ==> to process form data
router.post("/managerMain/courierCreate", (req, res, next) => {
  // console.log("The form data: ", req.body);
  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password || !password2) {
    res.render("Manager/courierCreate", {
      errorMessage:
        "All fields are mandatory. Please provide name, email and password",
    });
    return;
  }

  return Courier.create({ username, email, password, password2 })
    .then((allCouriers) => {
      //console.log("Response statusCode: ", res.statusCode);
      console.log(allCouriers);
      if (res.statusCode !== 200) {
        res.render("Manager/courierList", {
          couriers: allCouriers,
        });
      } else {
        res.redirect("/manager/managerMain/courierList");
      }
    })
    .catch((error) => {
      console.log("Courier create error: ", error);
      next(error);
    });
});

router.get(
  "/managerMain/courierList",
  isManagerAndLoggedIn,
  (req, res, next) => {
    Courier.find()
      .then((allCouriers) => {
        res.render("Manager/courierList", { couriers: allCouriers });
      })
      .catch((error) => {
        console.log("Couriers error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/courierList/:CourierId/delete",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { CourierId } = req.params;
    Courier.findByIdAndDelete(CourierId)
      .then(() => {
        res.render("Manager/courierDeleted");
      })
      .catch((error) => next(error));
  }
);

router.get(
  "/managerMain/courierList/:CourierId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { CourierId } = req.params;
    Courier.findById(CourierId)
      .then((courierToEdit) => {
        Courier.find().then((couriers) => {
          res.render("Manager/courierEdit", {
            courier: courierToEdit,
            couriers,
          });
        });
      })
      .catch((error) => {
        console.log("Courier error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/courierList/:CourierId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { CourierId } = req.params;
    const { username, email, birthday, country, city } = req.body;
    Courier.findByIdAndUpdate(
      CourierId,
      {
        username,
        email,
        birthday,
        country,
        city,
      },
      { new: true }
    )
      .then((updatedCourier) => {
        res.redirect("/manager/managerMain/courierList/");
      })
      .catch((error) => next(error));
  }
);
// CRUD Manager END

//List of all Orders:

router.get("/courierMain/orderList", courierLoggedin, (req, res, next) => {
  Order.find()
    .then((allOrders) => {
      res.render("Manager/courierOrderList", { orders: allOrders });
    })
    .catch((error) => {
      console.log("Couriers error: ", error);
      next(error);
    });
});

module.exports = router;
