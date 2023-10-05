// starter code in both routes/customer.routes.js and routes/movies.routes.js
const router = require("express").Router();

const bcryptjs = require("bcryptjs");
const saltRounds = 10;

const Customer = require("../models/Customer.model.js");
const Dish = require("../models/Dish.model.js");
const Order = require("../models/Order.model.js");

// middleware
const { isLoggedIn, isLoggedOut } = require("../middleware/route-guard.js");

// GET /auth/login
router.get("/customer/customerLogin", isLoggedOut, (req, res) => {
  res.render("auth/customerLogin");
});

// POST /auth/login
router.post("/customer/customerLogin", (req, res, next) => {
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
        res.render("/customer/customerLogin", {
          errorMessage: "User not found and/or incorrect password.",
        });
        return;
      } else if (bcryptjs.compareSync(password, customer.passwordHash)) {
        //******* SAVE THE USER IN THE SESSION ********//
        req.session.currentUser = customer;
        res.redirect("/customer/customerProfile");
      } else {
        console.log("Incorrect password. ");
        res.render("/customer/customerLogin", {
          errorMessage: "User not found and/or incorrect password.",
        });
      }
    })
    .catch((err) => next(err));
});

// Customer Signup
router.get("/customer/customerSignup", isLoggedOut, (req, res) =>
  res.render("auth/customerSignup")
);

router.post("/customer/customerSignup", (req, res, next) => {
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
        res.render("auth/customerSignup", { errorMessage: error.message });
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

router.get("/customer/customerList", (req, res, next) => {
  Customer.find()
    .then((allCustomer) => {
      res.render("protected/customerList", { customer: allCustomer });
    })
    .catch((error) => {
      console.log("Customer error: ", error);
      next(error);
    });
});

router.get("/customer/customerProfile", isLoggedIn, (req, res) => {
  res.render("protected/customerProfile", {
    userInSession: req.session.currentUser,
  });
});

router.get("/customer/:CustomerId", (req, res, next) => {
  const { CustomerId } = req.params;

  Customer.findById(CustomerId)
    .then((theCustomer) =>
      res.render("protected/customerProfile", { Customer: theCustomer })
    )
    .catch((error) => {
      console.log("Error while getting customer from DB: ", error);
      // call the middleware-error to display error page to the user
      next(error);
    });
});

router.get("/customer/:CustomerId/edit", (req, res, next) => {
  const { CustomerId } = req.params;

  Customer.findById(CustomerId)
    .then((CustomerToEdit) => {
      Customer.find().then((customer) => {
        res.render("protected/customerEdit", {
          Customer: CustomerToEdit,
          customer,
        });
      });
    })
    .catch((error) => next(error));
});

router.post("/customer/:CustomerId/edit", (req, res, next) => {
  const { CustomerId } = req.params;
  const { name, occupation, catchPhrase } = req.body;

  Customer.findByIdAndUpdate(
    CustomerId,
    { name, occupation, catchPhrase },
    { new: true }
  )
    .then((updatedCustomer) => res.redirect(`/customer/${updatedCustomer.id}`))
    .catch((error) => next(error));
});

router.post(
  "/customer/customerProfile/:CustomerId/delete",
  (req, res, next) => {
    const { CustomerId } = req.params;
    Customer.findByIdAndDelete(CustomerId)
      .then(() => {
        req.session.destroy((err) => {
          if (err) next(err);
        });
        res.render("protected/customerDeleted");
      })
      .catch((error) => next(error));
  }
);

router.post("/customer/customerLogout", isLoggedIn, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.render("protected/customerLoggedOut");
  });
});
// all your routes here

module.exports = router;
