import { checkCollectionCounts } from "./collectionCount.js";
import { checkProductCounts } from "./productCount.js";
import { countProductsInCollections } from "./countProductsInCollections.js";

export default {
	async scheduled(event, env, ctx) {
		switch (event.cron) {
			case "5 */1 * * *":
				await checkCollectionCounts(env);
				break;
			case "7 */1 * * *":
				await checkProductCounts(env);
				break;
			case "9 */1 * * *":
				await countProductsInCollections(env);
				break;
		}
	},
};
