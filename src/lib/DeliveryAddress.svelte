<div class="flex justify-center py-3">
	<div class="block p-4 rounded-lg shadow-lg bg-white dark:bg-gray-900 drop-shadow-lg max-w-md mb-2">
		<form>

			<p class="py-1 text-lg text-primary">Delivery address</p>

            <!-- Country -->
			<div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">Country</span>
					<input
						type="text"
                        disabled
						class="text-input-form"
						id="exampleInput123"
						aria-describedby="emailHelp123"
						placeholder="Country"
						value="Germany"
					/>
				</label>
			</div>

            <!-- Name -->
			<div class="grid grid-cols-2 gap-4">
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">First Name</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput123"
						aria-describedby="emailHelp123"
					/>
				</div>
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">Last name</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput124"
						aria-describedby="emailHelp124"
					/>
				</div>
			</div>

            <!-- Address -->
            <div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">Address</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput123"
						aria-describedby="emailHelp123"
					/>
				</label>
			</div>

            <div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">House number, apartment number or other (optional)</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput123"
						aria-describedby="emailHelp123"
					/>
				</label>
			</div>

            <!-- Postal code / City -->
			<div class="grid grid-cols-2 gap-4">
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">Postal code</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput123"
						aria-describedby="emailHelp123"
					/>
				</div>
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">City</span>
					<input
						type="text"
						class="text-input-form"
						id="exampleInput124"
						aria-describedby="emailHelp124"
					/>
				</div>
			</div>

            <p class="py-1 text-lg text-primary">Contact information</p>
			<div class="form-group mb-2">
                <span class="text-secondary text-sm">Email for Invoice</span>
				<input
					type="email"
					class="text-input-form"
					id="exampleInput125"
				/>
			</div>


			<!-- <button
				type="submit"
				class="
        w-full
        px-6
        py-2.5
        bg-blue-600
        text-white
        font-medium
        text-xs
        leading-tight
        uppercase
        rounded
        shadow-md
        hover:bg-blue-700 hover:shadow-lg
        focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0
        active:bg-blue-800 active:shadow-lg
        transition
        duration-150
        ease-in-out">Complete order</button
			> -->
            <div class="flex justify-center">
            <button
				type="submit"
				class="sky-btn w-68">Complete order</button
			>
        </div>
		</form>
	</div>
</div>
