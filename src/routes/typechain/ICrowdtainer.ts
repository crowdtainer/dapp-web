/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "./common";

export type CampaignDataStruct = {
  shippingAgent: PromiseOrValue<string>;
  signer: PromiseOrValue<string>;
  openingTime: PromiseOrValue<BigNumberish>;
  expireTime: PromiseOrValue<BigNumberish>;
  targetMinimum: PromiseOrValue<BigNumberish>;
  targetMaximum: PromiseOrValue<BigNumberish>;
  unitPricePerType: PromiseOrValue<BigNumberish>[];
  referralRate: PromiseOrValue<BigNumberish>;
  referralEligibilityValue: PromiseOrValue<BigNumberish>;
  token: PromiseOrValue<string>;
  legalContractURI: PromiseOrValue<string>;
};

export type CampaignDataStructOutput = [
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber,
  BigNumber[],
  BigNumber,
  BigNumber,
  string,
  string
] & {
  shippingAgent: string;
  signer: string;
  openingTime: BigNumber;
  expireTime: BigNumber;
  targetMinimum: BigNumber;
  targetMaximum: BigNumber;
  unitPricePerType: BigNumber[];
  referralRate: BigNumber;
  referralEligibilityValue: BigNumber;
  token: string;
  legalContractURI: string;
};

export interface ICrowdtainerInterface extends utils.Interface {
  functions: {
    "crowdtainerState()": FunctionFragment;
    "initialize(address,(address,address,uint256,uint256,uint256,uint256,uint256[],uint256,uint256,address,string))": FunctionFragment;
    "join(address,uint256[])": FunctionFragment;
    "join(address,uint256[],bool,address)": FunctionFragment;
    "leave(address)": FunctionFragment;
    "numberOfProducts()": FunctionFragment;
    "shippingAgent()": FunctionFragment;
    "unitPricePerType(uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "crowdtainerState"
      | "initialize"
      | "join(address,uint256[])"
      | "join(address,uint256[],bool,address)"
      | "leave"
      | "numberOfProducts"
      | "shippingAgent"
      | "unitPricePerType"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "crowdtainerState",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [PromiseOrValue<string>, CampaignDataStruct]
  ): string;
  encodeFunctionData(
    functionFragment: "join(address,uint256[])",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "join(address,uint256[],bool,address)",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<BigNumberish>[],
      PromiseOrValue<boolean>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "leave",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "numberOfProducts",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "shippingAgent",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "unitPricePerType",
    values: [PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(
    functionFragment: "crowdtainerState",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "join(address,uint256[])",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "join(address,uint256[],bool,address)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "leave", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "numberOfProducts",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "shippingAgent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "unitPricePerType",
    data: BytesLike
  ): Result;

  events: {};
}

export interface ICrowdtainer extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ICrowdtainerInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    crowdtainerState(overrides?: CallOverrides): Promise<[number]>;

    initialize(
      owner: PromiseOrValue<string>,
      _campaignData: CampaignDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    "join(address,uint256[])"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    "join(address,uint256[],bool,address)"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      _enableReferral: PromiseOrValue<boolean>,
      _referrer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    leave(
      _wallet: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    numberOfProducts(overrides?: CallOverrides): Promise<[BigNumber]>;

    shippingAgent(overrides?: CallOverrides): Promise<[string]>;

    unitPricePerType(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;
  };

  crowdtainerState(overrides?: CallOverrides): Promise<number>;

  initialize(
    owner: PromiseOrValue<string>,
    _campaignData: CampaignDataStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  "join(address,uint256[])"(
    _wallet: PromiseOrValue<string>,
    _quantities: PromiseOrValue<BigNumberish>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  "join(address,uint256[],bool,address)"(
    _wallet: PromiseOrValue<string>,
    _quantities: PromiseOrValue<BigNumberish>[],
    _enableReferral: PromiseOrValue<boolean>,
    _referrer: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  leave(
    _wallet: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  numberOfProducts(overrides?: CallOverrides): Promise<BigNumber>;

  shippingAgent(overrides?: CallOverrides): Promise<string>;

  unitPricePerType(
    arg0: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  callStatic: {
    crowdtainerState(overrides?: CallOverrides): Promise<number>;

    initialize(
      owner: PromiseOrValue<string>,
      _campaignData: CampaignDataStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    "join(address,uint256[])"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<void>;

    "join(address,uint256[],bool,address)"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      _enableReferral: PromiseOrValue<boolean>,
      _referrer: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    leave(
      _wallet: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    numberOfProducts(overrides?: CallOverrides): Promise<BigNumber>;

    shippingAgent(overrides?: CallOverrides): Promise<string>;

    unitPricePerType(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {};

  estimateGas: {
    crowdtainerState(overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      owner: PromiseOrValue<string>,
      _campaignData: CampaignDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    "join(address,uint256[])"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    "join(address,uint256[],bool,address)"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      _enableReferral: PromiseOrValue<boolean>,
      _referrer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    leave(
      _wallet: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    numberOfProducts(overrides?: CallOverrides): Promise<BigNumber>;

    shippingAgent(overrides?: CallOverrides): Promise<BigNumber>;

    unitPricePerType(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    crowdtainerState(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      owner: PromiseOrValue<string>,
      _campaignData: CampaignDataStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    "join(address,uint256[])"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    "join(address,uint256[],bool,address)"(
      _wallet: PromiseOrValue<string>,
      _quantities: PromiseOrValue<BigNumberish>[],
      _enableReferral: PromiseOrValue<boolean>,
      _referrer: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    leave(
      _wallet: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    numberOfProducts(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    shippingAgent(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    unitPricePerType(
      arg0: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
