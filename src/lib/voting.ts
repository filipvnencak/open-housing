import { createHash } from "crypto";
import type { VoteWithShare, VotingMethod, VotingResults } from "@/types";

function getWeight(vote: VoteWithShare, method: VotingMethod): number {
  switch (method) {
    case "per_flat":
      return 1;
    case "per_area":
      return vote.area ?? 1;
    case "per_share":
    default:
      return vote.shareNumerator / vote.shareDenominator;
  }
}

export function calculateResults(
  votes: VoteWithShare[],
  method: VotingMethod = "per_share"
): VotingResults {
  let zaWeight = 0;
  let protiWeight = 0;
  let zdrzalSaWeight = 0;
  let totalWeight = 0;

  for (const vote of votes) {
    const weight = getWeight(vote, method);
    totalWeight += weight;
    if (vote.choice === "za") zaWeight += weight;
    if (vote.choice === "proti") protiWeight += weight;
    if (vote.choice === "zdrzal_sa") zdrzalSaWeight += weight;
  }

  return {
    za: zaWeight,
    proti: protiWeight,
    zdrzalSa: zdrzalSaWeight,
    total: totalWeight,
    zaPercent: totalWeight > 0 ? (zaWeight / totalWeight) * 100 : 0,
    protiPercent: totalWeight > 0 ? (protiWeight / totalWeight) * 100 : 0,
    zdrzalSaPercent: totalWeight > 0 ? (zdrzalSaWeight / totalWeight) * 100 : 0,
    passed: zaWeight > totalWeight / 2,
  };
}

export function generateAuditHash(
  votingId: string,
  ownerId: string,
  choice: string,
  timestamp: Date
): string {
  const data = `${votingId}${ownerId}${choice}${timestamp.toISOString()}`;
  return createHash("sha256").update(data).digest("hex");
}
