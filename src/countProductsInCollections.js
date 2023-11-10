export async function countProductsInCollections(env) {
	const shopifyAdminEndpoint = env.SHOPIFY_ADMIN_ENDPOINT;
	const shopifyAdminToken = env.SHOPIFY_ADMIN_TOKEN;
	const productsCountShopifyEndpoint = `${shopifyAdminEndpoint}products/count.json`;
	const nacelleEndpoint = env.NACELLE_ENDPOINT;
	const sourceEntryIds = [];
	const shopifyData = await fetchDataFromShopify(productsCountShopifyEndpoint, shopifyAdminToken, sourceEntryIds);
	const nacelleData = await fetchDataFromNacelle(nacelleEndpoint, sourceEntryIds);
	const comparisonResult = await compareData(shopifyData, nacelleData);
	for (const result of comparisonResult) {
		if (comparisonResult) {
			await sendSlackMessage(env, result.message);
		}
	}

	return new Response("Monitoring check complete!", { status: 200 });
}

async function fetchDataFromNacelle(endpoint, sourceEntryIds) {
	const query = `query collectionQuery {
    allProductCollections(filter: {sourceEntryIds: ${JSON.stringify(sourceEntryIds)}}) {
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
		method: "POST",
		headers: {
			"Content-Type": "application/json",
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

async function fetchDataFromShopify(endpoint, token, sourceEntryIds) {
	const dataArr = [];
	for (const collection of sourceEntryIds) {
		let collectionId = collection.split("/").pop();
		let url = `${endpoint}?status=active&collection_id=${collectionId}`;
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"X-Shopify-Access-Token": token,
			},
		});
		const data = await response.json();
		const sourceEntryId = collection;
		const count = data.count;
		dataArr.push({ sourceEntryId, count });
	}
	return dataArr;
}

async function compareData(data1, data2) {
	function compare(a, b) {
		if (a.sourceEntryId < b.sourceEntryId) {
			return -1;
		}
		if (a.sourceEntryId > b.sourceEntryId) {
			return 1;
		}
		return 0;
	}
	data1.sort(compare);
	data2.sort(compare);
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
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: "Data Checker",
					emoji: true,
				},
			},
			{
				type: "section",
				text: {
					type: "mrkdwn",
					text: message,
				},
			},
		],
	};

	await fetch(slackWebhookUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
}
