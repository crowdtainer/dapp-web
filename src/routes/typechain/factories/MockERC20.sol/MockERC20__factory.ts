/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Signer,
  utils,
  Contract,
  ContractFactory
} from "ethers";
import type { BigNumberish, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../common";
import type {
  MockERC20,
  MockERC20Interface,
} from "../../MockERC20.sol/MockERC20";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60e06040523480156200001157600080fd5b50604051620011dd380380620011dd8339810160408190526200003491620001db565b8282826000620000458482620002ef565b506001620000548382620002ef565b5060ff81166080524660a0526200006a6200007a565b60c0525062000439945050505050565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f6000604051620000ae9190620003bb565b6040805191829003822060208301939093528101919091527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660608201524660808201523060a082015260c00160405160208183030381529060405280519060200120905090565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200013e57600080fd5b81516001600160401b03808211156200015b576200015b62000116565b604051601f8301601f19908116603f0116810190828211818310171562000186576200018662000116565b81604052838152602092508683858801011115620001a357600080fd5b600091505b83821015620001c75785820183015181830184015290820190620001a8565b600093810190920192909252949350505050565b600080600060608486031215620001f157600080fd5b83516001600160401b03808211156200020957600080fd5b62000217878388016200012c565b945060208601519150808211156200022e57600080fd5b506200023d868287016200012c565b925050604084015160ff811681146200025557600080fd5b809150509250925092565b600181811c908216806200027557607f821691505b6020821081036200029657634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620002ea57600081815260208120601f850160051c81016020861015620002c55750805b601f850160051c820191505b81811015620002e657828155600101620002d1565b5050505b505050565b81516001600160401b038111156200030b576200030b62000116565b62000323816200031c845462000260565b846200029c565b602080601f8311600181146200035b5760008415620003425750858301515b600019600386901b1c1916600185901b178555620002e6565b600085815260208120601f198616915b828110156200038c578886015182559484019460019091019084016200036b565b5085821015620003ab5787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b6000808354620003cb8162000260565b60018281168015620003e65760018114620003fc576200042d565b60ff19841687528215158302870194506200042d565b8760005260208060002060005b85811015620004245781548a82015290840190820162000409565b50505082870194505b50929695505050505050565b60805160a05160c051610d74620004696000396000610605015260006105d00152600061015f0152610d746000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806370a082311161008c5780639dc29fac116100665780639dc29fac146101f8578063a9059cbb1461020b578063d505accf1461021e578063dd62ed3e1461023157600080fd5b806370a08231146101b05780637ecebe00146101d057806395d89b41146101f057600080fd5b806323b872dd116100c857806323b872dd14610147578063313ce5671461015a5780633644e5151461019357806340c10f191461019b57600080fd5b806306fdde03146100ef578063095ea7b31461010d57806318160ddd14610130575b600080fd5b6100f761025c565b6040516101049190610a91565b60405180910390f35b61012061011b366004610afb565b6102ea565b6040519015158152602001610104565b61013960025481565b604051908152602001610104565b610120610155366004610b25565b610357565b6101817f000000000000000000000000000000000000000000000000000000000000000081565b60405160ff9091168152602001610104565b6101396105cc565b6101ae6101a9366004610afb565b610627565b005b6101396101be366004610b61565b60036020526000908152604090205481565b6101396101de366004610b61565b60056020526000908152604090205481565b6100f7610635565b6101ae610206366004610afb565b610642565b610120610219366004610afb565b61064c565b6101ae61022c366004610b83565b6106c4565b61013961023f366004610bf6565b600460209081526000928352604080842090915290825290205481565b6000805461026990610c29565b80601f016020809104026020016040519081016040528092919081815260200182805461029590610c29565b80156102e25780601f106102b7576101008083540402835291602001916102e2565b820191906000526020600020905b8154815290600101906020018083116102c557829003601f168201915b505050505081565b3360008181526004602090815260408083206001600160a01b038716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906103459086815260200190565b60405180910390a35060015b92915050565b6001600160a01b038316600081815260046020908152604080832033845282528083205493835260039091528120549091908311156103dd5760405162461bcd60e51b815260206004820152601960248201527f436f696e2f696e73756666696369656e742d62616c616e63650000000000000060448201526064015b60405180910390fd5b6001600160a01b0384166104335760405162461bcd60e51b815260206004820152600d60248201527f436f696e2f6e756c6c2d6473740000000000000000000000000000000000000060448201526064016103d4565b306001600160a01b0385160361048b5760405162461bcd60e51b815260206004820181905260248201527f436f696e2f6473742d63616e6e6f742d62652d746869732d636f6e747261637460448201526064016103d4565b6001600160a01b03851660009081526004602090815260408083203384529091529020548311156104fe5760405162461bcd60e51b815260206004820152601b60248201527f436f696e2f696e73756666696369656e742d616c6c6f77616e6365000000000060448201526064016103d4565b6000198114610536576105118382610c79565b6001600160a01b03861660009081526004602090815260408083203384529091529020555b6001600160a01b0385166000908152600360205260408120805485929061055e908490610c79565b90915550506001600160a01b03808516600081815260036020526040908190208054870190555190918716907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906105b99087815260200190565b60405180910390a3506001949350505050565b60007f00000000000000000000000000000000000000000000000000000000000000004614610602576105fd610917565b905090565b507f000000000000000000000000000000000000000000000000000000000000000090565b61063182826109b1565b5050565b6001805461026990610c29565b6106318282610a1d565b3360009081526003602052604081208054839190839061066d908490610c79565b90915550506001600160a01b038316600081815260036020526040908190208054850190555133907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906103459086815260200190565b428410156107145760405162461bcd60e51b815260206004820152601760248201527f5045524d49545f444541444c494e455f4558504952454400000000000000000060448201526064016103d4565b600060016107206105cc565b6001600160a01b038a811660008181526005602090815260409182902080546001810190915582517f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98184015280840194909452938d166060840152608083018c905260a083019390935260c08083018b90528151808403909101815260e08301909152805192019190912061190160f01b6101008301526101028201929092526101228101919091526101420160408051601f198184030181528282528051602091820120600084529083018083525260ff871690820152606081018590526080810184905260a0016020604051602081039080840390855afa15801561082c573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116158015906108625750876001600160a01b0316816001600160a01b0316145b6108ae5760405162461bcd60e51b815260206004820152600e60248201527f494e56414c49445f5349474e455200000000000000000000000000000000000060448201526064016103d4565b6001600160a01b0390811660009081526004602090815260408083208a8516808552908352928190208990555188815291928a16917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a350505050505050565b60007f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60006040516109499190610c8c565b6040805191829003822060208301939093528101919091527fc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc660608201524660808201523060a082015260c00160405160208183030381529060405280519060200120905090565b80600260008282546109c39190610d2b565b90915550506001600160a01b0382166000818152600360209081526040808320805486019055518481527fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91015b60405180910390a35050565b6001600160a01b03821660009081526003602052604081208054839290610a45908490610c79565b90915550506002805482900390556040518181526000906001600160a01b038416907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610a11565b600060208083528351808285015260005b81811015610abe57858101830151858201604001528201610aa2565b506000604082860101526040601f19601f8301168501019250505092915050565b80356001600160a01b0381168114610af657600080fd5b919050565b60008060408385031215610b0e57600080fd5b610b1783610adf565b946020939093013593505050565b600080600060608486031215610b3a57600080fd5b610b4384610adf565b9250610b5160208501610adf565b9150604084013590509250925092565b600060208284031215610b7357600080fd5b610b7c82610adf565b9392505050565b600080600080600080600060e0888a031215610b9e57600080fd5b610ba788610adf565b9650610bb560208901610adf565b95506040880135945060608801359350608088013560ff81168114610bd957600080fd5b9699959850939692959460a0840135945060c09093013592915050565b60008060408385031215610c0957600080fd5b610c1283610adf565b9150610c2060208401610adf565b90509250929050565b600181811c90821680610c3d57607f821691505b602082108103610c5d57634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b8181038181111561035157610351610c63565b600080835481600182811c915080831680610ca857607f831692505b60208084108203610cc757634e487b7160e01b86526022600452602486fd5b818015610cdb5760018114610cf057610d1d565b60ff1986168952841515850289019650610d1d565b60008a81526020902060005b86811015610d155781548b820152908501908301610cfc565b505084890196505b509498975050505050505050565b8082018082111561035157610351610c6356fea2646970667358221220dd9e24edec57ec68e2856d7bc968e8257c2d65a130b6bf85fd032182372687cc64736f6c63430008150033";

type MockERC20ConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MockERC20ConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MockERC20__factory extends ContractFactory {
  constructor(...args: MockERC20ConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    _decimals: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<MockERC20> {
    return super.deploy(
      _name,
      _symbol,
      _decimals,
      overrides || {}
    ) as Promise<MockERC20>;
  }
  override getDeployTransaction(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    _decimals: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _name,
      _symbol,
      _decimals,
      overrides || {}
    );
  }
  override attach(address: string): MockERC20 {
    return super.attach(address) as MockERC20;
  }
  override connect(signer: Signer): MockERC20__factory {
    return super.connect(signer) as MockERC20__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MockERC20Interface {
    return new utils.Interface(_abi) as MockERC20Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): MockERC20 {
    return new Contract(address, _abi, signerOrProvider) as MockERC20;
  }
}
