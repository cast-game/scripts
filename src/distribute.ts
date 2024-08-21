import { formatEther } from "viem";
import { prisma } from "./utils/prisma";
import { client } from "./utils/viem";
import { handleScoresData, queryData } from "./utils/api";
import { fetchQuery, init } from "@airstack/node";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.AIRSTACK_API_KEY || !process.env.NEYNAR_API_KEY) {
	throw new Error("Please set environment variables");
}
init(process.env.AIRSTACK_API_KEY, "dev");

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

const main = async () => {
	const round = await prisma.round.findFirst();
	const contractAddress = round?.contractAddress;

	const rewardPool = await client.getBalance({
		address: contractAddress as `0x${string}`,
	});

	const firstReward = (rewardPool * 50n) / 100n;
	const secondReward = (rewardPool * 30n) / 100n;
	const thirdReward = (rewardPool * 20n) / 100n;

	const rewards = [firstReward, secondReward, thirdReward];

	const allTickets = await queryData(`{
    tickets {
      items {
        id
      }
    }
  }`);

	const castsHashes = allTickets.tickets.items.map((ticket: any) => ticket.id);
	const scoresQuery = await fetchQuery(`{
    FarcasterCasts(
      input: {filter: {hash: {_in: ${JSON.stringify(
				castsHashes
			)}}}, blockchain: ALL}
    ) {
      Cast {
        hash
        castValue {
          formattedValue
        }
      }
    }
  }`);
	const scoresData = handleScoresData(scoresQuery.data.FarcasterCasts.Cast);
	const winnersData = scoresData
		.sort((a: any, b: any) => Number(b.score) - Number(a.score))
		.slice(0, 3);
	const winnerCastsHashes = winnersData.map((winner: any) => winner.hash);

	let reqs = [
		neynar.fetchBulkCasts(winnerCastsHashes),
		...winnerCastsHashes.map((hash: string) =>
			queryData(`{
      users(where: { id_ends_with: "${hash}" }) {
        items {
          id
          ticketBalance
        }
      }
    }`)
		),
	];

	const [castsRes, ...users] = await Promise.all(reqs);

	const winnerCasts = winnerCastsHashes.map((hash: string, index: number) => {
		const cast = castsRes.result.casts.find((cast: any) => cast.hash === hash);
		const userGroup = users.find((userGroup: any) =>
			userGroup.users.items[0].id.endsWith(hash)
		).users.items;

		let supply: number = 0;
		let holders: any[] = [];
		userGroup.forEach((user: any) => {
			if (Number(user.ticketBalance) > 0) {
				supply += Number(user.ticketBalance);
				holders.push({
					address: user.id.split(":")[0],
					balance: Number(user.ticketBalance),
				});
			}
		});

		const castReward = rewards[index];
		const creatorReward = (castReward * 20n) / 100n;
		const holderReward = castReward - creatorReward;

		return { 
			hash, 
			cast, 
			holders, 
			firstBuyer: holders[0], 
			supply,
			castReward,
			creatorReward,
			holderReward
		};
	});

	// Prepare payout parameters
	let winners: string[] = [];
	let amounts: bigint[] = [];

	winnerCasts.forEach((winnerCast: any) => {
		// Add creator to winners
		winners.push(winnerCast.cast.author.verifications[0]);
		amounts.push(winnerCast.creatorReward);

		// Calculate holder rewards
		const totalWeight = winnerCast.supply + 1; // +1 for firstBuyer bonus
		const rewardPerWeight = winnerCast.holderReward / BigInt(totalWeight);

		winnerCast.holders.forEach((holder: any, index: number) => {
			const holderWeight = index === 0 ? holder.balance + 1 : holder.balance; // First buyer gets +1 weight
			const holderReward = rewardPerWeight * BigInt(holderWeight);

			winners.push(holder.address);
			amounts.push(holderReward);
		});
	});

	return { winners, amounts };
};

main()
	.then(({ winners, amounts }) => {
		// Here you would call your contract's payout function with these parameters
		console.log(`Ready to call payout with ${winners.length} winners`);
    console.log("Winners:", winners);
    console.log("Amounts:", amounts.map(amount => formatEther(amount)));
	})
	.catch((error) => {
		console.error("An error occurred:", error);
	})
	.finally(() => prisma.$disconnect());