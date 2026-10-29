# Build X: first-prize strategy

Research date: **29 October 2026**. Status: researched plan; no product built, deployed, submitted, or commercially validated.

**Recommended lead: ExitOS — verified recovery access for X Layer applications.** Prepare a small, approved recovery interface before an incident; users can open it and perform a supported withdrawal when the application's usual website is unavailable. The first demonstrator should support one Aave V3 X Layer supply position with no outstanding debt, subject to fork and wallet feasibility checks.

The memorable demonstration is: **ordinary website unavailable → open prepared recovery interface → inspect the approved release and withdrawal → sign with the user's wallet → confirm assets received.** An additional tampered-release demonstration shows rejection before execution. Both failures are controlled demo scenarios, clearly disclosed.

This is a first-prize-oriented recommendation, not a guaranteed outcome. It combines the practical onboarding emphasis of previous grand-prize winners, the resilience pattern demonstrated by NoNet, and TapeOut's verifiable frontend capabilities. The defensible product is the complete recovery workflow, release verification and recurring drills. Basic decentralized hosting already exists.

## Read the package

- [Research and winner comparison](RESEARCH.md): 14 award-verified precedents, pain/event relevance, engineering lessons, competing ecosystem projects and candidate ranking.
- [OnchainOS findings](ONCHAINOS.md): capability inventory, X Layer support, payments, API limits, trust boundaries and sample-code problems.
- [Build plan](BUILD-PLAN.md): architecture, precise circuit use, MVP, validation gates, distribution, revenue hypotheses, schedule and three-minute demo.
- [Evidence and unresolved questions](EVIDENCE.md): read-only chain checks, source quality, addresses and limits of verification.

## What the competition actually rewards

This is one competition with broad eligible directions; the published materials do not establish separate scored tracks. Plan around user value, innovation, meaningful ecosystem integration, completeness and the demo. A complete customer workflow can cover apps, tools and circuits without accumulating unrelated features. [Official event](https://web3.okx.com/xlayer/build-x-series).

The first prize is **20,000 USDT** within a **100,000 USDT** pool. Payment is staged against later development milestones. The provisional deadline is **7 December 2026, 23:59 UTC**. The linked form imposes **four members maximum** and **a three-minute maximum video**, with possible disqualification for longer videos. Plan to submit on 4 December. Shortlisted teams attend offline Demo Day; its location and timing remain unconfirmed. [Submission form](https://docs.google.com/forms/d/e/1FAIpQLScyVnDmyzxRyBxszLUWbwV5kVbpmZJ3JS6oyOxqjALRvhR1kg/viewform).

## Build one coherent product

| Component | Customer value | Integration |
|---|---|---|
| Recovery interface | Complete a supported withdrawal during a frontend outage | DeWEB on X Layer; TapeKit verification |
| Approved release identity | Recognize the release prepared before the incident | Pinned manifest and immutable release records |
| Release approval gate | Enforce publisher and reviewer approval of new release commitments | Small TapeOut circuit consumed by a registry contract |
| Prepared transaction adapter | Inspect the actual destination, recipient and amount | Direct X Layer RPC and existing wallet |
| Readiness dashboard and drills | Keep the recovery route usable as contracts and wallets change | Optional OnchainOS balances/history; ordinary backend |
| Service billing | Charge protocol teams for integration and recurring maintenance | Optional OnchainOS payments, after access checks |

Circuit policy inputs must come from authenticated approvals; a circuit cannot establish that unauthenticated claims are true. OnchainOS is useful supporting infrastructure. Its use alone does not establish hackathon eligibility.

## The first three days decide whether to commit

1. Demonstrate wallet signing from an appropriate DeWEB origin. TapeKit's preview iframe cannot connect wallets.
2. Establish usable RPC access from two demonstrably independent operators. Two OKX domains count as one operator. The dRPC endpoint failed with HTTP 403 here.
3. Run the chosen withdrawal adapter on a pinned X Layer fork, including rejection cases. No live withdrawal was attempted in this research.
4. Interview protocol maintainers and obtain one concrete pilot commitment. Establish why their current IPFS, backup URL or direct-contract workflow is insufficient.

If customer interviews support release maintenance but not recovery actions, narrow to **ReleaseKit**, a verified release-and-drill service using the same core. If they support neither, reselect the problem before writing the full product. A working demo cannot substitute for evidence of a buyer.

## Execution assumption

The schedule assumes two engineers with about 25 hours each per week, plus part-time product/design help. Team availability, budget and customer access have not been supplied. A solo build should retain one adapter, one desktop wallet flow and one circuit; drop payment automation, mobile expansion and the second adapter.

The immediate deliverable is a three-day feasibility-and-customer sprint. Build authorization, deployment and external outreach are separate future work; none occurred during this planning task.
