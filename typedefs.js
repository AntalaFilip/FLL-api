const { gql } = require('apollo-server-express');

const typeDefs = gql`
	type Query {
		hello: String!
		playgrounds: [Playground!]!
		playground(id: ID!): Playground
		categories: [Category!]!
		category(id: ID!): Category
		me: User
	}
	type Mutation {
		addPlaygroundByAddress(base: PlaygroundBaseInput, location: PlaygroundAddressInput): Playground!,
		addPlaygroundByCoords(base: PlaygroundBaseInput, location: PlaygroundCoordsInput): Playground!,
		addCategory(name: String): Category!,
		addUser(username: String!, password: String!, name: String!, email: String!, roleId: Int!): User!,
	}

	input PlaygroundBaseInput {
		name: String!,
		description: String!,
		categoryIds: [Int!]!,
	}
	input PlaygroundAddressInput {
		address: String!,
	}
	input PlaygroundCoordsInput {
		latitude: Float!,
		longtitude: Float!,
	}
	
	type Playground {
		id: ID!,
		name: String!,
		location: PlaygroundLocation!,
		description: String!,
		categories: [Category!]!,
		addedby: User!,
	}
	type PlaygroundLocation {
		address: Address!,
		geocoordinates: GeoCoordinates!,
		plus_code: String!,
		place_id: String!,
	}
	type Address {
		formatted: String!,
		street_num: Int,
		route: String,
		sublocality: String,
		admin_area_1: String,
		admin_area_2: String,
		country: String,
		postal_code: String,
	}
	type GeoCoordinates {
		latitude: Float!,
		longtitude: Float!,
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