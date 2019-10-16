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
	.catch(err => console.error('database connection error', err.stack))


let unumber = -1;
router.get('/users', verifyToken, getUnumber, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			//FORBIDDEN
			res.sendStatus(403);
		} else {
			returnAllUsers(unumber).then(function (accounts) {
				res.json(accounts);
			})
		}
	});
})

router.get('/users/:id', verifyToken, (req, res) => {
	var id = req.params.id;
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			returnUser(id).then(function (account) {
				res.json(account);
			})
		}
	});
})

router.get('/friends', verifyToken, (req, res) => {
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			// FORBIDDEN
			res.sendStatus(403);
		} else {
			returnFriends().then(function (accounts) {
				res.json(accounts);
			})
		}
	});
})

function returnUser(id) {
	return new Promise((resolve, reject) => {
		const query = {
			text: 'SELECT id, firstname, lastname, gender, birthdate, friends FROM accounts WHERE id = $1',
			values: [id]
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve(res.rows[0]);
			}
		})
	});
}

function returnAllUsers(rowNumber) {
	return new Promise((resolve, reject) => {
		const query = {
			text: 'SELECT id, firstname, lastname, gender, birthdate, friends FROM accounts'
		};
		client.query(query, (err, res) => {
			if (err) {
				console.log(err.stack);
				reject({})
			} else {
				resolve({
					count: res.rows.length,
					users: [res.rows[rowNumber], res.rows[rowNumber + 1]]
				});
			}
		})
	});
}

function returnFriends() {
	return new Promise((resolve, reject) => {
		const query = {
			text: 'SELECT id, firstname, lastname, gender, birthdate, friends FROM accounts'
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
// MIDDLEWARES
function getUnumber(req, res, next) {
	unumber = req.headers.unumber;
	if (typeof unumber != 'undefined') {
		unumber = parseInt(unumber);
		// Next middleware
		next();
	} else {
		// Bad request
		res.sendStatus(400);
		console.log('no unumber');
	}
}

function verifyToken(req, res, next) {
	const bearerHeader = req.headers.authorization;
	if (typeof bearerHeader != 'undefined') {
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	} else {
		// Forbidden
		res.sendStatus(403);
		console.log('no token header');
	}
}

module.exports = router;