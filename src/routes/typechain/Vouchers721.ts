/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common";

export type CampaignDataStruct = {
  shippingAgent: AddressLike;
  signer: AddressLike;
  openingTime: BigNumberish;
  expireTime: BigNumberish;
  targetMinimum: BigNumberish;
  targetMaximum: BigNumberish;
  unitPricePerType: BigNumberish[];
  referralRate: BigNumberish;
  referralEligibilityValue: BigNumberish;
  token: AddressLike;
  legalContractURI: string;
};

export type CampaignDataStructOutput = [
  shippingAgent: string,
  signer: string,
  openingTime: bigint,
  expireTime: bigint,
  targetMinimum: bigint,
  targetMaximum: bigint,
  unitPricePerType: bigint[],
  referralRate: bigint,
  referralEligibilityValue: bigint,
  token: string,
  legalContractURI: string
] & {
  shippingAgent: string;
  signer: string;
  openingTime: bigint;
  expireTime: bigint;
  targetMinimum: bigint;
  targetMaximum: bigint;
  unitPricePerType: bigint[];
  referralRate: bigint;
  referralEligibilityValue: bigint;
  token: string;
  legalContractURI: string;
};

export type SignedPermitStruct = {
  owner: AddressLike;
  spender: AddressLike;
  value: BigNumberish;
  nonce: BigNumberish;
  deadline: BigNumberish;
  v: BigNumberish;
  r: BytesLike;
  s: BytesLike;
};

export type SignedPermitStructOutput = [
  owner: string,
  spender: string,
  value: bigint,
  nonce: bigint,
  deadline: bigint,
  v: bigint,
  r: string,
  s: string
] & {
  owner: string;
  spender: string;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
  v: bigint;
  r: string;
  s: string;
};

