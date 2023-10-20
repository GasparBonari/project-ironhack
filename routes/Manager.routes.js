const { Router } = require("express");
const router = new Router();
const Manager = require("../models/Manager.models.js");
const Restaurant = require("../models/Restaurant.model.js");
const Order = require("../models/Order.model.js");
const Customer = require("../models/Customer.model.js");

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
router.post("/managerLogin", (req, res, next) => {
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
  Manager.findOne({ username }).then((manager) => {
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
      //res.render("Manager/managerMain");
    } else {
      console.log("Incorrect password. ");
      res.render("Manager/managerLogin", {
        errorMessage:
          "User not found and/or incorrect password, please try again!",
      });
    }
  });
  /*.catch((error) => {
      if (error) {
        res.render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (error.code === 11000) {
        console.log(
          "User not found and/or incorrect password, please try again! "
        );

        res.render("Manager/managerLogin", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else {
        console.log("next");
        next(error);
      }
    });*/ // close .catch()
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

router.get("/managerMain", isManagerAndLoggedIn, (req, res) => {
  res.render("Manager/managerMain", {
    userInSession: req.session.currentUser,
  });
  /*.catch((error) => {
      if (error) {
        res.render("Manager/requireManager", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else if (error.code === 11000) {
        console.log(
          " User not found and/or incorrect password, please try again! "
        );

        res.render("Manager/requireManager", {
          errorMessage:
            "User not found and/or incorrect password, please try again!",
        });
      } else {
        console.log("next");
        next(error);
      }
    });*/ // close .catch();
});

// GET route for managerNew
router.get("/managerNew/:username", (req, res) => {
  const { username } = req.params;
  res.render("Manager/managerNew", { username });
});

// edit/delete Manager profile:

router.get("/:ManagerId/edit", managerLoggedin, (req, res, next) => {
  const { ManagerId } = req.params;

  Manager.findById(ManagerId)
    .then((ManagerToEdit) => {
      Manager.find().then((manager) => {
        res.render("Manager/managerEdit", {
          userInSession: req.session.currentUser,
          managerToEdit: ManagerToEdit,
        });
      });
    })
    .catch((error) => next(error));
});

router.post("/:ManagerId/edit", managerLoggedin, (req, res, next) => {
  const { ManagerId } = req.params;
  const { username, email, birthday, country, city } = req.body;

  Manager.findByIdAndUpdate(
    ManagerId,
    {
      username,
      email,
      birthday,
      country,
      city,
    },
    { new: true }
  )
    .then((updatedManager) => {
      req.session.currentUser = updatedManager;
      res.redirect(`/manager/${ManagerId}/edit`);
    })
    .catch((error) => next(error));
});

router.post(
  "/managerMain/:ManagerId/delete",
  managerLoggedin,
  (req, res, next) => {
    const { ManagerId } = req.params;
    Manager.findByIdAndDelete(ManagerId)
      .then(() => {
        req.session.destroy((err) => {
          if (err) next(err);
          res.render("Manager/managerDeleted");
        });
      })
      .catch((error) => next(error));
  }
);

// Route for Manager logOut:
router.post("/managerLogout", managerLoggedin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.render("manager/managerLogin");
  });
});

// CRUD Restaurants BEGIN

// GET route ==> to display the create form for restaurant
router.get("/managerMain/createRestaurant", isManagerAndLoggedIn, (req, res) =>
  res.render("Manager/restaurant/createRestaurant")
);

// POST route ==> to process form data
router.post("/managerMain/createRestaurant", (req, res, next) => {
  // console.log("The form data: ", req.body);
  const { name, email, image, adress } = req.body;

  if (!name || !email || !adress) {
    res.render("Manager/restaurant/createRestaurant", {
      errorMessage:
        "All fields are mandatory. Please provide name, email, image, adress and adress.",
    });
    return;
  }

  return Restaurant.create({ name, email, image, adress })
    .then((allRestaurants) => {
      //console.log("Response statusCode: ", res.statusCode);
      console.log(allRestaurants);
      if (res.statusCode !== 200) {
        res.render("Manager/restaurant/restaurantList", {
          restaurants: allRestaurants,
        });
      } else {
        res.redirect("/manager/managerMain/restaurantList");
      }
    })
    .catch((error) => {
      console.log("Restaurant create error: ", error);
      next(error);
    });
});

