const { SQLDataSource } = require("datasource-sql");

class DatabaseAPI extends SQLDataSource {
	getPlayground(id = undefined) {
		let query = this.knex
			.select(
				'p.id AS playground_id',
				'p.name AS playground_name',
				'p.description AS playground_description',
				'p.address AS playground_address',
				'p.longtitude AS playground_longtitude',
				'p.latitude AS playground_latitude',
				'p.plus_code AS playground_plus_code',
				'p.place_id AS playground_place_id',

				this.knex.raw('JSON_ARRAYAGG(c.id) AS category_ids'),
				this.knex.raw('JSON_ARRAYAGG(c.name) AS category_names'),

				this.knex.raw('JSON_ARRAYAGG(f.id) AS facility_ids'),
				this.knex.raw('JSON_ARRAYAGG(f.name) AS facility_names'),

				'u.id AS user_id',
				'u.username AS user_username',
				'u.name AS user_name',
				'u.email AS user_email',
				'u.role AS user_role',
			)
			.from('playgrounds AS p')
			.join('categories_to_playground AS ctp', 'ctp.playground_id', '=', 'p.id')
			.join('categories AS c', 'ctp.category_id', '=', 'c.id')
			.join('facilities_to_playground AS ftp', 'ftp.playground_id', '=', 'p.id')
			.join('facilities AS f', 'ftp.facility_id', '=', 'f.id')
			.join('users AS u', 'u.id', '=', 'p.addedby')
			.groupBy('p.id', 'u.id');

		if (id) {
			query = query.where('p.id', id);
		}
		return query.cache();
	}
	getCategory(id = undefined) {
		let query = this.knex
			.select(
				'c.id AS category_id',
				'c.name AS category_name',
			)
			.from('categories AS c');

		if (id) {
			query = query.where('c.id', id);
		}

		return query.cache();
	}
	getFacility(id = undefined) {
		let query = this.knex
			.select(
				'f.id AS facility_id',
				'f.name AS facility_name',
			)
			.from('facilities AS f');

		if (id) {
			query = query.where('f.id', id);
		}

		return query.cache();
	}
}

module.exports = DatabaseAPI;