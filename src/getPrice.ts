const CMC_DEGEN_ID = 30096;

const cmcEndpoint =
	"https://pro-api.coinmarketcap.com/v2/tools/price-conversion";

export const getFiatValue = async (id: number, amount: number) => {
	const query = new URLSearchParams({
		amount: amount.toString(),
		id: id.toString(),
		convert: "USD",
	});

	const res = await fetch(`${cmcEndpoint}?${query}`, {
		headers: {
			"X-CMC_PRO_API_KEY": process.env.CMC_API_KEY!,
		},
	});
	const { data } = await res.json();

	return data.quote.USD.price;
};