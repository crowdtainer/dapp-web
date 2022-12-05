<script lang="ts">

export let walletAddress: string;

</script>

<div class="flex justify-center py-3">
	<div class="block p-4 rounded-lg shadow-lg bg-white dark:bg-gray-900 drop-shadow-lg max-w-md mb-2">
		<form action="/deliveryAddressAPI/{walletAddress}" method="POST">
			<p class="py-1 text-lg text-primary">Delivery address</p>

            <!-- Country -->
			<div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">Country</span>
					<input
						type="text"
						name="country"
                        disabled
						class="text-input-form"
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
						name="firstName"
						class="text-input-form"
					/>
				</div>
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">Last name</span>
					<input
						type="text"
						name="lastName"
						class="text-input-form"
					/>
				</div>
			</div>

            <!-- Address -->
            <div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">Address</span>
					<input
						type="text"
						name="address"
						class="text-input-form"
					/>
				</label>
			</div>

            <div class="form-group mb-2">
				<label class="block">
					<span class="text-secondary text-sm">House number, apartment number or other (optional)</span>
					<input
						type="text"
						name="addressComplement"
						class="text-input-form"
					/>
				</label>
			</div>

            <!-- Postal code / City -->
			<div class="grid grid-cols-2 gap-4">
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">Postal code</span>
					<input
						type="text"
						name="postalCode"
						class="text-input-form"
					/>
				</div>
				<div class="form-group mb-2">
                    <span class="text-secondary text-sm">City</span>
					<input
						type="text"
						name="city"
						class="text-input-form"
					/>
				</div>
			</div>

            <p class="py-1 text-lg text-primary">Contact information</p>
			<div class="form-group mb-2">
                <span class="text-secondary text-sm">Email for Invoice</span>
				<input
					type="email"
					name="email"
					class="text-input-form"
				/>
			</div>

            <div class="flex justify-center">
            <button
				type="submit"
				class="sky-btn w-68">Complete order</button
			>
        </div>
		</form>
	</div>
</div>
