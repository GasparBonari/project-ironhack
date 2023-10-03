const { Router } = require('express');
const router = new Router();
const Manager = require('../models/Manager.models.js');
const mongoose = require('mongoose');
// require auth middleware
//const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard.js');

// GET route ==> to display the signup form to Manager
router.get('/signup', (req, res) => res.render('manager/managerCreate.hbs'));

// the setup code skipped
const bcryptjs = require('bcryptjs');
const saltRounds = 10;

// POST route ==> to process form data
router.post('/signup', (req, res, next) => {
console.log("The form data: ", req.body);
 
const { username, email, password, password2 } = req.body;

  if (!username || !email || !password) {
 res.render('Manager/managerCreate', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.' });
  return;
  } else if (password !== password2) {
    res.render('Manager/managerCreate', { errorMessage: 'You have provided wrong password. Please, try again.' });
    return;
  }

    // make sure passwords are strong:
    const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
    if (!regex.test(password)) {
      res
        .status(500)
        .render('Manager/managerCreate', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
      return;
    }
 
  bcryptjs.genSalt(saltRounds).then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      console.log('here')
      return Manager.create({
        username,
        email,
        passwordHash: hashedPassword
      });
    })
    .then(userFromDB => {
      userFromDB.save()
      console.log('Newly created user is: ', userFromDB);
      res.redirect(`/manager/managerNew/${userFromDB.username}`);
    })
    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
          res.status(500).render('Manager/managerCreate', { errorMessage: error.message });
      } else if (error.code === 11000) {
 
        console.log(" Username and email need to be unique. Either username or email is already used. ");
 
        res.status(500).render('Manager/managerCreate', {
           errorMessage: 'User not found and/or incorrect password.'
        });
      } else {
        next(error);
      }
    });
});

// GET route for managerNew
router.get('/managerNew/:username', (req, res) => {
    const { username } = req.params;
    res.render('manager/managerNew.hbs', { username });
  });

 
module.exports = router;
