const knex = require('../knex');
const { categoryDataParser } = require('./parsers');

const getCategory = async (parent, args, { dataSources }) => {
	const result = await dataSources.database.getCategory(args.id);

	const data = categoryDataParser(result);
	if (args.id) return data[0];
	return data;
};
module.exports = getCategory;