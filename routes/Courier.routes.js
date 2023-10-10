const { Router } = require('express');
const router = new Router();
const Courier = require('../models/Courier.models'); // Import the Courier model
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const saltRounds = 10;

// Middleware
const { courierLoggedin, courierLoggedout } = require('../middleware/route-guard.js');

// GET /manager/login
router.get('/courierLogin', courierLoggedout, (req, res) => {
  res.render('Manager/courierLogin');
});

// POST /manager/login
router.post('/courierLogin', (req, res, next) => {
  console.log('here it was hit');
  console.log('SESSION =====> ', req.session);

  const { username, password } = req.body;

  // Check that username and password are provided
  if (username === '' || password === '') {
    return res.render('Manager/courierLogin', {
      errorMessage: 'All fields are mandatory. Please provide username and password.',
    });
  }

  // Search the database for a user with the username submitted in the form
  Courier.findOne({ username })
    .then((courier) => {
      if (!courier) {
        console.log('Login failed, account not registered.');
        return res.render('Manager/courierLogin', {
          errorMessage: 'User not found and/or incorrect password, please try again!',
        });
      } else if (bcryptjs.compareSync(password, courier.passwordHash)) {
        // Save the user in the session
        req.session.currentUser = courier;
        console.log('Session data after login:', req.session);
        return res.redirect('/manager/courierMain');
      } else {
        console.log('Incorrect password.');
        return res.render('Manager/courierLogin', {
          errorMessage: 'User not found and/or incorrect password, please try again!',
        });
      }
    })
    .catch((error) => {
      if (error.code === 11000) {
        console.log('User not found and/or incorrect password, please try again!');
        return res.status(500).render('Manager/courierLogin', {
          errorMessage: 'User not found and/or incorrect password, please try again!',
        });
      } else {
        next(error);
      }
    });
});

// GET route to display the signup form for Courier
router.get('/courierCreate', courierLoggedout, (req, res) => {
  res.render('Manager/courierCreate');
});

// POST route to process form data for Courier registration
router.post('/courierCreate', (req, res, next) => {
  console.log('The form data: ', req.body);

  const { username, email, password, password2 } = req.body;

  if (!username || !email || !password) {
    return res.render('Manager/courierCreate', { errorMessage: 'All fields are mandatory. Please provide your username, email, and password.' });
  } else if (password !== password2) {
    return res.render('Manager/courierCreate', { errorMessage: 'Passwords do not match. Please, try again.' });
  }

  // Make sure passwords are strong:
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render('Manager/courierCreate', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }

  bcryptjs.genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return Courier.create({
        username,
        email,
        passwordHash: hashedPassword,
      });
    })
    .then((userFromDB) => {
      console.log('Newly created user is: ', userFromDB);
      return res.redirect(`/manager/courierNew/${userFromDB.username}`);
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        return res.status(500).render('Manager/courierCreate', { errorMessage: error.message });
      } else if (error.code === 11000) {
        console.log('Username or email is already in use.');
        return res.status(500).render('Manager/courierCreate', {
          errorMessage: 'Username or email is already in use.',
        });
      } else {
        next(error);
      }
    });
});

// GET route to display Courier main page
router.get('/courierMain', courierLoggedin, (req, res) => {
  res.render('Manager/courierMain', {
    userInSession: req.session.currentUser,
  });
});

// GET route for courierNew
router.get('/courierNew/:username', (req, res) => {
  const { username } = req.params;
  res.render('Manager/courierNew', { username });
});

// POST route to log out a Courier
router.post('/courierLogout', courierLoggedin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    return res.render('Manager/courierLogin');
  });
});

module.exports = router;