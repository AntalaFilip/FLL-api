const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const RateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const publicIp = require('public-ip');
require('dotenv').config();

const app = express();

const rateLimit = new RateLimit({
	windowMs: 1000,
	max: 3,
});

const typeDefs = require('./typedefs');
const resolvers = require('./resolvers');
const auth = require('./auth');
const DatabaseAPI = require('./database');

app.use(cors());
if (process.env.NODE_ENV !== 'DEVELOPMENT') app.use(rateLimit);
app.use(cookieParser());
app.use('/auth', auth.router);

const server = new ApolloServer({
	typeDefs,
	resolvers,
	dataSources: () => {
		return {
			database: new DatabaseAPI({
				client: 'mysql',
				connection: {
					host: process.env.DBHOST,
					user: process.env.DBUSER,
					password: process.env.DBPASS,
					database: process.env.DBNAME,
				},
			}),
		};
	},
	context: ({ req }) => {
		const token = req.headers.authorization || req.cookies.authToken;
		const user = auth.auth(token);

		return { user };
	},
});

server.start()
	.then(() => {
		server.applyMiddleware({ app });

		console.log('Launching Apollo GraphQL Server...');
		console.time('start');
		app.listen(process.env.PORT, async () => {
			const mode = process.env.NODE_ENV;
			const ip = await publicIp.v4();
			const port = process.env.PORT;
			console.timeLog('start');
			console.log(`Apollo Server running
			in ${mode} mode
			at ${mode !== 'DEVELOPMENT' ? `http://${ip}:${port}` : `http://localhost:${port}`}${server.graphqlPath}
			on ${process.env.USERNAME}@${process.env.COMPUTERNAME}`);
		});
	});
global.server = server;