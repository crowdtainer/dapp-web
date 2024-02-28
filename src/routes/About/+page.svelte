<script lang="ts">
	import CrowdtainerLogo from '$lib/images/site/CrowdtainerLogo.svg';
	import SplitPayment from '$lib/images/site/splitPayment.webp';
</script>

<div class="flex justify-center">
	<a class="link" href="https://crowdtainer.io">
		<img class="lg:h-32 md:h-28 h-20 mt-16" alt="Crowdtainer Logo" src={CrowdtainerLogo} />
	</a>
</div>
<div class="flex justify-center mt-20">
	<p class="font-sans text-center dark:text-gray-200 text-xl mb-2 md:mb-0 md:text-2xl">
		<a class="link" href="https://crowdtainer.io">Crowdtainer:</a>
		'<b><u>Crowd</u>funding a con<u>tainer</u></b>'.
	</p>
</div>

<div class="flex flex-center">
	<div class="max-w-lg mx-auto white overflow-hidden md:max-w-7xl px-6 mb-12">
		<div class="prose lg:prose-lg prose-headings:underline prose-a:text-blue-600">
			<article
				class="prose-blockquote:font-text prose-ol:font-text prose-li:font-text prose-p:font-text prose-h2:font-display text-xl"
			>
				<div class="text-gray-900 dark:text-[#C8D1D0]">
					<blockquote class="dark:text-[#C8D1D0]">
						A crowdfunding campaign allows multiple users to contribute to a specific goal set by
						the project creator. If the goal is met or exceeded by the end of the campaign, the
						project creator withdraws the funds and applies them to the proposed goal. Conversely,
						if the goal is not met, all users who have contributed can withdraw their contribution.
					</blockquote>

					<p class="py-6">
						Typically, crowdfunding campaigns are run, operated, and promoted by third party
						companies that holds the participants' funds while the campaign is running.
					</p>
					<p class="lead dark:text-gray-300">
						Crowdtainer, on the other hand, is an <a
							class="link"
							href="https://github.com/crowdtainer">open source</a
						> software kit that allows the campaigner to run a campaign without an intermediary company,
						while still retaining the property that payments are inacessible to the campaigner, until
						the minimum goal is reached.
					</p>
					<p class="py-6">
						Using Ethereum to coordinate a campaign provides a neutral place where these rules can
						be enforced, providing a comparable or better alternative to existing platforms:
					</p>
					<ul>
						<li class="py-4">
							<b>Banks and credit cards are not strictly required.</b> Ethereum
							<a class="link" href="https://eips.ethereum.org/EIPS/eip-20">ERC20</a> tokens are used
							as a medium of payment. Costs are per transaction, not a percentage. <b>Less fees</b>
							for intermediaries means <b>more</b> is available for the campaign goal.
						</li>
						<li class="py-4">
							<b>Optional, transparent & fair referral system.</b> Backers can share the campaign with
							their networks and get discounts that increases as more people join the campaign, creating
							a sense of community and shared success. Smart contracts allow the public to view the source
							code and verify that friend referrals are fairly rewarded for both the referee and the
							referrer.
						</li>
						<li class="py-4">
							<b>Improved privacy.</b> Instead of multiple companies receiving sensitive data (such
							as delivery details), only the actual service provider receives what is needed to
							fulfil the agreements. Other ways to improve the status quo in online ordering and
							privacy, such as using
							<a class="link" href="https://en.wikipedia.org/wiki/Zero-knowledge_proof"
								>zero knowledge proofs</a
							>
							to prove participation, become possible.
						</li>
						<li class="py-4">
							<b>Customisable.</b> Allows for creative ideas such as releasing funds only after
							milestones are met, or automatically splitting payment by setting up a
							<a class="link" href="https://github.com/0xSplits/splits-sdk">split contract</a>
							at the recipient address:
							<div class="flex justify-center">
								<img class="dark:invert" alt="Crowdtainer Logo" src={SplitPayment} />
							</div>
						</li>
					</ul>
				</div>
				<p class="lead dark:text-gray-300 py-10">
					Join us in giving diverse small businesses a voice and access to new markets.
				</p>
				<p class="text-center lead dark:text-gray-300 py-10">
					Learn more at <a class="link" href="https://crowdtainer.io">crowdtainer.io</a>
				</p>
			</article>
		</div>
	</div>
</div>
