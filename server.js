// Express server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = 5000;
const bodyParser = require('body-parser');
// Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Unumber");
	next();
});

// Routes
let login = require('./routes/login');
app.use('/login', login);

let main = require('./routes/main');
app.use('/main', main);

let map = require('./routes/map');
app.use('/map', map);

let users = require('./routes/users');
app.use('/users', users);

let events = require('./routes/events');
app.use('/events', events);

let actions = require('./routes/actions');
app.use('/actions', actions);

// Start express server
server.listen(port, () => console.log(`Server started on port: ${port}`));