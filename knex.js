const { Knex } = require('knex');
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
module.exports = knex;