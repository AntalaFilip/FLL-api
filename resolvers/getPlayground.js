const knex = require('../knex');
const { playgroundDataParser } = require('./parsers');

const getPlayground = async (parent, args, context) => {
	let query = knex
		.select(
			'p.id AS playground_id',
			'p.name AS playground_name',
			'p.description AS playground_description',
			'p.address AS playground_address',
			'p.longtitude AS playground_longtitude',
			'p.latitude AS playground_latitude',
			'p.plus_code AS playground_plus_code',
			'p.place_id AS playground_place_id',

			knex.raw('JSON_ARRAYAGG(c.id) AS category_ids'),
			knex.raw('JSON_ARRAYAGG(c.name) AS category_names'),

			'u.id AS user_id',
			'u.username AS user_username',
			'u.name AS user_name',
			'u.email AS user_email',
			'u.role AS user_role',
		)
		.from('playgrounds AS p')
		.join('categories_to_playground AS ctp', 'ctp.playground_id', '=', 'p.id')
		.join('categories AS c', 'ctp.category_id', '=', 'c.id')
		.join('users AS u', 'u.id', '=', 'p.addedby')
		.groupBy('p.id', 'u.id');

	if (args.id) query = query.where('p.id', args.id);
	const result = await query;

	const data = playgroundDataParser(result);
	if (args.id) return data[0];
	return data;
};
module.exports = getPlayground;