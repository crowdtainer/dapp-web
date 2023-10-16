<script lang="ts">
	import { ethers, BigNumber, type ContractReceipt, type TypedDataDomain } from 'ethers';
	import { onInterval } from './Utils/intervalTimer';

	import type { UserStoreModel } from '$lib/Model/UserStoreModel';
	import {
		checkAllowance,
		fetchUserBalancesData,
		fetchUserNonce,
		getERC20Contract,
		joinProject,
		joinProjectWithSignature
	} from './ethersCalls/rpcRequests';
	import { getSigner, walletState, web3Provider } from './Utils/wallet';

	import ModalDialog, { ModalAnimation, ModalIcon, ModalType } from '$lib/ModalDialog.svelte';
	import { requestAuthorizationProof } from './api.js';
	import { derived, type Readable } from 'svelte/store';
	import { joinSelection } from './Stores/userStore.js';
	import { showToast } from './Toast/ToastStore.js';
	import type { IERC20 } from '../routes/typechain/IERC20.js';
	import type { Result } from '@sniptt/monads';
	import { MessageType } from './Toast/MessageType.js';
	import type { SignedPermitStruct } from '../routes/typechain/Vouchers721.js';
	import { getERC2612Permit } from './TokenUtils/permit.js';

	export let crowdtainerId: number;
	export let chainId: number;
	export let crowdtainerAddress: string | undefined;
	export let vouchers721Address: string | undefined;
	export let tokenAddress: string | undefined;
	export let tokenSymbol: string | undefined;
	export let tokenName: string | undefined;
	export let tokenVersion: string | undefined;
	export let totalSum: number;
	export let tokenDecimals: number;
	export let totalCostInERCUnits: BigNumber;
	export let discountValue: number;
	export let validUserCouponCode: string;
	export let referralCheckBoxActivated: boolean;
	export let actionButtonEnabled: boolean;
	export let productListLength: number;
	export let withSignature: boolean;

	export let modalDialog: ModalDialog;

	export let userJoinedSuccess: () => void;

	const interval = 10000;
	let walletData: UserStoreModel;

	let permitApproveTx: undefined | ethers.ContractTransaction;

	export let refreshWalletData = async () => {
		console.log(`refreshWalletData...`);
		if (crowdtainerAddress) {
			let response = await fetchUserBalancesData(web3Provider, crowdtainerAddress);
			if (response.isOk()) {
				walletData = response.unwrap();
				console.log(
					`crowdtainerAddress: ${crowdtainerAddress} allowance: ${walletData.erc20Allowance}, balance: ${walletData.erc20Balance}`
				);
			} else {
				console.log(`hm, ${response.unwrapErr()}`);
			}
		} else {
			console.log('No crowdtainerAddress defined.');
		}
	};

	onInterval(refreshWalletData, interval);

	type JoinWithSignatureData = {
		signedPayload: string;
		extraData: string;
	};

	async function generateSignedData(
		userWalletAddress: string,
		crowdtainerAddress: string,
		selection: number[],
		couponCode: string,
		referralEnabled: boolean
	): Promise<JoinWithSignatureData> {
		let couponCodeAddress =
			couponCode !== undefined && couponCode !== ''
				? couponCode
				: '0x0000000000000000000000000000000000000000';

		let authorizationResult = await requestAuthorizationProof(
			userWalletAddress,
			crowdtainerAddress,
			selection,
			referralEnabled,
			couponCodeAddress
		);

		if (authorizationResult.isErr()) {
			console.log(`Error: ${authorizationResult.unwrapErr()}`);
			modalDialog.show({
				id: 'txRejected',
				type: ModalType.ActionRequest,
				title: 'Transaction rejected',
				body: `An error ocurred when joining the project: ${authorizationResult.unwrapErr()}`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});
			actionButtonEnabled = true;
		}

		let [calldata, signedPayload] = authorizationResult.unwrap();
		console.log(`Calldata: ${calldata}; \nsignedPayload: ${signedPayload}`);

		let crowdtainerExtraData = ethers.utils.defaultAbiCoder.encode(
			['address', 'uint256[]', 'bool', 'address'],
			[userWalletAddress, selection, referralEnabled, couponCodeAddress]
		);
		let extraData = ethers.utils.defaultAbiCoder.encode(
			['address', 'bytes4', 'bytes'],
			[crowdtainerAddress, ethers.utils.hexlify('0x566a2cc2'), crowdtainerExtraData]
		);

		return { signedPayload, extraData };
	}

	const callJoinProject = async (
		withSignature: boolean,
		withPermitValue: BigNumber | undefined
	) => {
		let userWallet = getSigner();

		if (
			!crowdtainerAddress ||
			!vouchers721Address ||
			!tokenName ||
			!tokenVersion ||
			!tokenAddress
		) {
			console.log(
				'Error: missing required data (crowdtainerAddress || vouchers721Address || tokenName || tokenVersion || tokenAddress)'
			);
			console.log(
				`${crowdtainerAddress}:${vouchers721Address}:${tokenName}:${tokenVersion}:${tokenAddress}`
			);
			return;
		}

		modalDialog.show({
			id: 'joinProject',
			title: 'Join project',
			type: ModalType.ActionRequest,
			icon: ModalIcon.DeviceMobile,
			body: 'Please sign the transaction from your wallet.',
			animation: ModalAnimation.Circle2
		});

		actionButtonEnabled = false;

		if (userWallet === undefined) {
			showToast('Error: Missing signer.', MessageType.Warning);
			return;
		}

		let userWalletAddress = await userWallet.getAddress();
		if (!userWalletAddress || userWalletAddress === '') {
			console.log(`Unable to get wallet signer address.`);
			return;
		}

		console.log(`userWalletAddress: ${userWalletAddress}`);

		let joinTransaction: Result<ethers.ContractTransaction, string>;

		console.log(
			`Join parameters: vouchers721Address: ${vouchers721Address}; crowdtainerAddress ${crowdtainerAddress};validUserCouponCode:${validUserCouponCode}, referralEnabled: ${referralCheckBoxActivated} `
		);
		console.log(`Selection: ${$selection}`);
		if (!withPermitValue) {
			if (withSignature) {
				let result = await generateSignedData(
					userWalletAddress,
					crowdtainerAddress,
					$selection,
					validUserCouponCode,
					referralCheckBoxActivated
				);

				joinTransaction = await joinProjectWithSignature(
					userWallet,
					vouchers721Address,
					crowdtainerAddress,
					result.signedPayload,
					result.extraData,
					undefined
				);
			} else {
				joinTransaction = await joinProject(
					userWallet,
					vouchers721Address,
					crowdtainerAddress,
					$selection,
					validUserCouponCode && ethers.utils.isAddress(validUserCouponCode)
						? validUserCouponCode
						: '0x0000000000000000000000000000000000000000',
					referralCheckBoxActivated,
					undefined
				);
			}
		} else {
			// with permit/allowance
			let nonceResult = await fetchUserNonce(web3Provider, tokenAddress);
			if (nonceResult.isErr()) {
				console.log(`Unable to fetch the current nonce: ${nonceResult.unwrapErr()}`);
				showToast('Operation failed: Unable to fetch the current nonce.');
				modalDialog.show({
					id: 'txRejected',
					type: ModalType.ActionRequest,
					title: 'Transaction rejected',
					body: `An error ocurred when joining the project. ${nonceResult.unwrapErr()}`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				});
				actionButtonEnabled = true;
				return;
			}

			let signedPermit: SignedPermitStruct;
			try {
				let expirationInSeconds = (new Date().getTime() / 1000 + 30 * 60).toFixed(0); // 30 minutes from now
				signedPermit = await getERC2612Permit(
					userWallet,
					tokenName,
					tokenVersion,
					BigNumber.from(chainId),
					tokenAddress,
					userWalletAddress,
					crowdtainerAddress,
					withPermitValue,
					nonceResult.unwrap(),
					BigNumber.from(expirationInSeconds)
				);
			} catch (error) {
				modalDialog.show({
					id: 'txRejected',
					type: ModalType.ActionRequest,
					title: 'Transaction rejected',
					body: `An error ocurred when getting allowance signature.`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				});
				actionButtonEnabled = true;
				return;
			}

			if (withSignature) {
				let result = await generateSignedData(
					userWalletAddress,
					crowdtainerAddress,
					$selection,
					validUserCouponCode,
					referralCheckBoxActivated
				);
				joinTransaction = await joinProjectWithSignature(
					getSigner(),
					vouchers721Address,
					crowdtainerAddress,
					result.signedPayload,
					result.extraData,
					signedPermit
				);
			} else {
				joinTransaction = await joinProject(
					getSigner(),
					vouchers721Address,
					crowdtainerAddress,
					$selection,
					validUserCouponCode && ethers.utils.isAddress(validUserCouponCode)
						? validUserCouponCode
						: '0x0000000000000000000000000000000000000000',
					referralCheckBoxActivated,
					signedPermit
				);
			}
		}

		if (joinTransaction.isErr()) {
			let errorString = joinTransaction.unwrapErr();
			let errorDescription =
				errorString.includes('Unknown') || errorString.includes('{}') || errorString.length === 0
					? ''
					: `\n\n Details: ${errorString}`;
			modalDialog.show({
				id: 'txRejected',
				type: ModalType.ActionRequest,
				title: 'Transaction rejected',
				body: `An error ocurred when joining the project. ${errorDescription}`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});

			console.log(`${joinTransaction.unwrapErr()}`);
			actionButtonEnabled = true;
			return;
		}

		modalDialog.show({
			id: 'joinProjectConfirmationWait',
			type: ModalType.ActionRequest,
			title: 'Join project',
			body: 'Waiting for transaction confirmation..',
			icon: ModalIcon.None,
			animation: ModalAnimation.Diamonds
		});
		let txResult = await joinTransaction.unwrap().wait();
		modalDialog.close();

		if (txResult.status !== 1) {
			modalDialog.show({
				id: 'joinProjectConfirmation',
				type: ModalType.Information,
				title: 'Join project failed',
				body: `The transaction to join the campaing failed.`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});
			return;
		}

		// TODO: check side-effects
		actionButtonEnabled = true;
		let noSelection = Array(productListLength).fill(0);
		$joinSelection.set(crowdtainerId, noSelection);

		userJoinedSuccess();
	};

	const callApproveSpending = async () => {
		if (!crowdtainerAddress) {
			console.log('Error: missing required data (crowdtainerAddress)');
			return;
		}

		let erc20ContractResult = await getERC20Contract(getSigner(), crowdtainerAddress);
		let erc20Contract: IERC20;

		if (erc20ContractResult.isErr()) {
			showToast('Error connecting to ERC20 contract. Internet down?', MessageType.Warning);
			console.log(erc20ContractResult.unwrapErr());
			return;
		} else {
			erc20Contract = erc20ContractResult.unwrap();
		}

		let accountAddress = $walletState.account;
		if (
			erc20Contract === undefined ||
			accountAddress === undefined ||
			crowdtainerAddress === undefined
		) {
			console.log('A required object is undefined');
			// TODO: Show UI dialog
			return;
		}

		modalDialog.show({
			id: 'walletApproval',
			type: ModalType.ActionRequest,
			title: 'Wallet approval',
			body: `Please approve the spending of ${
				totalSum - discountValue
			} ${tokenSymbol} to Crowdtainer from your wallet.`,
			icon: ModalIcon.None,
			animation: ModalAnimation.Circle2
		});

		actionButtonEnabled = false;

		try {
			permitApproveTx = await erc20Contract.approve(crowdtainerAddress, totalCostInERCUnits);
		} catch (error) {
			console.log(error);
			actionButtonEnabled = true;
			modalDialog.show({
				id: 'walletApprovalFailed',
				type: ModalType.Information,
				title: 'Spending approval',
				body: `Spending approval failed: request rejected.`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});
			return;
		}

		modalDialog.show({
			id: 'walletWaitForSpendingApproval',
			type: ModalType.Information,
			title: 'Spending approval',
			body: `Waiting for transaction confirmation..`,
			icon: ModalIcon.None,
			animation: ModalAnimation.Diamonds
		});

		let receipt: ContractReceipt | undefined;
		let error: string = '';
		try {
			receipt = await permitApproveTx.wait();
		} catch (_error) {
			error = `${_error}`;
		}

		if (error !== '' || receipt === undefined || receipt.status === 0) {
			// tx failed
			let message = 'Transaction failed';
			if (error !== '') {
				message += `. Reason: ${error}`;
			} else {
				message += `.`;
			}
			modalDialog.show({
				id: 'walletWaitForSpendingApproval',
				type: ModalType.Information,
				title: 'Spending approval',
				body: message,
				icon: ModalIcon.Exclamation
			});
			return;
		}

		let checkAllowanceResult = await checkAllowance(
			String(accountAddress),
			erc20Contract,
			tokenDecimals,
			crowdtainerAddress,
			totalCostInERCUnits
		);

		if (checkAllowanceResult.isErr()) {
			modalDialog.show({
				id: 'walletWaitForSpendingApprovalError',
				type: ModalType.Information,
				title: 'Spending approval',
				body: `Unable to authorize ERC20 spending. ${checkAllowanceResult.unwrapErr()}`,
				icon: ModalIcon.Exclamation
			});
			actionButtonEnabled = true;
			console.log(`${checkAllowanceResult.unwrapErr()}`);
			return;
		} else {
			showToast(
				'You have authorized spending to this campaign. You are ready to join the project 🎉',
				MessageType.Info
			);
			modalDialog.close();
		}

		await refreshWalletData;

		actionButtonEnabled = true;
	};

	$: enoughFunds =
		walletData &&
		walletData.erc20Balance !== undefined &&
		totalCostInERCUnits.lt(walletData.erc20Balance)
			? true
			: false;
	$: enoughAllowance =
		walletData &&
		walletData.erc20Allowance !== undefined &&
		walletData.erc20Allowance.lt(totalCostInERCUnits)
			? false
			: true;

	// User product selection
	var selection: Readable<number[]> = derived(joinSelection, ($joinSelection) => {
		let storeSelection = $joinSelection.get(crowdtainerId);
		let noSelection = Array(productListLength).fill(0);
		if (storeSelection === undefined) {
			return noSelection;
		} else {
			return storeSelection;
		}
	});
