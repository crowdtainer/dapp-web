/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, type Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../common";
import type { Errors, ErrorsInterface } from "../Errors";

const _abi = [
  {
    type: "error",
    name: "AccountAddressIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "AccountIdsLengthMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "AccountNotOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "CCIP_Read_InvalidOperation",
    inputs: [],
  },
  {
    type: "error",
    name: "CallerNotAllowed",
    inputs: [
      {
        name: "expected",
        type: "address",
        internalType: "address",
      },
      {
        name: "actual",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "CannotLeaveDueAccumulatedReferralCredits",
    inputs: [],
  },
  {
    type: "error",
    name: "CannotSetApprovalForSelf",
    inputs: [],
  },
  {
    type: "error",
    name: "CantClaimFundsOnActiveProject",
    inputs: [],
  },
  {
    type: "error",
    name: "ClosingTimeTooEarly",
    inputs: [],
  },
  {
    type: "error",
    name: "ContractDoesNotAcceptEther",
    inputs: [],
  },
  {
    type: "error",
    name: "CrowdtainerExpired",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "expiredTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "CrowdtainerInexistent",
    inputs: [],
  },
  {
    type: "error",
    name: "CrowdtainerLowLevelError",
    inputs: [
      {
        name: "reason",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "ExceededNumberOfItemsAllowed",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maximum",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "IDsAmountsLengthMismatch",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidMaximumTarget",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidMinimumTarget",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidNumberOfQuantities",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidOperationFor",
    inputs: [
      {
        name: "state",
        type: "uint8",
        internalType: "enum CrowdtainerState",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidProductNumberAndPrices",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidReferralRate",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maximum",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "InvalidSignature",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidTokenId",
    inputs: [
      {
        name: "tokenId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MaximumNumberOfParticipantsReached",
    inputs: [
      {
        name: "maximum",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "crowdtainer",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "MetadataServiceAddressIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "MinimumPurchaseValueForReferralNotMet",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "minimum",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "MinimumTargetHigherThanMaximum",
    inputs: [],
  },
  {
    type: "error",
    name: "MinimumTargetNotReached",
    inputs: [
      {
        name: "minimum",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "actual",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "NonceAlreadyUsed",
    inputs: [
      {
        name: "wallet",
        type: "address",
        internalType: "address",
      },
      {
        name: "nonce",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
  },
  {
    type: "error",
    name: "OffchainLookup",
    inputs: [
      {
        name: "sender",
        type: "address",
        internalType: "address",
      },
      {
        name: "urls",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "callData",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "callbackFunction",
        type: "bytes4",
        internalType: "bytes4",
      },
      {
        name: "extraData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
  },
  {
    type: "error",
    name: "OpeningTimeNotReachedYet",
    inputs: [
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "openingTime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "OwnerAddressIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "PriceTooLow",
    inputs: [],
  },
  {
    type: "error",
    name: "PurchaseExceedsMaximumTarget",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maximum",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ReferralDisabledForProvidedCode",
    inputs: [],
  },
  {
    type: "error",
    name: "ReferralInexistent",
    inputs: [],
  },
  {
    type: "error",
    name: "ReferralMinimumValueTooHigh",
    inputs: [
      {
        name: "received",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "maximum",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ReferralRateNotMultipleOfTwo",
    inputs: [],
  },
  {
    type: "error",
    name: "SetClaimedOnlyAllowedByShippingAgent",
    inputs: [],
  },
  {
    type: "error",
    name: "ShippingAgentAddressIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "SignatureExpired",
    inputs: [
      {
        name: "current",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "expires",
        type: "uint64",
        internalType: "uint64",
      },
    ],
  },
  {
    type: "error",
    name: "TokenAddressIsZero",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferNotAllowed",
    inputs: [
      {
        name: "crowdtainer",
        type: "address",
        internalType: "address",
      },
      {
        name: "state",
        type: "uint8",
        internalType: "enum CrowdtainerState",
      },
    ],
  },
  {
    type: "error",
    name: "UnauthorizedTransfer",
    inputs: [],
  },
  {
    type: "error",
    name: "UserAlreadyJoined",
    inputs: [],
  },
] as const;

const _bytecode =
  "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea26469706673582212208e6fc90c77d834322b4b49fd031bd419f0cca70d91f523f14878a9260bb7bf5564736f6c63430008150033";

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
