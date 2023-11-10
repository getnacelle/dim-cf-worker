export async function countProductsInCollections(env) {
	const shopifyAdminEndpoint = env.SHOPIFY_ADMIN_ENDPOINT;
	const shopifyAdminToken = env.SHOPIFY_ADMIN_TOKEN;
	const productsCountShopifyEndpoint = `${shopifyAdminEndpoint}products/count.json`;
	const nacelleEndpoint = env.NACELLE_ENDPOINT;
	const sourceEntryIds = `[
		"gid://shopify/Collection/392536719618",
		"gid://shopify/Collection/392536785154",
		"gid://shopify/Collection/392536850690",
		"gid://shopify/Collection/392625717506",
		"gid://shopify/Collection/392666579202",
	]`;
	const shopifyCollectionIds = [392536719618, 392536785154, 392536850690, 392625717506, 392666579202];
	const shopifyData = await fetchDataFromShopify(productsCountShopifyEndpoint, shopifyAdminToken, shopifyCollectionIds);
	const nacelleData = await fetchDataFromNacelle(nacelleEndpoint, sourceEntryIds);
	const comparisonResult = await compareData(shopifyData, nacelleData);

	for (const result of comparisonResult) {
		if (comparisonResult) {
			await sendSlackMessage(env, result.message);
		}
	}

	return new Response('Monitoring check complete!', { status: 200 });
}

async function fetchDataFromNacelle(endpoint, sourceEntryIds) {
	const query = `query collectionQuery {
    allProductCollections(filter: {sourceEntryIds: ${sourceEntryIds}}) {
      edges {
				node {
          sourceEntryId
					productConnection {
						totalCount
					}
					content {
						handle
					}
        }
			}
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
	const newDataArray = data.allProductCollections.edges.map((edge) => ({
		sourceEntryId: edge.node.sourceEntryId,
		count: edge.node.productConnection.totalCount,
		handle: edge.node.content.handle,
	}));

	return newDataArray;
}

async function fetchDataFromShopify(endpoint, token, collections) {
	const dataArr = [];
	for (const collectionId of collections) {
		const url = `${endpoint}?status=active&collection_id=${collectionId}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'X-Shopify-Access-Token': token,
			},
		});
		const data = await response.json();
		const sourceEntryId = `gid://shopify/Collection/${collectionId}`;
		const count = data.count;
		dataArr.push({ sourceEntryId, count });
	}
	return dataArr;
}

async function compareData(data1, data2) {
	const result = [];
	for (let i = 0; i < data1.length; i++) {
		const entry1 = data1[i];
		const entry2 = data2[i];
		if (entry1.count === entry2.count) {
			result.push({
				isDifferent: false,
				message: `Collection count for collection handle "${entry2.handle}" matches.`,
			});
		} else {
			result.push({
				isDifferent: true,
				message: `Collection count for collection handle "${entry2.handle}" is different. Shopify: ${entry1.count}, Nacelle: ${entry2.count}`,
			});
		}
	}
	return result;
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
