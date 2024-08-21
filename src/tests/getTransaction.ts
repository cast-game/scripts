const main = async (transactionId: string, apiKey: string) => {
	const endpoint = `https://api.basescan.org/api?module=transaction&action=gettxreceiptstatus&txhash=${transactionId}&apikey=${apiKey}`;
	const res = await fetch(endpoint);
	console.log(await res.json());
};

main(
	"0x4985209c1a8ac1f7f817fb4c889f5edb53346fced480a96f36d25120f9ac918b",
	process.env.BASESCAN_API_KEY!
);
