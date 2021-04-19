const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const RateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

const rateLimit = new RateLimit({
	windowMs: 1000,
	max: 3,
});

const typeDefs = require('./typedefs');
const resolvers = require('./resolvers');
const auth = require('./auth');

app.use(cors());
app.use(rateLimit);
app.use(cookieParser());
app.use('/auth', auth.router);

const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: ({ req }) => {
		const token = req.headers.authorization || req.cookies.authToken;
		const user = auth.auth(token);

		return { user };
	},
});

server.applyMiddleware({ app });

app.listen(process.env.PORT, () => console.log(`Server running at http://localhost:${process.env.PORT}${server.graphqlPath}`));