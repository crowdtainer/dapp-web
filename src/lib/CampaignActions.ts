import ModalDialog, {
    ModalAnimation,
    ModalIcon,
    ModalType,
    type ModalDialogData
} from './ModalDialog.svelte';

import { claimFunds, claimRewards, leaveProject, transferToken } from './ethersCalls/rpcRequests.js';
import { getSigner } from './Utils/wallet.js';
import { showToast } from './Toast/ToastStore.js';
import type { ethers } from 'ethers';
import { waitForTransaction } from './Utils/transactionHandling.js';

export async function callLeaveProject(wallet: string, vouchers721Address: string, crowdtainerAddress: string, modalDialog: ModalDialog, onUserLeftCrowdtainer: (crowdtainerAddress: string) => void) {
    console.log(`callLeaveProject(wallet: ${wallet}, vouchers721Address: ${vouchers721Address}, crowdtainerAddress: ${crowdtainerAddress})`);
    modalDialog.show({
        id: 'leaveCampaign',
        type: ModalType.ActionRequest,
        title: 'Leave campaign',
        body: 'Please confirm the transaction request in your mobile wallet.',
        animation: ModalAnimation.Circle2,
        icon: ModalIcon.DeviceMobile
    });

    let signer = getSigner();
    let signResult = await leaveProject(signer, wallet, vouchers721Address, crowdtainerAddress);

    if (signResult.isErr()) {
        console.log(`Failure: ${signResult.unwrapErr()}`);
        modalDialog.show({
            id: 'leaveCampaignError',
            type: ModalType.ActionRequest,
            title: 'Transaction rejected',
            body: 'Your request to leave the project was not completed',
            icon: ModalIcon.Exclamation
        });
        return;
    }

    showToast('Successfully left the campaign.');

    modalDialog.close();
    onUserLeftCrowdtainer(crowdtainerAddress);
};

export async function callClaimFunds(crowdtainerAddress: string, modalDialog: ModalDialog, onUserClaimedFunds: (crowdtainerAddress: string) => void) {
    modalDialog.show({
        id: 'leaveCampaignError',
        type: ModalType.ActionRequest,
        title: 'Claim funds',
        body: 'Please confirm the transaction request in your mobile wallet.',
        icon: ModalIcon.Exclamation
    });

    let signer = getSigner();
    let signResult = await claimFunds(signer, crowdtainerAddress);

    if (signResult.isErr()) {
        modalDialog.show({
            id: 'claimFundsTxRejected',
            type: ModalType.ActionRequest,
            title: 'Transaction rejected',
            body: 'Your request to claim funds was not completed.',
            icon: ModalIcon.Exclamation
        });
        console.log(`Failure: ${signResult.unwrapErr()}`);
        return;
    }

    modalDialog.close();
    onUserClaimedFunds(crowdtainerAddress);
};

export function showTransferDialog(transferWalletModalDialog: ModalDialog) {
    transferWalletModalDialog.show({
        id: 'transferWallet',
        type: ModalType.DataInput,
        title: 'Transfer',
        body: 'Please enter the wallet address you would like to send the participation proof to:'
    });
};

