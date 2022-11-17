export const CrowdtainerErrors = [
    "CrowdtainerInexistent()",
    // @notice: Invalid token id.
    "InvalidTokenId(uint256 tokenId)",
    // @notice: Prices lower than 1 * 1^6 not supported.
    "PriceTooLow()",
    // @notice: Attempted to join with all product quantities set to zero.
    "InvalidNumberOfQuantities()",
    // @notice: Account cannot be of address(0).
    "AccountAddressIsZero()",
    // @notice: Metadata service contract cannot be of address(0).
    "MetadataServiceAddressIsZero()",
    // @notice: Accounts and ids lengths do not match.
    "AccountIdsLengthMismatch()",
    // @notice: ID's and amounts lengths do not match.
    "IDsAmountsLengthMismatch()",
    // @notice: Cannot set approval for the same account.
    "CannotSetApprovalForSelf()",
    // @notice: Caller is not owner or has correct permission.
    "AccountNotOwner()",
    // @notice: Only the shipping agent is able to set a voucher/tokenId as "claimed".
    "SetClaimedOnlyAllowedByShippingAgent()",
    // @notice: Cannot transfer someone else's tokens.
    "UnauthorizedTransfer()",
    // @notice: Insufficient balance.
    "InsufficientBalance()",
    // @notice: Can't initialize with all their prices set to zero.
    "InvalidProductNumberAndPrices()",
    // @notice: Can't make transfers in given state.
    "TransferNotAllowed(address crowdtainer, CrowdtainerState state)",
    // @notice: No further participants possible in a given Crowdtainer.
    "MaximumNumberOfParticipantsReached(uint256 maximum,address crowdtainer)",
    // Used to apply off-chain verifications/rules per CCIP-read (EIP-3668),
    // see https://eips.ethereum.org/EIPS/eip-3668 for description.
    "OffchainLookup(address sender,string[] urls,bytes callData,bytes4 callbackFunction,bytes extraData)",
    "CCIP_Read_InvalidOperation()",
    "SignatureExpired(uint64 current, uint64 expires)",
    "NonceAlreadyUsed(address wallet, bytes32 nonce)",
    "InvalidSignature()",
  
    // -----------------------------------------------
    //  Initialization with invalid parameters
    // -----------------------------------------------
    // @notice: Cannot initialize with owner of address(0).
    "OwnerAddressIsZero()",
    // @notice: Cannot initialize with token of address(0).
    "TokenAddressIsZero()",
    // @notice: Shipping agent can't have address(0).
    "ShippingAgentAddressIsZero()",
    // @notice: Initialize called with closing time is less than one hour away from the opening time.
    "ClosingTimeTooEarly()",
    // @notice: Initialize called with invalid number of maximum units to be sold (0).
    "InvalidMaximumTarget()",
    // @notice: Initialize called with invalid number of minimum units to be sold (less than maximum sold units).
    "InvalidMinimumTarget()",
    // @notice: Initialize called with invalid minimum and maximum targets (minimum value higher than maximum).
    "MinimumTargetHigherThanMaximum()",
    // @notice: Initialize called with invalid referral rate.
    "InvalidReferralRate(uint256 received, uint256 maximum)",
    // @notice: Referral rate not multiple of 2.
    "ReferralRateNotMultipleOfTwo()",
    // @notice: Refferal minimum value for participation can't be higher than project's minimum target.
    "ReferralMinimumValueTooHigh(uint256 received, uint256 maximum)",
  
    // -----------------------------------------------
    //  Authorization
    // -----------------------------------------------
    // @notice: Method not authorized for caller (message sender).
    "CallerNotAllowed(address expected, address actual)",
  
    // -----------------------------------------------
    //  Join() operation
    // -----------------------------------------------
    // @notice: The given referral was not found thus can't be used to claim a discount.
    "ReferralInexistent()",
    // @notice: Purchase exceed target's maximum goal.
    "PurchaseExceedsMaximumTarget(uint256 received, uint256 maximum)",
    // @notice: Number of items purchased per type exceeds maximum allowed.
    "ExceededNumberOfItemsAllowed(uint256 received, uint256 maximum)",
    // @notice: Wallet already used to join project.
    "UserAlreadyJoined()",
    // @notice: Referral is not enabled for the given code/wallet.
    "ReferralDisabledForProvidedCode()",
    // @notice: Participant can't participate in referral if the minimum purchase value specified by the service provider is not met.
    "MinimumPurchaseValueForReferralNotMet(uint256 received,uint256 minimum)",
  
    // -----------------------------------------------
    //  Leave() operation
    // -----------------------------------------------
    // @notice: It is not possible to leave when the user has referrals enabled, has been referred and gained rewards.
    "CannotLeaveDueAccumulatedReferralCredits()",
  
    // -----------------------------------------------
    //  GetPaidAndDeliver() operation
    // -----------------------------------------------
    // @notice: GetPaidAndDeliver can't be called on a expired project.
    "CrowdtainerExpired(uint256 timestamp, uint256 expiredTime)",
    // @notice: Not enough funds were raised.
    "MinimumTargetNotReached(uint256 minimum, uint256 actual)",
    // @notice: The project is not active yet.
    "OpeningTimeNotReachedYet(uint256 timestamp, uint256 openingTime)",
  
    // -----------------------------------------------
    //  ClaimFunds() operation
    // -----------------------------------------------
    // @notice: Can't be called if the project is still active.
    "CantClaimFundsOnActiveProject()",
  
    // -----------------------------------------------
    //  State transition
    // -----------------------------------------------
    // @notice: Method can't be invoked at current state.
    "InvalidOperationFor(CrowdtainerState state)",
  
    // -----------------------------------------------
    //  Other Invariants
    // -----------------------------------------------
    // @notice: Payable receive function called, but we don't accept Eth for payment.
    "ContractDoesNotAcceptEther()"
  ];