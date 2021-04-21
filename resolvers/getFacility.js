const knex = require("../knex");
const { facilityDataParser } = require("./parsers");

const getFacility = async (parent, args, context) => {
	const result = await context.dataSources.database.getFacility(args.id);

	const data = facilityDataParser(result);

	if (args.id) return data[0];
	return data;
};

module.exports = getFacility;