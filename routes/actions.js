const result = require('dotenv').config();
if (result.error) {
	throw result.error;
}

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { Pool, Client } = require('pg');
const client = new Client({
	user: process.env.POST_USER,
	password: process.env.POST_PASSWORD,
	host: process.env.POST_HOST,
	port: process.env.POST_PORT,
	database: process.env.POST_DATABASE
})

const pool = new Pool({
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

router.post('/acceptfriend', verifyToken, (req, res) => {
	const { id } = req.body;
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			res.sendStatus(403);
		} else {
			acceptFriend(req.user_id, id).then(function (message) {
				res.json(message);
			})
		}
	});
})

router.post('/sendfriendrequest', verifyToken, (req, res) => {
	const { id } = req.body;
	jwt.verify(req.token, 'secretkey', (err, authData) => {
		if (err) {
			res.sendStatus(403);
		} else {
			console.log('id ',id);
			console.log('id', req.user_id);
			addFriendRequest(req.user_id, id).then(function (message) {
				res.json(message);
			})
		}
	});
})

function acceptFriend(user_id, id) {
	return new Promise((resolve, reject) => {
		(async () => {
			const client = await pool.connect();
			try {
				await client.query('BEGIN')
				const queryText = 'UPDATE accounts SET friends = array_append(friends, $1) WHERE id = $2';
				await client.query(queryText, [id, user_id]);
				const insertPhotoText = 'DELETE FROM accounts WHERE receiverid = $1 AND senderid = $2';
				await client.query(insertPhotoText, [user_id, id]);
				await client.query('COMMIT');
			} catch (e) {
				await client.query('ROLLBACK');
				reject({friendAccepted: false});
				throw e;
			} finally {
				resolve({friendAccepted: true});
				client.release();
			}
		})().catch(e => console.error(e.stack))
	});
}

function addFriendRequest(user_id, id) {
	return new Promise((resolve, reject) => {
		pool.connect((err, client, done) => {
			if (err) throw err
			client.query('INSERT INTO friendrequests(receiverid, senderid) VALUES($1, $2)', [id, user_id], (err, res) => {
				done()
				if (err) {
					console.log(err.stack);
					reject({
						requestSent: false
					});
				} else {
					resolve({
						requestSent: true
					});
				}
			})
		})
	});
}


function verifyToken(req, res, next) {
	const bearerHeader = req.headers.authorization;
	if (typeof bearerHeader != 'undefined') {
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		req.token = bearerToken;
    req.user_id = jwt.verify(bearerToken, 'secretkey').id;
		next();
	} else {
		// Forbidden
		res.sendStatus(403);
		console.log('no token header');
	}
}

module.exports = router;