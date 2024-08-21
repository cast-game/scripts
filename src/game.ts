import { PrismaClient } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

function question(query: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(query, resolve);
	});
}

function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
	if (!process.env.NEYNAR_API_KEY) {
		return console.error("Please set NEYNAR_API_KEY environment variable");
	}

	try {
		// Collect round details
		const title = await question("title: ");
		const channelId = await question("channel id: ");
		const contractAddress = await question("contract address: ");
		const start = new Date(
			await question("start time (yyyy-mm-dd hh:mm:ss): ")
		);
		const tradingDurationHours = parseFloat(
			await question("trading time (in hours): ")
		);
		const gameDurationHours = parseFloat(
			await question("total game time (in hours): ")
		);

		const res = await fetch(
			`https://api.neynar.com/v2/farcaster/channel?id=${channelId}`,
			{
				method: "GET",
				headers: {
					accept: "application/json",
					api_key: process.env.NEYNAR_API_KEY,
				},
			}
		);
		const resJson = await res.json();
		const channelUrl = resJson.channel.parent_url;
    
    console.log(resJson.channel);

		// Calculate end dates
		const tradingEnd = addHours(start, tradingDurationHours);
		const gameEnd = addHours(start, gameDurationHours);

		// Delete existing Round (if any)
		await prisma.round.deleteMany();

		// Create new Round
		const newRound = await prisma.round.create({
			data: {
				id: 1,
				title,
				channelId,
				contractAddress,
				channelUrl,
				tradingEnd,
				gameEnd,
				start,
			},
		});

		console.log("New Round created:", newRound);
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
		rl.close();
	}
}

main();
