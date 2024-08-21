export const apiEndpoint = "https://api-production-c6c20.up.railway.app/";

export const queryData = async (query: string) => {
	const res = await fetch(apiEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({ query }),
	});
	const { data } = await res.json();

	return data;
};

export const handleScoresData = (data: any) =>
	data.map((cast: any) => {
		const score =
			cast.castValue.formattedValue > 10
				? Math.ceil(cast.castValue.formattedValue)
				: cast.castValue.formattedValue.toFixed(2);

		return {
			hash: cast.hash,
			score,
		};
	});
