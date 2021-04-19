const knex = require('../knex');
const { categoryDataParser } = require('./parsers');

const getCategory = async (parent, args, context) => {
	let query = knex
		.select(
			'c.id AS category_id',
			'c.name AS category_name',
		)
		.from('categories AS c');

	if (args.id) query = query.where('c.id', args.id);
	const result = await query;

	const data = categoryDataParser(result);
	if (args.id) return data[0];
	return data;
};
module.exports = getCategory;