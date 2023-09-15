/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { Errors, ErrorsInterface } from "../Errors";

const _abi = [
  {
    inputs: [],
    name: "AccountAddressIsZero",
    type: "error",
  },
  {
    inputs: [],
    name: "AccountIdsLengthMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "AccountNotOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "CCIP_Read_InvalidOperation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "expected",
        type: "address",
      },
      {
        internalType: "address",
        name: "actual",
        type: "address",
      },
    ],
    name: "CallerNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "CannotLeaveDueAccumulatedReferralCredits",
    type: "error",
  },
  {
    inputs: [],
    name: "CannotSetApprovalForSelf",
    type: "error",
  },
  {
    inputs: [],
    name: "CantClaimFundsOnActiveProject",
    type: "error",
  },
  {
    inputs: [],
    name: "ClosingTimeTooEarly",
    type: "error",
  },
  {
    inputs: [],
    name: "ContractDoesNotAcceptEther",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiredTime",
        type: "uint256",
      },
    ],
    name: "CrowdtainerExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "CrowdtainerInexistent",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "reason",
        type: "bytes",
      },
    ],
    name: "CrowdtainerLowLevelError",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximum",
        type: "uint256",
      },
    ],
    name: "ExceededNumberOfItemsAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "IDsAmountsLengthMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMaximumTarget",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMinimumTarget",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidNumberOfQuantities",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "enum CrowdtainerState",
        name: "state",
        type: "uint8",
      },
    ],
    name: "InvalidOperationFor",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidProductNumberAndPrices",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximum",
        type: "uint256",
      },
    ],
    name: "InvalidReferralRate",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "InvalidTokenId",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "maximum",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "crowdtainer",
        type: "address",
      },
    ],
    name: "MaximumNumberOfParticipantsReached",
    type: "error",
  },
  {
    inputs: [],
    name: "MetadataServiceAddressIsZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minimum",
        type: "uint256",
      },
    ],
    name: "MinimumPurchaseValueForReferralNotMet",
    type: "error",
  },
  {
    inputs: [],
    name: "MinimumTargetHigherThanMaximum",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "minimum",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
    ],
    name: "MinimumTargetNotReached",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "wallet",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "nonce",
        type: "bytes32",
      },
    ],
    name: "NonceAlreadyUsed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "string[]",
        name: "urls",
        type: "string[]",
      },
      {
        internalType: "bytes",
        name: "callData",
        type: "bytes",
      },
      {
        internalType: "bytes4",
        name: "callbackFunction",
        type: "bytes4",
      },
      {
        internalType: "bytes",
        name: "extraData",
        type: "bytes",
      },
    ],
    name: "OffchainLookup",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "openingTime",
        type: "uint256",
      },
    ],
    name: "OpeningTimeNotReachedYet",
    type: "error",
  },
  {
    inputs: [],
    name: "OwnerAddressIsZero",
    type: "error",
  },
  {
    inputs: [],
    name: "PriceTooLow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximum",
        type: "uint256",
      },
    ],
    name: "PurchaseExceedsMaximumTarget",
    type: "error",
  },
  {
    inputs: [],
    name: "ReferralDisabledForProvidedCode",
    type: "error",
  },
  {
    inputs: [],
    name: "ReferralInexistent",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maximum",
        type: "uint256",
      },
    ],
    name: "ReferralMinimumValueTooHigh",
    type: "error",
  },
  {
    inputs: [],
    name: "ReferralRateNotMultipleOfTwo",
    type: "error",
  },
  {
    inputs: [],
    name: "SetClaimedOnlyAllowedByShippingAgent",
    type: "error",
  },
  {
    inputs: [],
    name: "ShippingAgentAddressIsZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "current",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "expires",
        type: "uint64",
      },
    ],
    name: "SignatureExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenAddressIsZero",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "crowdtainer",
        type: "address",
      },
      {
        internalType: "enum CrowdtainerState",
        name: "state",
        type: "uint8",
      },
    ],
    name: "TransferNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "UnauthorizedTransfer",
    type: "error",
  },
  {
    inputs: [],
    name: "UserAlreadyJoined",
    type: "error",
  },
] as const;

const _bytecode =
  "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea26469706673582212206bd8c8e5a2be0cb203c3bee8778556817776eb0a18f1b54471209c59eb54bb9564736f6c63430008100033";

type ErrorsConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ErrorsConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Errors__factory extends ContractFactory {
  constructor(...args: ErrorsConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Errors> {
    return super.deploy(overrides || {}) as Promise<Errors>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): Errors {
    return super.attach(address) as Errors;
  }
  override connect(signer: Signer): Errors__factory {
    return super.connect(signer) as Errors__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ErrorsInterface {
    return new utils.Interface(_abi) as ErrorsInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Errors {
    return new Contract(address, _abi, signerOrProvider) as Errors;
  }
}
