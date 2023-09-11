

import ModalDialog, {
    ModalAnimation,
    ModalIcon,
    ModalType,
    type ModalDialogData
} from './ModalDialog.svelte';

import { claimFunds, claimRewards, leaveProject, transferToken } from './ethersCalls/rpcRequests.js';
import { getSigner } from './Utils/wallet.js';
import { showToast } from './Toast/ToastStore.js';

export async function callLeaveProject(vouchers721Address: string, crowdtainerAddress: string, modalDialog: ModalDialog, onUserLeftCrowdtainer: (crowdtainerAddress: string) => void) {
    modalDialog.show({
        id: 'leaveCampaign',
        type: ModalType.ActionRequest,
        title: 'Leave campaign',
        body: 'Please confirm the transaction request in your mobile wallet.',
        animation: ModalAnimation.Circle2,
        icon: ModalIcon.DeviceMobile
    });

    let signResult = await leaveProject(getSigner(), vouchers721Address, crowdtainerAddress);

    if (signResult.isErr()) {
        modalDialog.show({
            id: 'leaveCampaignError',
            type: ModalType.ActionRequest,
            title: 'Transaction rejected',
            body: 'Your request to leave the project was not completed.',
            icon: ModalIcon.Exclamation
        });
        console.log(`Failure!? ${signResult.unwrapErr()}`);
        return;
    }

    showToast('You have successfully left the campaign.');

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

    let signResult = await claimFunds(getSigner(), crowdtainerAddress);

    if (signResult.isErr()) {
        modalDialog.show({
            id: 'claimFundsTxRejected',
            type: ModalType.ActionRequest,
            title: 'Transaction rejected',
            body: 'Your request to leave the project was not completed.',
            icon: ModalIcon.Exclamation
        });
        console.log(`Failure!? ${signResult.unwrapErr()}`);
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

    let confirmation = await signResult.unwrap().wait();
    modalDialog.close();

    if (confirmation.status === 1) {
        modalDialog.show({
            id: 'rewardsClaimResultDialog',
            type: ModalType.Information,
            title: 'Success',
            body: 'Rewards transfer complete.',
            icon: ModalIcon.Exclamation
        });
        console.log(`Transfer transaction hash: ${confirmation.transactionHash}`);
    } else {
        modalDialog.show({
            id: 'rewardsClaimResultDialog',
            type: ModalType.Information,
            title: 'Failure',
            body: 'Participation proof transfer Failed.',
            icon: ModalIcon.Exclamation
        });
    }
    modalDialog.showDialog();
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

    // TODO: Check if ENS rsoluition is working
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

    let confirmation = await signResult.unwrap().wait();

    let resultDialogData: ModalDialogData;
    if (confirmation.status === 1) {
        resultDialogData = {
            id: 'resultDialog',
            title: 'Success',
            type: ModalType.Information,
            body: 'Transfer complete.',
            icon: ModalIcon.BadgeCheck
        };
        console.log(`Transfer transaction hash: ${confirmation.transactionHash}`);
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