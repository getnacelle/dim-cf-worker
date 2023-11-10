export async function checkCollectionCounts(env) {
	const shopifyEndpoint = env.SHOPIFY_ENDPOINT;
	const nacelleEndpoint = env.NACELLE_ENDPOINT;
	const shopifyToken = env.SHOPIFY_STOREFRONT_TOKEN;
	const shopifyData = await fetchDataFromShopify(shopifyEndpoint, shopifyToken);
	const nacelleData = await fetchDataFromNacelle(nacelleEndpoint);
	const comparisonResult = compareData(shopifyData, nacelleData);

	if (comparisonResult) {
		await sendSlackMessage(env, comparisonResult.message);
	}

	return new Response('Monitoring check complete!', { status: 200 });
}

async function fetchDataFromNacelle(endpoint) {
	const query = `query collectionQuery($filter: ProductCollectionFilterInput) {
    allProductCollections(filter: $filter) {
      totalCount
    }
  }`;
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query }),
	});
	const { data } = await response.json();
	const totalCount = data.allProductCollections.totalCount;
	return totalCount;
}

async function fetchDataFromShopify(endpoint, token) {
	const query = `query {
    collections(first: 10) {
      totalCount
    }
  }`;
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Shopify-Storefront-Access-Token': token,
		},
		body: JSON.stringify({ query }),
	});
	const { data } = await response.json();
	const totalCount = data.collections.totalCount;
	return totalCount;
}

function compareData(data1, data2) {
	if (JSON.parse(data1) === JSON.parse(data2)) {
		return { isDifferent: false, message: 'Total collection count matches.' };
	}

	return {
		isDifferent: true,
		message: `Total collection count check failed - reindex recommended`,
	};
}

async function sendSlackMessage(env, message) {
	const slackWebhookUrl = env.SLACK_WEBHOOK_URL;
	const payload = {
		text: message,
	};

	await fetch(slackWebhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
}