router.get(
  "/managerMain/restaurantList",
  isManagerAndLoggedIn,
  (req, res, next) => {
    Restaurant.find()
      .then((allRestaurants) => {
        res.render("Manager/restaurant/restaurantList", {
          restaurants: allRestaurants,
        });
      })
      .catch((error) => {
        console.log("Restaurant error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/restaurantList/:RestaurantId/delete",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    Restaurant.findByIdAndDelete(RestaurantId)
      .then(() => {
        res.render("Manager/restaurant/restaurantDeleted");
      })
      .catch((error) => next(error));
  }
);

router.get(
  "/managerMain/restaurantList/:RestaurantId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    Restaurant.findById(RestaurantId)
      .then((restaurantToEdit) => {
        Restaurant.find().then((restaurants) => {
          res.render("Manager/restaurant/restaurantEdit", {
            restaurant: restaurantToEdit,
            restaurants,
          });
        });
      })
      .catch((error) => {
        console.log("Restaurant error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/restaurantList/:RestaurantId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    const { name, image, address } = req.body;

    console.log("BODY: ", req.body);

    Restaurant.findByIdAndUpdate(
      RestaurantId,
      {
        name,
        image,
        address,
      },
      { new: true }
    )
      .then(() => {
        res.redirect(req.originalUrl);
        //res.redirect("/manager/managerMain/restaurantList/");
      })
      .catch((error) => next(error));
  }
);

router.get(
  "/managerMain/restaurantList/:RestaurantId/updateMenu",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    Restaurant.findById(RestaurantId)
      .then((restaurantToEdit) => {
        Restaurant.find().then((restaurants) => {
          res.render("Manager/restaurant/restaurantUpdateMenu", {
            restaurant: restaurantToEdit,
            restaurants,
          });
        });
      })
      .catch((error) => {
        console.log("Restaurant error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/restaurantList/:RestaurantId/:menuId/updateMenu",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId, menuId } = req.params;
    const { name, price, image } = req.body;

    console.log("BODY: ", req.body);

    /* Solution 1: mongoos -> JS array | BEGIN*/
    /*   Restaurant.findById(RestaurantId)
      .then((restaurantDatas) => {
        console.log(restaurantDatas);
        let menu = restaurantDatas.menu.id(menuId);
        console.log(menu);
        menu["name"] = name;
        menu["price"] = price;
        menu["image"] = image;
        restaurantDatas.save();
        
      })*/
    /* Solution 1: | END*/

    /* Solution 2: mongoos  | BEGIN*/
    Restaurant.updateOne(
      {
        "menu._id": menuId,
      },
      {
        $set: {
          "menu.$.name": name,
          "menu.$.price": price,
          "menu.$.image": image,
        },
      }
    )
      /* Solution 2: mongoos  | END*/
      .then((updatedMenu) => {
        res.redirect(req.get("referer"));
      })
      .catch((err) => {
        console.log("Update menu error", err);
      });
  }
);

router.post(
  "/managerMain/restaurantList/:RestaurantId/:menuId/deleteMenu",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId, menuId } = req.params;
    Restaurant.findByIdAndUpdate(
      { _id: RestaurantId },
      { $pull: { menu: { _id: menuId } } }
    )
      .then(() => {
        res.redirect(req.get("referer"));
        //res.redirect(req.originalUrl);
      })
      .catch((error) => next(error));
  }
);

router.get(
  "/managerMain/restaurantList/:RestaurantId/addMenu",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    Restaurant.findById(RestaurantId)
      .then((restaurantToEdit) => {
        Restaurant.find().then((restaurants) => {
          res.render("Manager/restaurant/restaurantAddMenu", {
            restaurant: restaurantToEdit,
            restaurants,
          });
        });
      })
      .catch((error) => {
        console.log("Restaurant error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/restaurantList/:RestaurantId/addMenu",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { RestaurantId } = req.params;
    const { name, price, image } = req.body;

    Restaurant.findById(RestaurantId)
      .then((restaurantDatas) => {
        restaurantDatas.menu.unshift({ name, price, image });
        restaurantDatas.save();
      })
      .then(() => {
        //res.redirect(req.get('referer'));
        res.redirect(req.originalUrl);
      })
      .catch((err) => {
        console.log("Update menu error", err);
      });
  }
);

// CRUD Restaurants END

// CRUD Managers BEGIN

// GET route ==> to display the create form for Manager
router.get("/managerMain/managerCreate", isManagerAndLoggedIn, (req, res) =>
  res.render("manager/managerCreate")
);

// POST route ==> to process form data
router.post("/managerMain/managerCreate", (req, res, next) => {
  // console.log("The form data: ", req.body);
  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password || !password2) {
    res.render("Manager/managerCreate", {
      errorMessage:
        "All fields are mandatory. Please provide name, email and password",
    });
    return;
  }

  return Manager.create({ username, email, password, password2 })
    .then((allManagers) => {
      //console.log("Response statusCode: ", res.statusCode);
      console.log(allManagers);
      if (res.statusCode !== 200) {
        res.render("Manager/managerList", {
          managers: allManagers,
        });
      } else {
        res.redirect("/manager/managerMain/managerList");
      }
    })
    .catch((error) => {
      console.log("Manager create error: ", error);
      next(error);
    });
});

router.get(
  "/managerMain/managerList",
  isManagerAndLoggedIn,
  (req, res, next) => {
    Manager.find()
      .then((allManagers) => {
        res.render("Manager/managerList", { managers: allManagers });
      })
      .catch((error) => {
        console.log("Managers error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/managerList/:ManagerId/delete",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { ManagerId } = req.params;
    Manager.findByIdAndDelete(ManagerId)
      .then(() => {
        res.render("Manager/managerDeleted");
      })
      .catch((error) => next(error));
  }
);

router.get(
  "/managerMain/managerList/:ManagerId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { ManagerId } = req.params;
    Manager.findById(ManagerId)
      .then((managerToEdit) => {
        Manager.find().then((managers) => {
          res.render("Manager/managerEdit", {
            manager: managerToEdit,
            managers,
          });
        });
      })
      .catch((error) => {
        console.log("Manager error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/managerList/:ManagerId/edit",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { ManagerId } = req.params;
    const { username, email, birthday, country, city } = req.body;
    Manager.findByIdAndUpdate(
      ManagerId,
      {
        username,
        email,
        birthday,
        country,
        city,
      },
      { new: true }
    )
      .then((updatedManager) => {
        res.redirect("/manager/managerMain/managerList/");
      })
      .catch((error) => next(error));
  }
);
// CRUD Manager END

// CRUD Order Begin

router.get("/managerMain/orderList", isManagerAndLoggedIn, (req, res, next) => {
  Order.find()
    .then((allOrders) => {
      res.render("Manager/managerOrderList", { orders: allOrders });
    })
    .catch((error) => {
      console.log("Managers error: ", error);
      next(error);
    });
});

router.post(
  "/managerMain/orderList/:OrderId/delete",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { OrderId } = req.params;
    Order.findByIdAndDelete(OrderId)
      .then(() => {
        res.redirect(req.get("referer"));
      })
      .catch((error) => next(error));
  }
);
// CRUD Order END

// CRUD Customer Begin

router.get(
  "/managerMain/customerList",
  isManagerAndLoggedIn,
  (req, res, next) => {
    Customer.find()
      .then((allCustomers) => {
        res.render("Manager/customerList", { customers: allCustomers });
      })
      .catch((error) => {
        console.log("Managers error: ", error);
        next(error);
      });
  }
);

router.post(
  "/managerMain/customerList/:CustomerId/delete",
  isManagerAndLoggedIn,
  (req, res, next) => {
    const { CustomerId } = req.params;
    Customer.findByIdAndDelete(CustomerId)
      .then(() => {
        res.redirect(req.get("referer"));
      })
      .catch((error) => next(error));
  }
);

// CRUD Customer END
module.exports = router;
