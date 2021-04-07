const { gql, ApolloServer } = require('apollo-server-express');
const express = require('express');
const RateLimit = require('express-rate-limit');
const { graphql } = require('graphql');

const rateLimit = new RateLimit({
	windowMs: 1000,
	max: 3,
});

const typeDefs = gql`
	type Query {
		hello: String
	}
`;

const resolvers = {
	Query: {
		hello: () => "Hello!",
	},
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

app.listen(4000, () => console.log(`Server running at http://localhost:4000${server.graphqlPath}`));