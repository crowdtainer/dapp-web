<script lang="ts">
	import { ethers, BigNumber, type ContractReceipt } from 'ethers';
	import { onInterval } from './Utils/intervalTimer';

	import type { UserStoreModel } from '$lib/Model/UserStoreModel';
	import {
		checkAllowance,
		fetchUserBalancesData,
		getERC20Contract,
		joinProject,
		joinProjectWithSignature
	} from './ethersCalls/rpcRequests';
	import { getSigner, walletState, web3Provider } from './Utils/wallet';

	import { ModalAnimation, ModalIcon, ModalType } from '$lib/ModalDialog.svelte';
	import { requestAuthorizationProof, requestSponsoredTx } from './api.js';
	import { derived, type Readable } from 'svelte/store';
	import { joinSelection } from './Stores/userStore.js';
	import { showToast } from './Toast/ToastStore.js';
	import type { IERC20 } from '../routes/typechain/IERC20.js';
	import { Err, Ok, type Result } from '@sniptt/monads';
	import { MessageType } from './Toast/MessageType.js';
	import type { SignedPermitStruct } from '../routes/typechain/Vouchers721.js';
	import { getSignedPermit, type ERC2612_Input } from './TokenUtils/permit.js';
	import type ModalDialog from '$lib/ModalDialog.svelte';

	export let crowdtainerId: number;
	export let chainId: number;
	export let crowdtainerAddress: string;
	export let vouchers721Address: string;
	export let tokenAddress: string;
	export let tokenSymbol: string;
	export let tokenName: string;
	export let tokenVersion: string;
	export let txSponsoringEnabled: boolean;
	export let totalSum: number;
	export let tokenDecimals: number;
	export let totalCostInERCUnits: BigNumber;
	export let discountValue: number;
	export let validUserCouponCode: string;
	export let referralCheckBoxActivated: boolean;
	export let actionButtonEnabled: boolean;
	export let productListLength: number;
	export let projectHasSigner: boolean;

	export let modalDialog: ModalDialog;

	export let userJoinedSuccess: () => void;

	const interval = 10000;
	let walletData: UserStoreModel;

	export let refreshWalletData = async (): Promise<boolean> => {
		console.log(`refreshWalletData...`);
		try {
			if (crowdtainerAddress) {
				let response = await fetchUserBalancesData(web3Provider, crowdtainerAddress);
				if (response.isOk()) {
					walletData = response.unwrap();
					console.log(
						`crowdtainerAddress: ${crowdtainerAddress} allowance: ${walletData.erc20Allowance}, balance: ${walletData.erc20Balance}`
					);
					return true;
				} else {
					console.log(`hm, ${response.unwrapErr()}`);
					return false;
				}
			} else {
				console.log('No crowdtainerAddress defined.');
				return false;
			}
		} catch (error) {
			console.log(`Error fetching wallet balances.`);
			return false;
		}
	};

	onInterval(refreshWalletData, interval);

	type JoinWithSignatureData = {
		calldata: string;
		signedPayload: string;
		extraData: string;
	};

	async function getServiceProviderAuthorization(
		userWalletAddress: string,
		crowdtainerAddress: string,
		selection: number[],
		couponCode: string,
		referralEnabled: boolean
	): Promise<Result<JoinWithSignatureData, string>> {
		let couponCodeAddress =
			couponCode !== undefined && couponCode !== ''
				? couponCode
				: '0x0000000000000000000000000000000000000000';

		console.log('reqqq..');
		let authorizationResult = await requestAuthorizationProof(
			userWalletAddress,
			crowdtainerAddress,
			selection,
			referralEnabled,
			couponCodeAddress
		);

		if (authorizationResult.isErr()) {
			return Err(`An error ocurred when joining the project: ${authorizationResult.unwrapErr()}`);
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

		return Ok({ calldata, signedPayload, extraData });
	}

	const callJoinProject = async (modalDialog: ModalDialog, projectHasSigner: boolean) => {
		let userWallet = getSigner();

		if (userWallet === undefined) {
			showToast('Error: Missing signer.', MessageType.Warning);
			return;
		}

		let userWalletAddress = await userWallet.getAddress();
		if (!userWalletAddress || userWalletAddress === '') {
			showToast(`Unable to get wallet signer address.`);
			console.log(`Unable to get wallet signer address.`);
			return;
		}

		console.log(
			`Join parameters: vouchers721Address: ${vouchers721Address}; crowdtainerAddress ${crowdtainerAddress};validUserCouponCode:${validUserCouponCode}, referralEnabled: ${referralCheckBoxActivated} `
		);
		console.log(`Selection: ${$selection}`);
		console.log(`userWalletAddress: ${userWalletAddress}`);

		let signedPermit: SignedPermitStruct | undefined;

		if (projectHasSigner && txSponsoringEnabled && !enoughAllowance) {
			// get signed permit/allowance
			modalDialog.show({
				id: 'joinProject',
				title: 'Join project',
				type: ModalType.ActionRequest,
				icon: ModalIcon.DeviceMobile,
				body: `Allow Crowtdainer to withdraw the respective amount from your wallet.`,
				animation: ModalAnimation.Circle2
			});

			let signedPermitResult = await getSignedPermit({
				userWalletAddress: userWalletAddress,
				crowdtainerAddress: crowdtainerAddress,
				chainId: chainId,
				tokenAddress: tokenAddress,
				tokenName: tokenName,
				tokenVersion: tokenVersion,
				withPermitValue: totalCostInERCUnits,
				signer: userWallet
			});
			if (signedPermitResult.isErr()) {
				modalDialog.show({
					id: 'txRejected',
					type: ModalType.ActionRequest,
					title: 'Transaction rejected',
					body: signedPermitResult.unwrapErr(),
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				});
				return;
			}
			signedPermit = signedPermitResult.unwrap();
		}
		if (!signedPermit && !enoughAllowance) {
			// txSponsoring not available, user must pay the transaction cost.
			if (!(await callApproveSpending())) {
				return;
			}
			refreshWalletData();
		}

		let joinTransaction: Result<ethers.ContractTransaction, string> | undefined;

		if (projectHasSigner) {
			console.log('Getting service provider authorization..');
			try {
				modalDialog.show({
					id: 'joinProject',
					title: 'Join project',
					type: ModalType.Information,
					icon: ModalIcon.None,
					body: `Getting service provider authorization..`,
					animation: ModalAnimation.Circle2
				});
			} catch (error) {
				console.log(`Mother of lords: ${error}`);
			}
			let serviceProviderAuthResult = await getServiceProviderAuthorization(
				userWalletAddress,
				crowdtainerAddress!,
				$selection,
				validUserCouponCode,
				referralCheckBoxActivated
			);

			if (serviceProviderAuthResult.isErr()) {
				console.log(`Error: ${serviceProviderAuthResult.unwrapErr()}`);
				modalDialog.show({
					id: 'txRejected',
					type: ModalType.ActionRequest,
					title: 'Authorization rejected',
					body: `An error ocurred when joining the project: ${serviceProviderAuthResult.unwrapErr()}`,
					icon: ModalIcon.Exclamation,
					animation: ModalAnimation.None
				});
				return;
			} else {
				modalDialog.close();
			}

			let serviceProviderAuth = serviceProviderAuthResult.unwrap();

			if (projectHasSigner && txSponsoringEnabled) {
				modalDialog.show({
					id: 'joinProject',
					title: 'Join project',
					type: ModalType.Information,
					icon: ModalIcon.None,
					body: `Joining project..`,
					animation: ModalAnimation.Circle2
				});

				let sponsoredTxResult: Result<string, string> | undefined;
				sponsoredTxResult = await requestSponsoredTx(
					serviceProviderAuth.calldata,
					serviceProviderAuth.signedPayload,
					signedPermit
				);

				if (!sponsoredTxResult.isErr()) {
					modalDialog.close();
					let noSelection = Array(productListLength).fill(0);
					$joinSelection.set(crowdtainerId, noSelection);
					userJoinedSuccess();
					return;
				}
				if (sponsoredTxResult?.isErr()) {
					//Fallback to user-paid transaction.
					showToast(
						`Falling back to user's wallet, as transaction sponsoring failed: ${sponsoredTxResult.unwrapErr()}.`
					);
				}
			}

			modalDialog.show({
				id: 'joinProject',
				title: 'Join project',
				type: ModalType.ActionRequest,
				icon: ModalIcon.DeviceMobile,
				body: `Please approve the transaction from your wallet.`,
				animation: ModalAnimation.Circle2
			});
			joinTransaction = await joinProjectWithSignature(
				userWallet,
				vouchers721Address!,
				crowdtainerAddress!,
				serviceProviderAuth.signedPayload,
				serviceProviderAuth.extraData,
				signedPermit
			);
		} else {
			if (txSponsoringEnabled) {
				console.warn(
					'Transaction sponsoring not avaialble for projects without a signer. Falling back to user-paid transaction call.'
				);
			}
			modalDialog.show({
				id: 'joinProject',
				title: 'Join project',
				type: ModalType.ActionRequest,
				icon: ModalIcon.DeviceMobile,
				body: `Please approve the join transaction from your wallet.`,
				animation: ModalAnimation.Circle2
			});
			joinTransaction = await joinProject(
				userWallet,
				vouchers721Address!,
				crowdtainerAddress!,
				$selection,
				validUserCouponCode && ethers.utils.isAddress(validUserCouponCode)
					? validUserCouponCode
					: '0x0000000000000000000000000000000000000000',
				referralCheckBoxActivated,
				signedPermit
			);
		}

		if (await joinTransactionSuccessful(joinTransaction)) {
			let noSelection = Array(productListLength).fill(0);
			$joinSelection.set(crowdtainerId, noSelection);
			userJoinedSuccess();
		}
	};

	const joinTransactionSuccessful = async (
		joinTransaction: Result<ethers.ContractTransaction, string>
	): Promise<boolean> => {
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
			return false;
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

		if (txResult.status !== 1) {
			modalDialog.show({
				id: 'joinProjectConfirmation',
				type: ModalType.Information,
				title: 'Join project failed',
				body: `The transaction to join the campaing failed.`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});
			return false;
		}
		modalDialog.close();
		return true;
	};

	const callApproveSpending = async (): Promise<boolean> => {
		if (!crowdtainerAddress) {
			console.log('Error: missing required data (crowdtainerAddress)');
			return false;
		}
		let signer = getSigner();
		let erc20ContractResult = await getERC20Contract(signer, crowdtainerAddress);
		let erc20Contract: IERC20;

		if (erc20ContractResult.isErr()) {
			showToast('Error connecting to ERC20 contract. Internet down?', MessageType.Warning);
			console.log(erc20ContractResult.unwrapErr());
			return false;
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
			return false;
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

		let permitApproveTx: undefined | ethers.ContractTransaction;

		let approveException: unknown;
		try {
			console.log(
				`approve call : crowdtainerAddress: ${crowdtainerAddress}; totalCostInERCUnits: ${totalCostInERCUnits}`
			);
			permitApproveTx = await erc20Contract.approve(crowdtainerAddress, totalCostInERCUnits);
		} catch (error) {
			console.log(error);
			approveException = error;
		}

		if (!permitApproveTx || approveException) {
			console.log(approveException);
			modalDialog.show({
				id: 'walletApprovalFailed',
				type: ModalType.Information,
				title: 'Spending approval',
				body: `Spending approval call failed: request rejected by wallet.`,
				icon: ModalIcon.Exclamation,
				animation: ModalAnimation.None
			});
			return false;
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
			return false;
		}

		if (!receipt || error !== '' || receipt.status !== 1) {
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
			return false;
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
			console.log(`${checkAllowanceResult.unwrapErr()}`);
			return false;
		} else {
			showToast(
				'You have authorized spending to this campaign. You are ready to join the project 🎉',
				MessageType.Info
			);
			modalDialog.close();
		}
		return true;
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
	<div class="max-w-sm mb-8 mx-4">
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

		{#if enoughFunds}
			<button
				type="button"
				disabled={!actionButtonEnabled || !enoughFunds}
				class={actionButtonEnabled && enoughFunds ? 'btn btn-primary px-12 my-6' : 'gray-btn'}
				on:click={async () => {
					await callJoinProject(modalDialog, projectHasSigner);
				}}
			>
				Confirm and Join
			</button>
		{/if}
	</div>
</div>
