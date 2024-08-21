const priceTiers = [
	{
		basePrice: 0.0001, // $0.25
		curveExponent: 1.2,
		scaleFactor: 0.00015,
	},
	{
		basePrice: 0.0002, // $0.50
		curveExponent: 1.25,
		scaleFactor: 0.00015,
	},
	{
		basePrice: 0.0004, // $1
		curveExponent: 1.3,
		scaleFactor: 0.00015,
	},
	{
		basePrice: 0.0006, // $1.50
		curveExponent: 1.3,
		scaleFactor: 0.0002,
	},
	{
		basePrice: 0.0008, // $2
		curveExponent: 1.35,
		scaleFactor: 0.0002,
	},
];

// Function to get the current price based on supply
function getPrice(tier: number, supply: number): number {
	const { basePrice, curveExponent, scaleFactor } = priceTiers[tier];
	return basePrice + scaleFactor * Math.pow(supply, curveExponent);
}

function getBuyPrice(tier: number, supply: number, amount: number): number {
	let totalPrice = 0;
	for (let i = 0; i < amount; i++) {
		totalPrice += getPrice(tier, supply + i);
	}
	return totalPrice;
}

function getSellPrice(tier: number, supply: number, amount: number): number {
	let totalPrice = 0;
	for (let i = 0; i < amount; i++) {
		totalPrice += getPrice(tier, supply - i - 1);
	}
	return totalPrice * .8;
}

// loop an array of 0 to 50
console.log(
  getPrice(2, 2),
  getSellPrice(2, 2, 1),
  getSellPrice(4, 1, 1)
);
