const knex = require("../knex");
const { facilityDataParser } = require("./parsers");

const getFacility = async (parent, args, context) => {
	let query = knex
		.select(
			'f.id AS facility_id',
			'f.name AS facility_name',
		)
		.from('facilities AS f');

	if (args.id) query = query.where('c.id', args.id);
	const result = await query;

	const data = facilityDataParser(result);

	if (args.id) return data[0];
	return data;
};

module.exports = getFacility;