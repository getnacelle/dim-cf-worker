export async function checkProductCounts(env) {
	const shopifyAdminEndpoint = env.SHOPIFY_ADMIN_ENDPOINT;
	const shopifyAdminToken = env.SHOPIFY_ADMIN_TOKEN;
	const productsCountShopifyEndpoint = `${shopifyAdminEndpoint}products/count.json?status=active`;
	const nacelleEndpoint = env.NACELLE_ENDPOINT;
	const shopifyData = await fetchDataFromShopify(productsCountShopifyEndpoint, shopifyAdminToken);
	const nacelleData = await fetchDataFromNacelle(nacelleEndpoint);
	const comparisonResult = compareData(shopifyData, nacelleData);

	if (comparisonResult) {
		await sendSlackMessage(env, comparisonResult.message);
	}

	return new Response('Monitoring check complete!', { status: 200 });
}

async function fetchDataFromNacelle(endpoint) {
	const query = `query productsQuery($filter: ProductFilterInput) {
    allProducts(filter: $filter) {
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
	const totalCount = data.allProducts.totalCount;
	return totalCount;
}

async function fetchDataFromShopify(endpoint, token) {
	const response = await fetch(endpoint, {
		method: 'GET',
		headers: {
			'X-Shopify-Access-Token': token,
		},
	});
	const data = await response.json();
	const count = data.count;
	return count;
}

function compareData(data1, data2) {
	if (JSON.parse(data1) === JSON.parse(data2)) {
		return { isDifferent: false, message: 'Product count matches.' };
	}

	return {
		isDifferent: true,
		message: `Product count is different.`,
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
