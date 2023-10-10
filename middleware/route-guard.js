// middleware/route-guard.js

// checks if the user is logged in when trying to access a specific page
const isLoggedIn = (req, res, next) => {
  if (!req.session.currentUser) {
    return res.redirect("/customer/customerLogin");
  }
  next();
};

// if an already logged in user tries to access the login page it
// redirects the user to the home page
const isLoggedOut = (req, res, next) => {
  if (req.session.currentUser) {
    return res.redirect("/");
  }
  next();
};


// checks if the user is Manager logged in when trying to access a specific page
const managerLoggedin = (req, res, next) => {
  if (!req.session.currentUser) {
    return res.redirect("/manager/managerLogin");
  }
  next();
};

// if an already logged in user tries to access the login page it
// redirects the user to the home page
const managerLoggedout = (req, res, next) => {
  if (req.session.currentUser) {
    return res.redirect("/");
  }
  next();
};


// checks if the user is Manager logged in when trying to access a specific page
const courierLoggedin = (req, res, next) => {
  if (!req.session.currentUser) {
    return res.redirect("/manager/courierLogin");
  }
  next();
};

// if an already logged in user tries to access the login page it
// redirects the user to the home page
const courierLoggedout = (req, res, next) => {
  if (req.session.currentUser) {
    return res.redirect("/");
  }
  next();
};


module.exports = {
  isLoggedIn,
  isLoggedOut,
  managerLoggedin,
  managerLoggedout,
  courierLoggedin,
  courierLoggedout,
};
