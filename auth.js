const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const RateLimit = require('express-rate-limit');
const knex = require('./resolvers').knex;
const fs = require('fs');
const bodyparser = require('body-parser');

const rateLimit = RateLimit({ windowMs: 5000, max: 5 });

const router = express.Router();
router.use(rateLimit);
router.use(bodyparser.json());

router.post('/login', async (req, res) => {
	const username = req.body.user;
	const pass = req.body.pass;
	// If user or password null, return a Bad Request
	if (!username || !pass) {
		res.status(400).send(`Please provide a valid 'req.body.user' and 'req.body.pass'`);
		return;
	}
	const response = await knex.select().from('users').where({ username });
	if (!response.length > 0) return res.status(401).send('Invalid username or password');
	/**
	 * @type {{id: number, username: string, password: string, email: string, name: string }}
	 */
	const userdata = JSON.parse(JSON.stringify(response[0]));
	const success = bcrypt.compareSync(pass, userdata.password);

	delete userdata.password;

	if (success) {
		const token = jwt.sign(userdata, fs.readFileSync('./certs/fllapiusercert.key'), { algorithm: 'RS256', expiresIn: '1h' });
		res.status(200).send({ message: 'Authentication successful!', data: { token, user: userdata } });
	}
	else {
		res.status(401).send('Invalid username or password');
	}
});

router.post('/auth', (req, res) => {
	const token = req.headers.authorization;
	if (!token) return res.status(401).send('Please provide an Authorization header');
	const authdata = this.auth(token);
	if (!authdata) return res.status(401).send('Invalid token');
	res.status(200).send({ message: 'Authentication successful!', data: { user: authdata } });
});

router.post('/register', async (req, res) => {
	const username = req.body.user;
	const email = req.body.email;
	const password = req.body.pass;
	const fullname = req.body.name;

	if (!username || !password || !email || !fullname) {
		res.status(400).send({ error: { code: 'ERRFIELDEMPTY', message: `Please provide a valid 'req.body.user', 'req.body.pass', 'req.body.email' and 'req.body.name'` } });
		return;
	}

	const usernameInUse = await knex.select().from('users').where({ username });
	if (usernameInUse.length > 0) return res.status(400).send({ error: { code: 'ERRUSERNAMEINUSE', message: 'This username is already in use!' } });
	const emailInUse = await knex.select().from('users').where({ email });
	if (emailInUse.length > 0) return res.status(400).send({ error: { code: 'ERREMAILINUSE', message: 'This email is already in use!' } });

	const salt = await bcrypt.genSalt();
	const hashed = await bcrypt.hash(password, salt);
	if (!hashed) return res.status(500).send({ error: { code: 'ERRPASSHASHFAILED', message: 'An error occurred while hashing the password' } });

	const userdata = { username, password: hashed, name: fullname, email };

	const id = (await knex.insert(userdata).into('users'))[0];
	userdata.id = id;
	res.status(200).send({ message: 'Registration successful', data: { user: userdata } });
});

function auth(token) {
	try {
		const data = jwt.verify(token, fs.readFileSync('./certs/fllapiusercertpub.key'), { algorithms: ['RS256'] });
		data.token = token;
		return data;
	}
	catch (e) {
		return null;
	}
}

exports.auth = auth;
exports.router = router;