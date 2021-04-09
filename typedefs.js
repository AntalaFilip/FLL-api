const { gql } = require('apollo-server-express');

const typeDefs = gql`
	type Query {
		hello: String!
		playgrounds: [Playground!]!
		playground(id: ID!): Playground
		me: User
	}
	input PlaygroundInput {
		name: String!,
		address: String!,
		latitude: Float!,
		longtitude: Float!,
		description: String!,
		# TODO: array of category IDs
		categoryId: Int!
	}
	type Mutation {
		addPlayground(input: PlaygroundInput!): Playground!,
		addCategory(name: String): Category,
		addUser(username: String!, password: String!, name: String!, email: String!, roleId: Int!): User,
	}
	type Playground {
		id: ID!,
		name: String!,
		address: String!,
		longtitude: Float!,
		latitude: Float!,
		description: String!,
		category: Category!,
		addedby: User!,
	}
	type Category {
		id: ID!,
		name: String!,
	}
	type User {
		id: ID!,
		username: String!,
		name: String!,
		email: String,
		role: UserRole!,
	}
	enum UserRole {
		SYSTEM
		ADMIN
		MODERATOR
		USER
	}
`;

module.exports = typeDefs;