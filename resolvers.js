const { AuthenticationError, ApolloError } = require('apollo-server-errors');
const axios = require('axios').default;
const knex = require('./knex');

const { resolveUtils } = require('./utils');

const getPlayground = require('./resolvers/getPlayground');
const addPlayground = require('./resolvers/addPlayground');

/**
 * @typedef User
 * @property {number} id
 * @property {string} username
 * @property {string?} email
 * @property {string} name
 * @property {"USER" | "MODERATOR" | "ADMIN" | "SYSTEM"} role
 */

/**
 * @readonly
 * @enum {string}
 */
const Role = {
	NONE: "NONE",
	USER: "USER",
	MODERATOR: "MODERATOR",
	ADMIN: "ADMIN",
	SYSTEM: "SYSTEM",
};

/**
 * @readonly
 * @enum {number}
 */
const Permissions = {
	READ: {
		playgrounds: [Role.NONE, Role.USER, Role.MODERATOR, Role.ADMIN, Role.SYSTEM],
	},
	MODIFY: {

	},
	CREATE: {
		playground: [Role.USER, Role.MODERATOR, Role.ADMIN, Role.SYSTEM],
		category: [Role.MODERATOR, Role.ADMIN, Role.SYSTEM],
	},
};

const resolvers = {
	Query: {
		hello: () => "Hello!",
		me: async (parent, args, context) => {
			if (!context.user) return null;
			return context.user;
		},
		playgrounds: getPlayground,
		playground: getPlayground,
	},
	Mutation: {
		addPlayground: addPlayground,
		addCategory: async (parent, args, context) => {
			// Throw error if not authenticated
			if (!context.user || Permissions.CREATE.playground.includes(context.user.role)) throw new AuthenticationError();
			// Check if category does not exist already
			const ctgExists = await resolveUtils.exists({ name: args.name }, 'categories');
			if (ctgExists) throw new ApolloError('A Catergory with this name already exists!', 'OBJALREADYEXISTS');

			const id = (await knex.insert(args).into('categories'))[0];
			return (await knex.select().from('categories').where({ id }))[0];
		},
		addUser: async (parent, args, context) => {
			if (!context.user || context.user.role != "ADMIN") throw new AuthenticationError();
			const res = await axios.post(`http://localhost:${process.env.PORT}/auth/register`, { user: args.username, pass: args.password, name: args.name, email: args.email });
			if (res.status == 200) return res.data.data.user;
			else return res.data;
		},
	},
	User: {
		id: (parent) => parent.id,
		username: (parent) => parent.username,
		name: (parent) => parent.name,
		email: (parent, args, context) => {
			if (!context.user) return null;
			if (context.user.role == Role.ADMIN || context.user.role == Role.SYSTEM) return parent.email;
			if (context.user.id == parent.id) return parent.email;
			return null;
		},
	},
};
module.exports = resolvers;