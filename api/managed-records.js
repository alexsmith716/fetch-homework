import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

// offset-based pagination
// returning chunks of 10 & starting page offset of 1 (page 1 => 1-10, page 2 => 11-20, page 3 => 21-30)
// each page fetch has an offset that equals the sum of the previous offset value and limit
const returnUriWithQueryString = (page, colors) => {
	let queryStringParams = {
		limit: 11,
		offset: (page - 1) * 10,
		'color[]': colors,
	};
	// URI Constructor with added query via search() method
	return new URI(window.path).search(queryStringParams);
};

// accumulator "a" has the initial value [], and "x" has the value pageObjects[0]
// function returns array "open" which contains all items with disposition value "open" and adds fourth key "isPrimary"
const reduceOpenItems = pageObjects => {
	const items = pageObjects.reduce((a, x) => {
		if (x.disposition === 'open') {
			x.isPrimary = ['red', 'blue', 'yellow'].includes(x.color)
			a.push(x)
		}
		return a;
	}, []);
	return items;
};

// accumulator "a" has the initial value 0, and "x" has the value pageObjects[0].disposition
const reduceClosedPrimaryCount = pageObjects => {
	const items = pageObjects.reduce((a, x) => {
		x.disposition === 'closed' && ['red', 'blue', 'yellow'].includes(x.color) ? a += 1 : null;
		return a;
	}, 0);
	return items;
};

const retrieve = ({ page = 1, colors = [] } = {}) => {

	// request data from the /records endpoint
	return fetch(returnUriWithQueryString(page, colors))
		.then(response => {
			if (response.status >= 200 && response.status <= 299) {
				return response.json();
			} else {
				throw new Error(response.statusText);
			}
		})
		.then(data => {
			// subarray the response to adjust for the extra 1 item requested (option 1 below)
			const pageObjects = data.slice(0, 10);

			// options for handling 'nextPage' from result (since API does not provide a total item count):
			//	1) always request 1 more on endpoint option 'limit' and test its length
			//	2) always make one last extra request and test that empty array
			// successful API response, transform fetched payload into an object with required keys
			return {
				previousPage: page === 1 ? null : page - 1,
				nextPage: (data.length > 10) ? page + 1 : null,
				ids: pageObjects.map((item) => item.id),
				open: reduceOpenItems(pageObjects),
				closedPrimaryCount: reduceClosedPrimaryCount(pageObjects),
			};
		})
		.catch(error => {
			console.log(error);

			// failed API response, recover with an object with required keys nulled
			return {
				previousPage: null,
				nextPage: null,
				ids: [],
				open: [],
				closedPrimaryCount: 0,
			};
		});
};

export default retrieve;
