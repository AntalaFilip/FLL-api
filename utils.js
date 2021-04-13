const knex = require('./knex');

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

exports.resolveUtils = resolveUtils;