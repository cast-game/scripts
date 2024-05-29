import { QueryParameter, DuneClient } from "@duneanalytics/client-sdk";

const client = new DuneClient(process.env.DUNE_API_KEY ?? "");

// in $DEGEN
const priceTiers = [
	{
		startingPrice: 25, // $0.50
		priceAt50: 4000, // $80
	},
	{
		startingPrice: 50, // $1
		priceAt50: 5000, // $100
	},
	{
		startingPrice: 200, // $4
		priceAt50: 10000, // $200
	},
	{
		startingPrice: 350, // $7
		priceAt50: 12500, // $250
	},
	{
		startingPrice: 500, // $10
		priceAt50: 17500, // $350
	},
];

// fix this
const getTierByFID = async (fid: number): Promise<string | null> => {
	const queryId = 3420371; // Your query ID
	const params = {
		query_parameters: [QueryParameter.text("FID", fid.toString())],
	};

	try {
		const executionResult = await client.runQuery({
			queryId,
			query_parameters: params.query_parameters,
		});
		if (executionResult.result?.rows?.length) {
			const row = executionResult.result.rows[0];
			return row.fid_active_tier_name as any;
		} else {
			console.log("No data found for the given FID.");
			return null;
		}
	} catch (error) {
		console.error("Error running query:", error);
		return null;
	}
};

function getPrice(tier: number, supply: number, amount: number): number {
	const priceTier = priceTiers[tier];
	const growthRate =
		Math.log(priceTier.priceAt50 / priceTier.startingPrice) / 50;
	const newSupply = supply + amount;
	const pricePerShare =
		priceTier.startingPrice * Math.exp(growthRate * newSupply);

	return Math.ceil(pricePerShare * amount);
}

// Function to log the first 50 steps and their corresponding prices
function logFirst50Steps() {
	for (let step = 0; step < 50; step++) {
		const price = getPrice(3, step, 1);
		console.log(`Step ${step + 1}: Price per share = ${price.toFixed(2)}`);
	}
}

console.log(await getTierByFID(191274));

// console.log(
// 	await getStartingPriceFromSCS(25),
// 	await getStartingPriceFromSCS(200),
// 	await getStartingPriceFromSCS(300),
// 	await getStartingPriceFromSCS(450)
// );
