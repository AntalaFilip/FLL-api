const { AuthenticationError, ApolloError } = require('apollo-server-errors');
const knex = require('../knex');
const { resolveUtils } = require('../utils');
const axios = require('axios').default;
const GoogleGeocodingApi = axios.create({ baseURL: 'https://maps.googleapis.com/maps/api/geocode/json', params: { key: process.env.MAPS_GEOCODING_KEY } });
const { playgroundDataParser } = require('./parsers');

const addPlayground = async (parent, args, context) => {
	if (!context.user) throw new AuthenticationError();
	// TODO: add permission checking

	/**
	 * @type {{name: string, desc: string, ctgIds: number[]}}
	 */
	const { name, description, categoryIds } = args.base;

	// Check if the playground name is available
	const pExists = await resolveUtils.exists({ name }, 'playgrounds');
	if (pExists) throw new ApolloError('A Playground with this name already exists!', 'OBJALREADYEXISTS');

	// TODO: Check if category ID exists

	/**
	 * @type {import('axios').AxiosResponse}
	 */
	let response;
	// Query the Google Maps geocoding API to get complete location data
	if (args.location.address) {
		response = await GoogleGeocodingApi.get('https://maps.googleapis.com/maps/api/geocode/json', { params: { address: args.location.address, type: 'street_address' } });
	}
	else if (args.location.latitude && args.location.longtitude) {
		response = await GoogleGeocodingApi.get('https://maps.googleapis.com/maps/api/geocode/json', { params: { latlng: args.location.latitude + ',' + args.location.longtitude, type: 'street_address' } });
	}
	// If the status is not "OK", throw the appropriate error
	if (response.data.status != "OK") {
		if (response.data.status == "ZERO_RESULTS") throw new ApolloError('The geocoding API returned no results', 'GEONORESULTS');
		else if (response.data.status == "OVER_QUERY_LIMIT") throw new ApolloError('The geocoding API hit its query limit', 'GEOQUERYLIMIT');
		else if (response.data.status == "REQUEST_DENIED") throw new ApolloError('The geocoding API denied this request', 'GEOREQDENIED');
		else if (response.data.status == "INVALID_REQUEST") throw new ApolloError('The geocoding API received an invalid request', 'GEOINVALIDREQ');
		else if (response.data.status == "UNKNOWN_ERROR") throw new ApolloError('The geocoding API encountered an unkown error', 'GEOUNKNWERR');
		else throw new ApolloError('The geocoding API could not be reached', 'GEOUNREACH');
	}

	// Get the first result from the API, if there are more results, the first one will probably be the one we want.
	const result = response.data.results[0];

	// Create an object formatted to comply with db table structure
	const pgdata = {
		name,
		description,
		address: result.formatted_address,
		latitude: result.geometry.location.lat,
		longtitude: result.geometry.location.lng,
		place_id: result.place_id,
		plus_code: result.plus_code ? result.plus_code.global_code : null,
		addedby: context.user.id,
	};

	// Insert the formatted playground data into the table
	const pgid = (await knex.insert(pgdata).into('playgrounds'))[0];

	// Insert all the categories into the table
	await knex.batchInsert('categories_to_playground', categoryIds.map((ctgId) => ({ category_id: ctgId, playground_id: pgid })));

	const playgroundData = (await context.dataSources.database.getPlayground(pgid));
	return playgroundDataParser(playgroundData)[0];
};

module.exports = addPlayground;