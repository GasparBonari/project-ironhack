// starter code in both routes/customer.routes.js and routes/movies.routes.js
const router = require("express").Router();

const bcryptjs = require("bcryptjs");
const saltRounds = 10;

const Customer = require("../models/Customer.model.js");
const Order = require("../models/Order.model.js");

// middleware
const { isLoggedIn, isLoggedOut } = require("../middleware/route-guard.js");

// GET /auth/login
router.get("/customerLogin", isLoggedOut, (req, res) => {
  res.render("auth/customerLogin");
});

// POST /auth/login
router.post("/customerLogin", (req, res, next) => {
  console.log("SESSION =====> ", req.session);

  const { username, password } = req.body;

  // Check that username, email, and password are provided
  if (username === "" || password === "") {
    res.render("auth/customerLogin", {
      errorMessage:
        "All fields are mandatory. Please provide username and password.",
    });
    return;
  }

  // Search the database for a user with the username submitted in the form
  Customer.findOne({ username })
    .then((customer) => {
      if (!customer) {
        console.log("Login failed, account not registered. ");
        return res.render("./auth/customerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (bcryptjs.compareSync(password, customer.passwordHash)) {
        //******* SAVE THE USER IN THE SESSION ********//

        req.session.currentUser = customer;
        res.redirect("/");
      } else {
        console.log("Incorrect password. ");
        res.render("./auth/customerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      }
    })
    .catch((error) => {
      if (error) {
        res.render("./auth/customerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (error.code === 11000) {
        console.log(
          " User not found and/or incorrect password, please try again! "
        );

        res.status(500).render("./auth/customerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else {
        console.log("next");
        next(error);
      }
    }); // close .catch()
});

// Customer Signup
router.get("/customerSignup", isLoggedOut, (req, res) =>
  res.render("auth/customerSignup")
);

router.post("/customerSignup", (req, res, next) => {
  // console.log("The form data: ", req.body);
  const { username, email, password, password2 } = req.body;
  //return Customer.create({ username, email, password, password2 });
  // make sure users fill all mandatory fields correctly:

  if (!username || !email || !password || !password2) {
    res.render("auth/customerSignup", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email and password.",
    });
    return;
  } else if (password !== password2) {
    res.render("auth/customerSignup", {
      errorMessage: "Password and Password check is not identically!",
    });
    return;
  } else if (!username) {
    console.log("Error, this username may already exists. ");
    res.render("/customer/customerLogin", {
      errorMessage: "Error, this username may already exists.",
    });
    return;
  }

  // make sure passwords are strong:
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("auth/customerSignup", {
      errorMessage:
        "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return Customer.create({
        // username: username
        username,
        email,
        // passwordHash => this is the key from the User model
        //     ^
        //     |            |--> this is placeholder (how we named returning value from the previous method (.hash()))
        passwordHash: hashedPassword,
      });
    })
    .then((customerFromDB) => {
      console.log("Newly created user is: ", customerFromDB);
      //res.redirect("/customer/customerLogin");
      res.render("protected/customerCreated");
      //console.log("Response statusCode: ", res.statusCode);
      if (res.statusCode !== 200) {
        res.render("protected/customerCreated", {
          customer: customerFromDB,
        });
      } else {
        res.render("/auth/customerLogin");
      }
    })
    .catch((error) => {
      if (error) {
        res.render("auth/customerSignup", {
          errorMessage:
            " This username or email is already taken. Please login if you already have an account or try again with a free username and email!",
        });
      } else if (error.code === 11000) {
        console.log(
          " Username and email need to be unique. Either username or email is already used. "
        );

        res.status(500).render("auth/customerSignup", {
          errorMessage: "User not found and/or incorrect password.",
        });
      } else {
        next(error);
      }
    }); // close .catch()
}); // close .post()

router.get("/customerList", isLoggedIn, (req, res, next) => {
  Customer.find()
    .then((allCustomer) => {
      res.render("protected/customerList", { customer: allCustomer });
    })
    .catch((error) => {
      console.log("Customer error: ", error);
      next(error);
    });
});

router.get("/customerProfile", isLoggedIn, async (req, res) => {
  try {
    const userInSession = req.session.currentUser;
    const customer = await Customer.findById(userInSession._id);
    
    res.render("protected/customerProfile", {
      userInSession: customer,
    });
  } catch (error) {
    console.error('Error fetching customer data:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get("/:CustomerId/edit", (req, res, next) => {
  const { CustomerId } = req.params;

  Customer.findById(CustomerId)
    .then((CustomerToEdit) => {
      Customer.find().then((customer) => {
        res.render("protected/customerEdit", {
          userInSession: req.session.currentUser,
        });
      });
    })
    .catch((error) => next(error));
});

router.post("/:CustomerId/edit", (req, res, next) => {
  const { CustomerId } = req.params;
  const {
    username,
    email,
    password,
    fullname,
    street,
    housenumber,
    postcode,
    city,
    country,
  } = req.body;

  Customer.findByIdAndUpdate(
    CustomerId,
    {
      username,
      email,
      password,
      fullname,
      street,
      housenumber,
      postcode,
      city,
      country,
    },
    { new: true }
  )
    .then((updatedCustomer) => {
      req.session.currentUser = updatedCustomer;
      res.redirect("/customer/customerProfile");
    })
    .catch((error) => next(error));
});

router.post("/customerProfile/:CustomerId/delete", (req, res, next) => {
  const { CustomerId } = req.params;
  Customer.findByIdAndDelete(CustomerId)
    .then(() => {
      req.session.destroy((err) => {
        if (err) next(err);
      });
      res.render("protected/customerDeleted");
    })
    .catch((error) => next(error));
});

router.post("/customerLogout", isLoggedIn, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.render("protected/customerLoggedOut");
  });
});

module.exports = router;