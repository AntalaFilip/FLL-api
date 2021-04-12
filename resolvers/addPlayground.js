const { AuthenticationError, ApolloError } = require('apollo-server-errors');
const knex = require('../knex');
const { resolveUtils } = require('../utils');

const addPlayground = async (parent, args, context) => {
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

	// BUG: doesn't return whole Playground type - should somehow query the Playground using Query.playground(id: id)
	return (await knex.select().from('playgrounds').where({ id }))[0];
};
module.exports = addPlayground;