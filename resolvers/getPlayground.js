const knex = require('../knex');

const getPlayground = async (parent, args, context) => {
	let query = knex
		.select('p.*', 'c.id AS cid', 'c.name AS cname', 'u.id AS uid', 'u.username', 'u.name AS uname', 'u.email AS uemail', 'role AS urole')
		.from('playgrounds AS p')
		.join('categories_to_playground AS ctp', 'ctp.playground_id', '=', 'p.id')
		.join('categories AS c', 'ctp.category_id', '=', 'c.id')
		.join('users as u', 'u.id', '=', 'p.addedby');
	if (args.id) query = query.where('p.id', args.id);

	const result = await query;

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
	if (args.id) return data[0];
	return data;
};
module.exports = getPlayground;