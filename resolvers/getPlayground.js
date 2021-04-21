const knex = require('../knex');
const { playgroundDataParser } = require('./parsers');

const getPlayground = async (parent, args, context) => {
	const result = await context.dataSources.database.getPlayground(args.id);

	const data = playgroundDataParser(result);
	if (args.id) return data[0];
	return data;
};
module.exports = getPlayground;