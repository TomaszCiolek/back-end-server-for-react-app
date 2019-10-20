const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

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
	.catch(e => console.error('database connection error', err.stack))

router.get('/friendevents', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			sendFriendEvents(req.user_id).then(function (events) {
				res.json(events);
			})
		}
	});
})

router.get('/publicevents', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			sendPublicEvents().then(function (events) {
				res.json(events);
			})
		}
	});
})

router.get('/myevents', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			sendMyEvents(req.user_id).then(function (events) {
				res.json(events);
			})
		}
	});
})

router.post('/deleteevents', verifyToken, (req, res) => {
	const { event_id } = req.body;
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			deleteEvent(req.user_id, event_id).then(function (events) {
				res.json(events);
			})
		}
	});
})

function sendFriendEvents(id) {
	return new Promise((resolve, reject) => {
		const query = {
			text:"SELECT DISTINCT venue, x, y, eventname, eventdescription, eventdate FROM events , (SELECT friends FROM accounts, events WHERE accounts.id=organizer) AS friends WHERE $1 = ANY(selectedfriends) OR (target = 'friends' AND $1 = ANY(friends))",
			values: [id]
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve(res.rows);
			}
		})
	});
}

function sendPublicEvents() {
	return new Promise((resolve, reject) => {
		const query = {
			text: "SELECT venue, x, y, eventname, eventdescription, eventdate FROM events WHERE target='everybody'",
			values: []
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve(res.rows);
			}
		})
	});
}

function deleteEvent(id) {
	return new Promise((resolve, reject) => {
		const query = {
			text: "DELETE FROM events WHERE id = $1",
			values: [id]
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve(res.rows);
				console.log('deleted', res.rows);
			}
		})
	});
}

function sendMyEvents(id) {
	return new Promise((resolve, reject) => {
		const query = {
			text: "SELECT id, venue, x, y, eventname, eventdescription, eventdate FROM events WHERE organizer = $1",
			values: [id]
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve(res.rows);
			}
		})
	});
}
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
		// Next middleware
		next();
	} else {
		// Forbidden
		res.sendStatus(403);
		console.log('no token header');
	}
}

module.exports = router;