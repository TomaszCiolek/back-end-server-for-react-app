const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');


router.get('/main', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			// some data for main page
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
		// Token
		console.log(jwt.verify(bearerToken, 'secretkey'));
		// Next middleware
		next();
	} else {
		// Forbidden
		res.sendStatus(403);
		console.log('no token header');
	}
}

module.exports = router;