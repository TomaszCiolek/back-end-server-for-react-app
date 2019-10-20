const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const { Client } = require('pg');
const client = new Client({
	user: process.env.POST_USER,
	password: process.env.POST_PASSWORD,
	host: process.env.POST_HOST,
	port: process.env.POST_PORT,
	database: process.env.POST_DATABASE
})

client
  .connect()
  .then(() => console.log('connected to database'))
  .catch(err => console.error('database connection error', err.stack))

function createEvent(venue, x, y, eventname, eventdescription, eventdate, group, selectedfriends, user_id) {
  return new Promise((resolve, reject) => {
    const query = {
      text: 'INSERT INTO events(venue, organizer, x, y, eventname, eventdescription, eventdate, target, selectedfriends) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      values: [venue, user_id, x, y, eventname, eventdescription, eventdate, group, selectedfriends]
    };
    client.query(query, (err, res) => {
      if (err) {
        console.log(err.stack);
        reject({
          accountCreated: false,
          message: 'Database error please try again'
        })
      } else {
        resolve({
          accountCreated: true,
          message: 'Event created'
        })
      }
    })
  })
}

router.post('/event', verifyToken, [
  //check('venue').isLength({ min: 3 }),
  //check('x').isLength({ min: 5 })
],
  function (req, res, next) {
    const { venue, x, y, eventname, eventdescription, eventdate, group, selectedfriends } = req.body;
    jwt.verify(req.token, 'secretkey', (err, authData) => {
      if (err) {
        // No JWT
        console.log('No JWT token with event post');
      } else {
        // validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log({ errors: errors.array() });
        } else {
          createEvent(venue, x, y, eventname, eventdescription, eventdate, group, selectedfriends, req.user_id)
            .then(function (message) {
              res.json(message);
            })
        }
      }
    });
  })

// Authorization: Bearer <access_token>
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers.authorization;
  // Check if bearer is undefined
  if (typeof bearerHeader != 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    req.token = bearerToken;
    req.user_id = jwt.verify(bearerToken, 'secretkey').id;
    // console.log(jwt.verify(bearerToken, 'secretkey'));
    // Next middleware
    next();
  } else {
    // Forbidden
    res.sendStatus(403);
    console.log('no token header');
  }
}

module.exports = router;