export interface Vouchers721Interface extends Interface {
  getFunction(
    nameOrSignature:
      | "ID_MULTIPLE"
      | "approve"
      | "balanceOf"
      | "createCrowdtainer"
      | "crowdtainerCount"
      | "crowdtainerForId"
      | "crowdtainerIdToAddress"
      | "getApproved"
      | "getClaimStatus"
      | "getParameters"
      | "getSignature"
      | "idForCrowdtainer"
      | "isApprovedForAll"
      | "join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))"
      | "join(address,uint256[])"
      | "join(address,uint256[],bool,address)"
      | "joinWithSignature"
      | "joinWithSignatureAndPermit"
      | "leave"
      | "metadataServiceForCrowdatinerId"
      | "name"
      | "ownerOf"
      | "productDescription"
      | "safeTransferFrom(address,address,uint256)"
      | "safeTransferFrom(address,address,uint256,bytes)"
      | "setApprovalForAll"
      | "setClaimStatus"
      | "supportsInterface"
      | "symbol"
      | "tokenByIndex"
      | "tokenIdQuantities"
      | "tokenIdToCrowdtainerId"
      | "tokenOfOwnerByIndex"
      | "tokenURI"
      | "totalSupply"
      | "transferFrom"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "Approval"
      | "ApprovalForAll"
      | "CrowdtainerDeployed"
      | "Transfer"
      | "Vouchers721Created"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "ID_MULTIPLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "approve",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "balanceOf",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "createCrowdtainer",
    values: [CampaignDataStruct, string[], AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "crowdtainerCount",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "crowdtainerForId",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "crowdtainerIdToAddress",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getApproved",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getClaimStatus",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getParameters",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getSignature",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "idForCrowdtainer",
    values: [AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "isApprovedForAll",
    values: [AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))",
    values: [
      AddressLike,
      BigNumberish[],
      boolean,
      AddressLike,
      SignedPermitStruct
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "join(address,uint256[])",
    values: [AddressLike, BigNumberish[]]
  ): string;
  encodeFunctionData(
    functionFragment: "join(address,uint256[],bool,address)",
    values: [AddressLike, BigNumberish[], boolean, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "joinWithSignature",
    values: [BytesLike, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "joinWithSignatureAndPermit",
    values: [BytesLike, BytesLike, SignedPermitStruct]
  ): string;
  encodeFunctionData(functionFragment: "leave", values: [BigNumberish]): string;
  encodeFunctionData(
    functionFragment: "metadataServiceForCrowdatinerId",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ownerOf",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "productDescription",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "safeTransferFrom(address,address,uint256)",
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "safeTransferFrom(address,address,uint256,bytes)",
    values: [AddressLike, AddressLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "setApprovalForAll",
    values: [AddressLike, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "setClaimStatus",
    values: [BigNumberish, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "supportsInterface",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "tokenByIndex",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenIdQuantities",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenIdToCrowdtainerId",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenOfOwnerByIndex",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "tokenURI",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "totalSupply",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferFrom",
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "ID_MULTIPLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "createCrowdtainer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "crowdtainerCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "crowdtainerForId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "crowdtainerIdToAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getApproved",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getClaimStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getParameters",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSignature",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "idForCrowdtainer",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isApprovedForAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "join(address,uint256[])",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "join(address,uint256[],bool,address)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "joinWithSignature",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "joinWithSignatureAndPermit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "leave", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "metadataServiceForCrowdatinerId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ownerOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "productDescription",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "safeTransferFrom(address,address,uint256)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "safeTransferFrom(address,address,uint256,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setApprovalForAll",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setClaimStatus",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supportsInterface",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "tokenByIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenIdQuantities",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenIdToCrowdtainerId",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "tokenOfOwnerByIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "tokenURI", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "totalSupply",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferFrom",
    data: BytesLike
  ): Result;
}

export namespace ApprovalEvent {
  export type InputTuple = [
    owner: AddressLike,
    approved: AddressLike,
    tokenId: BigNumberish
  ];
  export type OutputTuple = [owner: string, approved: string, tokenId: bigint];
  export interface OutputObject {
    owner: string;
    approved: string;
    tokenId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace ApprovalForAllEvent {
  export type InputTuple = [
    owner: AddressLike,
    operator: AddressLike,
    approved: boolean
  ];
  export type OutputTuple = [
    owner: string,
    operator: string,
    approved: boolean
  ];
  export interface OutputObject {
    owner: string;
    operator: string;
    approved: boolean;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace CrowdtainerDeployedEvent {
  export type InputTuple = [
    _crowdtainerAddress: AddressLike,
    _nextCrowdtainerId: BigNumberish
  ];
  export type OutputTuple = [
    _crowdtainerAddress: string,
    _nextCrowdtainerId: bigint
  ];
  export interface OutputObject {
    _crowdtainerAddress: string;
    _nextCrowdtainerId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace TransferEvent {
  export type InputTuple = [
    from: AddressLike,
    to: AddressLike,
    tokenId: BigNumberish
  ];
  export type OutputTuple = [from: string, to: string, tokenId: bigint];
  export interface OutputObject {
    from: string;
    to: string;
    tokenId: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace Vouchers721CreatedEvent {
  export type InputTuple = [crowdtainer: AddressLike];
  export type OutputTuple = [crowdtainer: string];
  export interface OutputObject {
    crowdtainer: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface Vouchers721 extends BaseContract {
  connect(runner?: ContractRunner | null): Vouchers721;
  waitForDeployment(): Promise<this>;

  interface: Vouchers721Interface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  ID_MULTIPLE: TypedContractMethod<[], [bigint], "view">;

  approve: TypedContractMethod<
    [to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;

  balanceOf: TypedContractMethod<[owner: AddressLike], [bigint], "view">;

  createCrowdtainer: TypedContractMethod<
    [
      _campaignData: CampaignDataStruct,
      _productDescription: string[],
      _metadataService: AddressLike
    ],
    [[string, bigint]],
    "nonpayable"
  >;

  crowdtainerCount: TypedContractMethod<[], [bigint], "view">;

  crowdtainerForId: TypedContractMethod<[arg0: BigNumberish], [string], "view">;

  crowdtainerIdToAddress: TypedContractMethod<
    [_crowdtainerId: BigNumberish],
    [string],
    "view"
  >;

  getApproved: TypedContractMethod<[tokenId: BigNumberish], [string], "view">;

  getClaimStatus: TypedContractMethod<
    [_tokenId: BigNumberish],
    [boolean],
    "view"
  >;

  getParameters: TypedContractMethod<[data: BytesLike], [string], "view">;

  getSignature: TypedContractMethod<[data: BytesLike], [string], "view">;

  idForCrowdtainer: TypedContractMethod<[arg0: AddressLike], [bigint], "view">;

  isApprovedForAll: TypedContractMethod<
    [owner: AddressLike, operator: AddressLike],
    [boolean],
    "view"
  >;

  "join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))": TypedContractMethod<
    [
      _crowdtainer: AddressLike,
      _quantities: BigNumberish[],
      _enableReferral: boolean,
      _referrer: AddressLike,
      _signedPermit: SignedPermitStruct
    ],
    [bigint],
    "nonpayable"
  >;

  "join(address,uint256[])": TypedContractMethod<
    [_crowdtainer: AddressLike, _quantities: BigNumberish[]],
    [bigint],
    "nonpayable"
  >;

  "join(address,uint256[],bool,address)": TypedContractMethod<
    [
      _crowdtainer: AddressLike,
      _quantities: BigNumberish[],
      _enableReferral: boolean,
      _referrer: AddressLike
    ],
    [bigint],
    "nonpayable"
  >;

  joinWithSignature: TypedContractMethod<
    [result: BytesLike, extraData: BytesLike],
    [bigint],
    "nonpayable"
  >;

  joinWithSignatureAndPermit: TypedContractMethod<
    [
      result: BytesLike,
      extraData: BytesLike,
      _signedPermit: SignedPermitStruct
    ],
    [bigint],
    "nonpayable"
  >;

  leave: TypedContractMethod<[_tokenId: BigNumberish], [void], "nonpayable">;

  metadataServiceForCrowdatinerId: TypedContractMethod<
    [arg0: BigNumberish],
    [string],
    "view"
  >;

  name: TypedContractMethod<[], [string], "view">;

  ownerOf: TypedContractMethod<[tokenId: BigNumberish], [string], "view">;

  productDescription: TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [string],
    "view"
  >;

  "safeTransferFrom(address,address,uint256)": TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;

  "safeTransferFrom(address,address,uint256,bytes)": TypedContractMethod<
    [
      from: AddressLike,
      to: AddressLike,
      tokenId: BigNumberish,
      data: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  setApprovalForAll: TypedContractMethod<
    [operator: AddressLike, approved: boolean],
    [void],
    "nonpayable"
  >;

  setClaimStatus: TypedContractMethod<
    [_tokenId: BigNumberish, _value: boolean],
    [void],
    "nonpayable"
  >;

  supportsInterface: TypedContractMethod<
    [interfaceId: BytesLike],
    [boolean],
    "view"
  >;

  symbol: TypedContractMethod<[], [string], "view">;

  tokenByIndex: TypedContractMethod<[index: BigNumberish], [bigint], "view">;

  tokenIdQuantities: TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [bigint],
    "view"
  >;

  tokenIdToCrowdtainerId: TypedContractMethod<
    [_tokenId: BigNumberish],
    [bigint],
    "view"
  >;

  tokenOfOwnerByIndex: TypedContractMethod<
    [owner: AddressLike, index: BigNumberish],
    [bigint],
    "view"
  >;

  tokenURI: TypedContractMethod<[_tokenId: BigNumberish], [string], "view">;

  totalSupply: TypedContractMethod<[], [bigint], "view">;

  transferFrom: TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "ID_MULTIPLE"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "approve"
  ): TypedContractMethod<
    [to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "balanceOf"
  ): TypedContractMethod<[owner: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "createCrowdtainer"
  ): TypedContractMethod<
    [
      _campaignData: CampaignDataStruct,
      _productDescription: string[],
      _metadataService: AddressLike
    ],
    [[string, bigint]],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "crowdtainerCount"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "crowdtainerForId"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "crowdtainerIdToAddress"
  ): TypedContractMethod<[_crowdtainerId: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "getApproved"
  ): TypedContractMethod<[tokenId: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "getClaimStatus"
  ): TypedContractMethod<[_tokenId: BigNumberish], [boolean], "view">;
  getFunction(
    nameOrSignature: "getParameters"
  ): TypedContractMethod<[data: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "getSignature"
  ): TypedContractMethod<[data: BytesLike], [string], "view">;
  getFunction(
    nameOrSignature: "idForCrowdtainer"
  ): TypedContractMethod<[arg0: AddressLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "isApprovedForAll"
  ): TypedContractMethod<
    [owner: AddressLike, operator: AddressLike],
    [boolean],
    "view"
  >;
  getFunction(
    nameOrSignature: "join(address,uint256[],bool,address,(address,address,uint256,uint256,uint256,uint8,bytes32,bytes32))"
  ): TypedContractMethod<
    [
      _crowdtainer: AddressLike,
      _quantities: BigNumberish[],
      _enableReferral: boolean,
      _referrer: AddressLike,
      _signedPermit: SignedPermitStruct
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "join(address,uint256[])"
  ): TypedContractMethod<
    [_crowdtainer: AddressLike, _quantities: BigNumberish[]],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "join(address,uint256[],bool,address)"
  ): TypedContractMethod<
    [
      _crowdtainer: AddressLike,
      _quantities: BigNumberish[],
      _enableReferral: boolean,
      _referrer: AddressLike
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "joinWithSignature"
  ): TypedContractMethod<
    [result: BytesLike, extraData: BytesLike],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "joinWithSignatureAndPermit"
  ): TypedContractMethod<
    [
      result: BytesLike,
      extraData: BytesLike,
      _signedPermit: SignedPermitStruct
    ],
    [bigint],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "leave"
  ): TypedContractMethod<[_tokenId: BigNumberish], [void], "nonpayable">;
  getFunction(
    nameOrSignature: "metadataServiceForCrowdatinerId"
  ): TypedContractMethod<[arg0: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "name"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "ownerOf"
  ): TypedContractMethod<[tokenId: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "productDescription"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [string],
    "view"
  >;
  getFunction(
    nameOrSignature: "safeTransferFrom(address,address,uint256)"
  ): TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "safeTransferFrom(address,address,uint256,bytes)"
  ): TypedContractMethod<
    [
      from: AddressLike,
      to: AddressLike,
      tokenId: BigNumberish,
      data: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setApprovalForAll"
  ): TypedContractMethod<
    [operator: AddressLike, approved: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "setClaimStatus"
  ): TypedContractMethod<
    [_tokenId: BigNumberish, _value: boolean],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "supportsInterface"
  ): TypedContractMethod<[interfaceId: BytesLike], [boolean], "view">;
  getFunction(
    nameOrSignature: "symbol"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "tokenByIndex"
  ): TypedContractMethod<[index: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "tokenIdQuantities"
  ): TypedContractMethod<
    [arg0: BigNumberish, arg1: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "tokenIdToCrowdtainerId"
  ): TypedContractMethod<[_tokenId: BigNumberish], [bigint], "view">;
  getFunction(
    nameOrSignature: "tokenOfOwnerByIndex"
  ): TypedContractMethod<
    [owner: AddressLike, index: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "tokenURI"
  ): TypedContractMethod<[_tokenId: BigNumberish], [string], "view">;
  getFunction(
    nameOrSignature: "totalSupply"
  ): TypedContractMethod<[], [bigint], "view">;
  getFunction(
    nameOrSignature: "transferFrom"
  ): TypedContractMethod<
    [from: AddressLike, to: AddressLike, tokenId: BigNumberish],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "Approval"
  ): TypedContractEvent<
    ApprovalEvent.InputTuple,
    ApprovalEvent.OutputTuple,
    ApprovalEvent.OutputObject
  >;
  getEvent(
    key: "ApprovalForAll"
  ): TypedContractEvent<
    ApprovalForAllEvent.InputTuple,
    ApprovalForAllEvent.OutputTuple,
    ApprovalForAllEvent.OutputObject
  >;
  getEvent(
    key: "CrowdtainerDeployed"
  ): TypedContractEvent<
    CrowdtainerDeployedEvent.InputTuple,
    CrowdtainerDeployedEvent.OutputTuple,
    CrowdtainerDeployedEvent.OutputObject
  >;
  getEvent(
    key: "Transfer"
  ): TypedContractEvent<
    TransferEvent.InputTuple,
    TransferEvent.OutputTuple,
    TransferEvent.OutputObject
  >;
  getEvent(
    key: "Vouchers721Created"
  ): TypedContractEvent<
    Vouchers721CreatedEvent.InputTuple,
    Vouchers721CreatedEvent.OutputTuple,
    Vouchers721CreatedEvent.OutputObject
  >;

  filters: {
    "Approval(address,address,uint256)": TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;
    Approval: TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;

    "ApprovalForAll(address,address,bool)": TypedContractEvent<
      ApprovalForAllEvent.InputTuple,
      ApprovalForAllEvent.OutputTuple,
      ApprovalForAllEvent.OutputObject
    >;
    ApprovalForAll: TypedContractEvent<
      ApprovalForAllEvent.InputTuple,
      ApprovalForAllEvent.OutputTuple,
      ApprovalForAllEvent.OutputObject
    >;

    "CrowdtainerDeployed(address,uint256)": TypedContractEvent<
      CrowdtainerDeployedEvent.InputTuple,
      CrowdtainerDeployedEvent.OutputTuple,
      CrowdtainerDeployedEvent.OutputObject
    >;
    CrowdtainerDeployed: TypedContractEvent<
      CrowdtainerDeployedEvent.InputTuple,
      CrowdtainerDeployedEvent.OutputTuple,
      CrowdtainerDeployedEvent.OutputObject
    >;

    "Transfer(address,address,uint256)": TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;
    Transfer: TypedContractEvent<
      TransferEvent.InputTuple,
      TransferEvent.OutputTuple,
      TransferEvent.OutputObject
    >;

    "Vouchers721Created(address)": TypedContractEvent<
      Vouchers721CreatedEvent.InputTuple,
      Vouchers721CreatedEvent.OutputTuple,
      Vouchers721CreatedEvent.OutputObject
    >;
    Vouchers721Created: TypedContractEvent<
      Vouchers721CreatedEvent.InputTuple,
      Vouchers721CreatedEvent.OutputTuple,
      Vouchers721CreatedEvent.OutputObject
    >;
  };
}