</script>

<div class="flex justify-center">
	<div class="max-w-sm mb-8">
		<div class="grid grid-flow-col auto-cols-1">
			{#if enoughFunds}
				<p class="text-green-600">✔ Enough funds.</p>
			{:else}
				⚠ Not enough funds. Please top up your wallet with {totalSum - discountValue} {tokenSymbol}.
			{/if}
		</div>
		<div class="grid grid-flow-col auto-cols-1">
			{#if enoughAllowance}
				<p class="text-green-600">✔ Enough spend allowance.</p>
			{:else}
				Spend allowance required: {totalSum - discountValue} {tokenSymbol}.
			{/if}
		</div>

		{#if actionButtonEnabled && enoughFunds}
			<button
				type="button"
				disabled={!actionButtonEnabled || !enoughFunds}
				class={actionButtonEnabled && enoughFunds ? 'btn btn-primary px-12 my-6' : 'gray-btn'}
				on:click={() => {
					if (enoughFunds) {
						if (enoughAllowance) {
							callJoinProject(withSignature, undefined);
						} else {
							callJoinProject(
								withSignature,
								BigNumber.from(Math.pow(10, tokenDecimals) * (totalSum - discountValue))
							);
							// TODO: Add support for ERC20's without ERC2612 support.
							// Use separate call to callApproveSpending() in such cases.
						}
					}
				}}
			>
				Confirm and Join
			</button>
		{/if}
	</div>
</div>
