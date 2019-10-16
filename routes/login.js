const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}

const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
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

function createAccount(firstName, lastName, email, password, rePassword, birthDate, gender) {

	return new Promise((resolve, reject) => {

		const query = {
			text: 'INSERT INTO accounts(firstname, lastname, email, password, gender) VALUES($1, $2, $3, $4, $5)',
			values: [firstName, lastName, email, password, gender]
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
					message: 'Account created'
				})
			}
		})

	});
}

router.post('/register', [
	check('email').isEmail(),
	check('password').isLength({ min: 5 })
],
	function (req, res, next) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log({ errors: errors.array() });
		} else {
			const { firstName, lastName, email, password, rePassword, birthDate, gender } = req.body;
			console.log(firstName, lastName, email, password, rePassword, birthDate, gender);
			let query = {
				text: 'SELECT email FROM accounts WHERE email = $1',
				values: [email]
			}

			client.query(query, [email], (error, response) => {
				if (error) {
					console.log(error.stack);
					res.json({
						accountCreated: false,
						message: 'Database error please try again'
					})
				} else {
					if (response.rows.length > 0) {
						res.json({
							accountCreated: false,
							message: 'Account already exists'
						})
					} else {
						createAccount(firstName, lastName, email, password, rePassword, birthDate, gender)
							.then(function (message) {
								res.json(message);
							})
					}
				}
			});
		}

	})


router.post('/signin', function (req, res, next) {
	const { email, password } = req.body;
	console.log("User data:", email, password);

	let query = {
		text: 'SELECT email, password, firstName, lastName, id FROM accounts WHERE email = $1 and password = $2',
		values: [email, password]
	}

	client.query(query, [email, password], (error, response) => {
		if (error) {
			console.log(error.stack);
			res.json({
				login: false,
				token: 0,
			})
		} else {
			if (response.rows.length > 0) {
				// Add here also first and lastName to token
				jwt.sign({ user: email, username: response.rows[0].firstname + ' ' + response.rows[0].lastname, id: response.rows[0].id }, 'secretkey', { expiresIn: '2h' }, (err, token) => {
					res.json({
						login: true,
						token: token
					})
				});
			} else {
				res.json({
					login: false,
					token: 0
				})
			}
		}
	});
})


module.exports = router;