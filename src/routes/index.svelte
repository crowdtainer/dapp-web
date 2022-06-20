<svelte:head>
	<title>Crowdtainer</title>
</svelte:head>

<!-- <header class="bg-sky-900 shadow">
  <div class=" mx-auto py-4 px-4 sm:px-6 lg:px-8 ">
    <h1 class="text-center text-xl font-bold text-white">Offers</h1>
  </div>
</header> -->

<header class="bg-black">
	<div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
		<h1 class="text-2xl font-bold text-white">Active</h1>
	</div>
</header>

<main>
	<!-- Project Container start -->
	<div class="max-w-10xl mx-auto py-1 sm:px-6 lg:px-8">
		<div class="max-w-lg mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-7xl my-8">
			<div class="md:flex">
				<div class="md:shrink-0">
					<img
						class="h-48 w-full object-cover md:h-full md:w-96 blur-[3px]"
						src="CoffeeBag.png"
						alt="Coffee"
					/>
				</div>
				<div class="p-8">
					<div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
						Filter Coffee Beans
					</div>
					<a
						href="#"
						class="block mt-1 text-lg leading-tight font-medium text-black hover:underline"
						>COLOMBIA Finca La Esperanza</a
					>
					<p class="mt-5 text-slate-500">
						In the diverse department of Nariño, in the south west of Colombia, bordering Ecuador
						and the Pacific Ocean, there is a municipality named Consacá. In the vereda (or
						township) of La Aguada, Jesús Ignacio Paredes cultivates approximately one hectare made
						up of three separate plots named La Esperanza.
					</p>
					<p class="mt-5 text-slate-500">
						Jesús Ignacio's daily life looks a bit different as we can imagine. The farm where he
						cultivates coffee is within a 20 minute walking distance from the place he lives. So he
						walks to the three plots of land, where his parents taught him everything he needs to
						know to be a successful producer, where his beloved Castillo and Colombia varietals
						grow, protected with a shade from other trees like plantain and citrus fruit trees. The
						crops grow at 1900 m.a.s.l. and he makes sure they are cared for.
					</p>
					<div class="">
						<p class="my-3"><b>Service provider:</b> 0xa4b4433567777a65s577b655b5</p>
						<p class="my-5"><b>Status:</b> Ongoing / Delivery | <b>Ends in:</b> 42 days</p>
						<p class="my-5"><b>Start:</b> 23/06/2022 - <b>End:</b> 23/08/2022</p>
						<div class="flex flex-wrap ml-0 mr-2">
							<p class=""><b>Raised:</b> 53.500,00 USDC</p>
							<div class="ml-2 mr-4 bg-gray-200 rounded-full w-80">
								<div
									class="bg-blue-600 text-xs font-medium text-white text-center p-1 leading-normal rounded-l-full"
									style="width: 25%"
								>
									25%
								</div>
							</div>
						</div>
						<p class="my-3"><b>Minimum goal:</b> 100.000,00 USDC | <b>Maximum goal:</b> 130.000,00 USDC</p>
						<!-- Prices -->
						<div class="flex flex-wrap mb-4">
							<p class="mr-4 "><b>Price</b></p>
							<div>
								<p><b>250g: </b></p>
							</div>
							<div><p class="mx-2 text-green-700">20 USDC (80 USDC/kg)</p></div>
						<!-- </div>
						<div class="flex flex-wrap"> -->
							<div>
								<p><b>| 500g:</b></p>
							</div>
							<div><p class="mx-3 text-green-700">38 USDC (76 USDC/kg)</p></div>
						</div>

						<!-- Order container -->
						<div class=" border-2 rounded border-blue flex justify-center">
							<!-- Products container -->
							<div class=" m-6 border-black ">
								<!-- Product 1 -->
								<div id="container" class="grid grid-cols-6 w-82 m-3">
									<div class="col-span-3"><p class="text-right text-base mr-2 py-1"><b>250g</b> x</p></div>
									<div>
										<button
											type="button"
											class="px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
										>
											-
										</button>
									</div>
									<div class="text-center py-1 pr-1">0</div>
									<div>
										<button
											type="button"
											class="t-2 px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
										>
											+
										</button>
									</div>
								</div>
								<!-- Product 2 -->
								<div id="container" class=" grid grid-cols-6 w-82 m-3">
									<div class="col-span-3"><p class="text-right mr-2 py-1"><b>500g</b> x</p></div>
									<div>
										<button
											type="button"
											class="px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
										>
											-
										</button>
									</div>
									<div class="text-center py-1 pr-1">0</div>
									<div>
										<button
											type="button"
											class="t-2 px-3 py-2 border-2 border-gray-800 text-gray-800 font-medium text-xs leading-tight uppercase rounded hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-0"
										>
											+
										</button>
									</div>
								</div>
								<!-- Summary -->
								<div class="divide-y divide-dashed text-right mr-4 my-2 py-4">
									<p class="text-sm">7% tax (USt.) and shipping included</p>
									<p class="text-sm"><b>(Currently shipping only to Germany)</b></p>
									<p class="text-lg my-4"><b>Summary</b>: 100 DAI</p>
								</div>
								<div class="flex justify-center">
									<button
										type="button"
										class=" border-2 border-black px-16 mt-6 py-4 bg-gray-700 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
									>
										Join
									</button>
									<!-- Legal Disclaimer -->
								</div>
							</div>
						</div>
						<p class="text-sm m-4">
							By clicking on "Join" and cryptographically signing the transaction, I agree to the <b>General Terms and Conditions</b> related to the usage of this webpage.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- Project Container End -->
	<header class="bg-gradient-to-r from-black to-gray-700 shadow">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-white">Upcoming</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-2 sm:px-0">
			<div class="border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-white text-center m-5">More projects coming soon.</p>
			</div>
		</div>
	</div>

	<header class="bg-gradient-to-r from-black to-gray-700 shadow">
		<div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-white">Expired / Previous</h1>
		</div>
	</header>

	<div class="max-w-7xl mx-auto py-6 sm:px-0 lg:px-0">
		<div class="px-2 py-2 sm:px-0">
			<div class="border-2 border-dashed border-gray-200 rounded-lg h-20">
				<p class="text-white text-center m-5">Nothing to see here yet.</p>
			</div>
		</div>
	</div>
</main>
