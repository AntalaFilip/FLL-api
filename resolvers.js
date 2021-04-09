const { AuthenticationError, ApolloError } = require('apollo-server-errors');
const { Knex } = require('knex');
const axios = require('axios').default;
/**
 * @type {Knex}
 */
const knex = require('knex')({
	client: 'mysql',
	connection: {
		host: process.env.DBHOST,
		user: process.env.DBUSER,
		password: process.env.DBPASS,
		database: process.env.DBNAME,
	},
});

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
		playgrounds: [Role.USER, Role.MODERATOR, Role.ADMIN, Role.SYSTEM],
	},
	MODIFY: {

	},
	CREATE: {
		addPlayground: [Role.USER, Role.MODERATOR, Role.ADMIN, Role.SYSTEM],
	},
};

const resolvers = {
	Query: {
		hello: () => "Hello!",
		me: async (parent, args, context) => {
			if (!context.user) return null;
			return context.user;
		},
		playgrounds: async (parent, args, context) => {
			const result = await knex
				.select('p.*', 'c.id AS cid', 'c.name AS cname', 'u.id AS uid', 'u.username', 'u.name AS uname', 'u.email AS uemail', 'role AS urole')
				.from('playgrounds AS p')
				.join('categories_to_playground AS ctp', 'ctp.playground_id', '=', 'p.id')
				.join('categories AS c', 'ctp.category_id', '=', 'c.id')
				.join('users as u', 'u.id', '=', 'p.addedby');

			const data = result.map(p => {
				return {
					id: p.id,
					name: p.name,
					address: p.address,
					longtitude: p.longtitude,
					description: p.description,
					category: {
						id: p.cid,
						name: p.cname,
					},
					addedby: {
						id: p.uid,
						username: p.username,
						name: p.uname,
						role: p.urole,
						email: p.uemail,
					},
				};
			});
			return data;
		},
		playground: async (parent, args, context) => {
			const result = (await knex
				.select('p.*', 'c.id AS cid', 'c.name AS cname', 'u.id AS uid', 'u.username', 'u.name AS uname', 'u.email AS uemail', 'role AS urole')
				.from('playgrounds AS p')
				.where('p.id', args.id)
				.join('categories_to_playground AS ctp', 'ctp.playground_id', '=', 'p.id')
				.join('categories AS c', 'ctp.category_id', '=', 'c.id')
				.join('users as u', 'u.id', '=', 'p.addedby'))[0];

			const data = {
				id: result.id,
				name: result.name,
				address: result.address,
				longtitude: result.longtitude,
				description: result.description,
				category: {
					id: result.cid,
					name: result.cname,
				},
				addedby: {
					id: result.uid,
					username: result.username,
					name: result.uname,
					role: result.urole,
					email: result.uemail,
				},
			};
			return data;
		},
	},
	Mutation: {
		addPlayground: async (parent, args, context) => {
			// Throw error if not authenticated or if user doesn't have permission
			if (!context.user) throw new AuthenticationError();

			// Check if the Playground does not already exist
			const pExists = await resolveUtils.exists({ name: args.input.name }, 'playgrounds');
			if (pExists) throw new ApolloError('A Playground with this name already exists!', 'OBJALREADYEXISTS');

			// Get category ID
			const ctgId = args.input.categoryId;
			// Check if category ID exists
			const ctgExists = await resolveUtils.exists({ id: ctgId }, 'categories');
			if (!ctgExists) throw new ApolloError(`There is no category with the ID ${ctgId}!`, 'CTGNONEXIST');

			// Delete category ID from the args object
			delete args.input.categoryId;
			// Add an addedby property with the currently authenticated user's ID
			args.input.addedby = context.user.id;

			// Push the playground into the database and get its ID
			const id = (await knex.insert(args.input).into('playgrounds'))[0];
			// Push the category listing of the playground into the database
			await knex.insert({ category_id: ctgId, playground_id: id }).into('categories_to_playground');

			return (await knex.select().from('playgrounds').where({ id }))[0];
		},
		addCategory: async (parent, args, context) => {
			// Throw error if not authenticated
			if (!context.user || Permissions.CREATE.addPlayground.includes(context.user.role)) throw new AuthenticationError();
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

const resolveUtils = {
	/**
	 *
	 * @param {Object} object
	 * @param {string} table
	 * @returns {any | false}
	 */
	exists: async (object, table) => {
		const exists = await knex.select().from(table).where(object);
		if (exists.length > 0) return exists[0];
		else return false;
	},
};

exports.resolvers = resolvers;
exports.knex = knex;