/**
 *
 * @param {Array} data an array of the data to parse
 */
function playgroundDataParser(data) {
	return data.map((val) => {
		const filteredCtgIds = Array.from(new Set(JSON.parse(val.category_ids)));
		const filteredCtgNames = Array.from(new Set(JSON.parse(val.category_names)));
		const filteredFacIds = Array.from(new Set(JSON.parse(val.facility_ids)));
		const filteredFacNames = Array.from(new Set(JSON.parse(val.facility_names)));
		console.log(val.playground_id, filteredCtgIds, 'f', filteredFacIds);
		const obj = {
			id: val.playground_id,
			name: val.playground_name,
			description: val.playground_description,
			location: {
				address: {
					formatted: val.playground_address,
				},
				geocoordinates: {
					latitude: val.playground_latitude,
					longtitude: val.playground_longtitude,
				},
				plus_code: val.playground_plus_code,
				place_id: val.playground_place_id,
			},
			categories: filteredCtgIds.map((id, i) => ({
				id,
				name: filteredCtgNames[i],
			})),
			facilities: filteredFacIds.map((id, i) => ({
				id,
				name: filteredFacNames[i],
			})),
			addedby: {
				id: val.user_id,
				username: val.user_username,
				name: val.user_name,
				email: val.user_email,
				role: val.user_role,
			},
		};
		console.log(obj);
		return obj;
	});
}

function categoryDataParser(data) {
	return data.map(val => ({
		id: val.category_id,
		name: val.category_name,
	}));
}

function facilityDataParser(data) {
	return data.map(val => ({
		id: val.facility_id,
		name: val.facility_name,
	}));
}

module.exports = { playgroundDataParser, categoryDataParser, facilityDataParser };