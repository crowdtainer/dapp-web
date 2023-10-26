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
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "./common";

export type MetadataStruct = {
  crowdtainerId: BigNumberish;
  tokenId: BigNumberish;
  currentOwner: AddressLike;
  claimed: boolean;
  unitPricePerType: BigNumberish[];
  quantities: BigNumberish[];
  productDescription: string[];
  numberOfProducts: BigNumberish;
};

export type MetadataStructOutput = [
  crowdtainerId: bigint,
  tokenId: bigint,
  currentOwner: string,
  claimed: boolean,
  unitPricePerType: bigint[],
  quantities: bigint[],
  productDescription: string[],
  numberOfProducts: bigint
] & {
  crowdtainerId: bigint;
  tokenId: bigint;
  currentOwner: string;
  claimed: boolean;
  unitPricePerType: bigint[];
  quantities: bigint[];
  productDescription: string[];
  numberOfProducts: bigint;
};

export interface IMetadataServiceInterface extends Interface {
  getFunction(nameOrSignature: "uri"): FunctionFragment;

  encodeFunctionData(functionFragment: "uri", values: [MetadataStruct]): string;

  decodeFunctionResult(functionFragment: "uri", data: BytesLike): Result;
}

export interface IMetadataService extends BaseContract {
  connect(runner?: ContractRunner | null): IMetadataService;
  waitForDeployment(): Promise<this>;

  interface: IMetadataServiceInterface;

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

  uri: TypedContractMethod<[arg0: MetadataStruct], [string], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "uri"
  ): TypedContractMethod<[arg0: MetadataStruct], [string], "view">;

  filters: {};
}