export async function callClaimRewards(crowdtainerAddress: string, modalDialog: ModalDialog) {
    modalDialog.show({
        id: 'confirmClaimRewardsTx',
        type: ModalType.ActionRequest,
        title: 'Claim referral rewards',
        body: 'Please confirm the transaction request in your mobile wallet.',
        animation: ModalAnimation.Circle2
    });

    let signResult = await claimRewards(getSigner(), crowdtainerAddress);

    if (signResult.isErr()) {
        modalDialog.show({
            id: 'claimRewardsRejected',
            type: ModalType.ActionRequest,
            title: 'Transaction rejected',
            body: 'Your request to claim rewards was not completed.',
            icon: ModalIcon.Exclamation
        });

        console.log(`Failure!? ${signResult.unwrapErr()}`);
        return;
    }

    let transactionReceipt: ethers.providers.TransactionReceipt | undefined = undefined;
    let error: string = '';
    try {
        transactionReceipt = await waitForTransaction(signResult.unwrap().hash);
    } catch (_error) {
        error = `${_error}`;
    }

    modalDialog.close();

    if (transactionReceipt && transactionReceipt.confirmations >= 1) {
        modalDialog.show({
            id: 'rewardsClaimResultDialog',
            type: ModalType.Information,
            title: 'Success',
            body: 'Rewards transfer complete.',
            icon: ModalIcon.Exclamation
        });
        console.log(`Claim rewards transaction hash: ${transactionReceipt.transactionHash}`);
    } else {
        modalDialog.show({
            id: 'rewardsClaimResultDialog',
            type: ModalType.Information,
            title: 'Failure',
            body: 'Claim rewards transaction failed.',
            icon: ModalIcon.Exclamation
        });
    }
};

export async function callTransferParticipationProof(targetWallet: string,
    tokenId: number,
    vouchers721Address: string,
    modalDialog: ModalDialog,
    onUserTransferredParticipation: (resultDialogData: ModalDialogData) => void) {

    modalDialog.show({
        id: 'confirmTransferTx',
        type: ModalType.ActionRequest,
        title: 'Transfer participation proof to another wallet',
        body: 'Please confirm the transaction request in your mobile wallet.',
        animation: ModalAnimation.Circle2
    });

    // TODO: Check if ENS resolution is working
    let signResult = await transferToken(getSigner(), vouchers721Address, targetWallet, tokenId);

    if (signResult.isErr()) {
        modalDialog.show({
            id: 'transferRejected',
            title: 'Transaction rejected',
            type: ModalType.ActionRequest,
            body: 'Your request to transfer the participation proof was not completed.',
            icon: ModalIcon.Exclamation
        });

        console.log(`Failure!? ${signResult.unwrapErr()}`);
        return;
    }

    let transactionReceipt: ethers.providers.TransactionReceipt | undefined = undefined;
    let error: string = '';
    try {
        transactionReceipt = await waitForTransaction(signResult.unwrap().hash);
    } catch (_error) {
        error = `${_error}`;
    }

    modalDialog.close();

    let resultDialogData: ModalDialogData;
    if (transactionReceipt && transactionReceipt.confirmations >= 1) {
        resultDialogData = {
            id: 'resultDialog',
            title: 'Success',
            type: ModalType.Information,
            body: 'Transfer complete.',
            icon: ModalIcon.BadgeCheck
        };
        console.log(`Transfer transaction hash: ${transactionReceipt.transactionHash}`);
    } else {
        resultDialogData = {
            id: 'resultDialog',
            title: 'Failure',
            type: ModalType.Information,
            body: 'Participation proof transfer Failed.',
            icon: ModalIcon.Exclamation
        };
    }

    onUserTransferredParticipation(resultDialogData);
};

export function handleCampaignJoinedEvent(event: CustomEvent, modalDialog: ModalDialog, customCallback?: () => void) {
    console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
    modalDialog.show({
        id: 'joinSuccess',
        title: 'You have succesfully joined the project! 🎉',
        body: 'If the minimum funding is reached, you will be able to enter your delivery address on this site. Otherwise, you can get your pre-payment back.',
        type: ModalType.Information,
        icon: ModalIcon.BadgeCheck
    });
    if (customCallback)
        customCallback();
}

export function handleUserClaimedFundsEvent(event: CustomEvent, modalDialog: ModalDialog) {
    console.log(`Detected event of type: ${event.type} : detail: ${event.detail.text}`);
    modalDialog.show({
        id: 'joinSuccess',
        title: 'Success',
        body: 'The value equivalent to your pre-payment amount has been returned to your wallet.',
        type: ModalType.Information,
        icon: ModalIcon.BadgeCheck
    });
}