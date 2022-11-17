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
import type { Coin, CoinInterface } from "../../External/Coin";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId_",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddAuthorization",
    type: "event",
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
        name: "value",
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
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "RemoveAuthorization",
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
        name: "value",
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
    inputs: [],
    name: "PERMIT_TYPEHASH",
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
        name: "account",
        type: "address",
      },
    ],
    name: "addAuthorization",
    outputs: [],
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
        name: "usr",
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
    name: "authorizedAccounts",
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
        name: "usr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
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
    name: "chainId",
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
        name: "usr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "src",
        type: "address",
      },
      {
        internalType: "address",
        name: "dst",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "move",
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
        name: "holder",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expiry",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "allowed",
        type: "bool",
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
    inputs: [
      {
        internalType: "address",
        name: "usr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "pull",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "usr",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "push",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "removeAuthorization",
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
        name: "dst",
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
        name: "src",
        type: "address",
      },
      {
        internalType: "address",
        name: "dst",
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
  {
    inputs: [],
    name: "version",
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
];

const _bytecode =
  "0x60c060405260016080908152603160f81b60a052600390620000229082620001fd565b503480156200003057600080fd5b5060405162001aec38038062001aec833981016040819052620000539162000378565b336000908152602081905260409020600190819055620000748482620001fd565b506002620000838382620001fd565b5060048190556040517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f90620000bc90600190620003eb565b60405180910390206003604051620000d59190620003eb565b6040805191829003822060208301949094528101919091526060810191909152608081018290523060a082015260c00160408051808303601f190181529082905280516020918201206009553382527f599a298163e1678bb1c676052a8930bf0b8a1261ed6e01b8a2391e55f7000102910160405180910390a150505062000469565b634e487b7160e01b600052604160045260246000fd5b600181811c908216806200018357607f821691505b602082108103620001a457634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620001f857600081815260208120601f850160051c81016020861015620001d35750805b601f850160051c820191505b81811015620001f457828155600101620001df565b5050505b505050565b81516001600160401b0381111562000219576200021962000158565b62000231816200022a84546200016e565b84620001aa565b602080601f831160018114620002695760008415620002505750858301515b600019600386901b1c1916600185901b178555620001f4565b600085815260208120601f198616915b828110156200029a5788860151825594840194600190910190840162000279565b5085821015620002b95787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b600082601f830112620002db57600080fd5b81516001600160401b0380821115620002f857620002f862000158565b604051601f8301601f19908116603f0116810190828211818310171562000323576200032362000158565b816040528381526020925086838588010111156200034057600080fd5b600091505b8382101562000364578582018301518183018401529082019062000345565b600093810190920192909252949350505050565b6000806000606084860312156200038e57600080fd5b83516001600160401b0380821115620003a657600080fd5b620003b487838801620002c9565b94506020860151915080821115620003cb57600080fd5b50620003da86828701620002c9565b925050604084015190509250925092565b6000808354620003fb816200016e565b600182811680156200041657600181146200042c576200045d565b60ff19841687528215158302870194506200045d565b8760005260208060002060005b85811015620004545781548a82015290840190820162000439565b50505082870194505b50929695505050505050565b61167380620004796000396000f3fe608060405234801561001057600080fd5b506004361061018d5760003560e01c806370a08231116100e35780639dc29fac1161008c578063bb35783b11610066578063bb35783b14610347578063dd62ed3e1461035a578063f2d5d56b1461038557600080fd5b80639dc29fac1461030e578063a9059cbb14610321578063b753a98c1461033457600080fd5b806394f3f81d116100bd57806394f3f81d146102ea57806395d89b41146102fd5780639a8a05921461030557600080fd5b806370a08231146102975780637ecebe00146102b75780638fcbaf0c146102d757600080fd5b806330adf81f116101455780633644e5151161011f5780633644e5151461027357806340c10f191461027c57806354fd4d501461028f57600080fd5b806330adf81f1461021d578063313ce5671461024457806335b281531461025e57600080fd5b806318160ddd1161017657806318160ddd146101d357806323b872dd146101ea57806324ba5884146101fd57600080fd5b806306fdde0314610192578063095ea7b3146101b0575b600080fd5b61019a610398565b6040516101a7919061138a565b60405180910390f35b6101c36101be36600461141f565b610426565b60405190151581526020016101a7565b6101dc60055481565b6040519081526020016101a7565b6101c36101f8366004611449565b6104a0565b6101dc61020b366004611485565b60006020819052908152604090205481565b6101dc7fea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb81565b61024c600681565b60405160ff90911681526020016101a7565b61027161026c366004611485565b610883565b005b6101dc60095481565b61027161028a36600461141f565b61095b565b61019a610a8d565b6101dc6102a5366004611485565b60066020526000908152604090205481565b6101dc6102c5366004611485565b60086020526000908152604090205481565b6102716102e53660046114a0565b610a9a565b6102716102f8366004611485565b610ecb565b61019a610f9b565b6101dc60045481565b61027161031c36600461141f565b610fa8565b6101c361032f36600461141f565b61125a565b61027161034236600461141f565b61126e565b610271610355366004611449565b61127e565b6101dc61036836600461152a565b600760209081526000928352604080842090915290825290205481565b61027161039336600461141f565b61128f565b600180546103a59061155d565b80601f01602080910402602001604051908101604052809291908181526020018280546103d19061155d565b801561041e5780601f106103f35761010080835404028352916020019161041e565b820191906000526020600020905b81548152906001019060200180831161040157829003601f168201915b505050505081565b33600081815260076020908152604080832073ffffffffffffffffffffffffffffffffffffffff8716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9259061048e9086815260200190565b60405180910390a35060015b92915050565b600073ffffffffffffffffffffffffffffffffffffffff8316610524576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600d60248201527f436f696e2f6e756c6c2d6473740000000000000000000000000000000000000060448201526064015b60405180910390fd5b3073ffffffffffffffffffffffffffffffffffffffff8416036105a3576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820181905260248201527f436f696e2f6473742d63616e6e6f742d62652d746869732d636f6e7472616374604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff8416600090815260066020526040902054821115610632576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f436f696e2f696e73756666696369656e742d62616c616e636500000000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff84163314801590610698575073ffffffffffffffffffffffffffffffffffffffff841660009081526007602090815260408083203384529091529020546fffffffffffffffffffffffffffffffff14155b156107a45773ffffffffffffffffffffffffffffffffffffffff84166000908152600760209081526040808320338452909152902054821115610737576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f436f696e2f696e73756666696369656e742d616c6c6f77616e63650000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff84166000908152600760209081526040808320338452909152902054610772908361129a565b73ffffffffffffffffffffffffffffffffffffffff851660009081526007602090815260408083203384529091529020555b73ffffffffffffffffffffffffffffffffffffffff84166000908152600660205260409020546107d4908361129a565b73ffffffffffffffffffffffffffffffffffffffff80861660009081526006602052604080822093909355908516815220546108109083611312565b73ffffffffffffffffffffffffffffffffffffffff80851660008181526006602052604090819020939093559151908616907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906108719086815260200190565b60405180910390a35060019392505050565b336000908152602081905260409020546001146108fc576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f436f696e2f6163636f756e742d6e6f742d617574686f72697a65640000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff8116600081815260208181526040918290206001905590519182527f599a298163e1678bb1c676052a8930bf0b8a1261ed6e01b8a2391e55f700010291015b60405180910390a150565b336000908152602081905260409020546001146109d4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f436f696e2f6163636f756e742d6e6f742d617574686f72697a65640000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260066020526040902054610a049082611312565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260066020526040902055600554610a379082611312565b60055560405181815273ffffffffffffffffffffffffffffffffffffffff8316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef906020015b60405180910390a35050565b600380546103a59061155d565b600954604080517fea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb602082015273ffffffffffffffffffffffffffffffffffffffff808c169282019290925290891660608201526080810188905260a0810187905285151560c08201526000919060e00160405160208183030381529060405280519060200120604051602001610b639291907f190100000000000000000000000000000000000000000000000000000000000081526002810192909252602282015260420190565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190528051602090910120905073ffffffffffffffffffffffffffffffffffffffff8916610c18576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601660248201527f436f696e2f696e76616c69642d616464726573732d3000000000000000000000604482015260640161051b565b60408051600081526020810180835283905260ff861691810191909152606081018490526080810183905260019060a0016020604051602081039080840390855afa158015610c6b573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168973ffffffffffffffffffffffffffffffffffffffff1614610d09576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f436f696e2f696e76616c69642d7065726d697400000000000000000000000000604482015260640161051b565b851580610d165750854211155b610d7c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f436f696e2f7065726d69742d6578706972656400000000000000000000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff89166000908152600860205260408120805491610dad836115df565b919050558714610e19576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601260248201527f436f696e2f696e76616c69642d6e6f6e63650000000000000000000000000000604482015260640161051b565b600085610e27576000610e39565b6fffffffffffffffffffffffffffffffff5b73ffffffffffffffffffffffffffffffffffffffff8b81166000818152600760209081526040808320948f16808452948252918290206fffffffffffffffffffffffffffffffff95909516948590559051848152939450919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a350505050505050505050565b33600090815260208190526040902054600114610f44576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f436f696e2f6163636f756e742d6e6f742d617574686f72697a65640000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff81166000818152602081815260408083209290925590519182527f8834a87e641e9716be4f34527af5d23e11624f1ddeefede6ad75a9acfc31b9039101610950565b600280546103a59061155d565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260066020526040902054811115611037576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601960248201527f436f696e2f696e73756666696369656e742d62616c616e636500000000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff8216331480159061109d575073ffffffffffffffffffffffffffffffffffffffff821660009081526007602090815260408083203384529091529020546fffffffffffffffffffffffffffffffff14155b156111a95773ffffffffffffffffffffffffffffffffffffffff8216600090815260076020908152604080832033845290915290205481111561113c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601b60248201527f436f696e2f696e73756666696369656e742d616c6c6f77616e63650000000000604482015260640161051b565b73ffffffffffffffffffffffffffffffffffffffff82166000908152600760209081526040808320338452909152902054611177908261129a565b73ffffffffffffffffffffffffffffffffffffffff831660009081526007602090815260408083203384529091529020555b73ffffffffffffffffffffffffffffffffffffffff82166000908152600660205260409020546111d9908261129a565b73ffffffffffffffffffffffffffffffffffffffff831660009081526006602052604090205560055461120c908261129a565b60055560405181815260009073ffffffffffffffffffffffffffffffffffffffff8416907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef90602001610a81565b60006112673384846104a0565b9392505050565b6112793383836104a0565b505050565b6112898383836104a0565b50505050565b6112798233836104a0565b6000826112a78382611617565b915081111561049a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601260248201527f436f696e2f7375622d756e646572666c6f770000000000000000000000000000604482015260640161051b565b60008261131f838261162a565b915081101561049a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601160248201527f436f696e2f6164642d6f766572666c6f77000000000000000000000000000000604482015260640161051b565b600060208083528351808285015260005b818110156113b75785810183015185820160400152820161139b565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8301168501019250505092915050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461141a57600080fd5b919050565b6000806040838503121561143257600080fd5b61143b836113f6565b946020939093013593505050565b60008060006060848603121561145e57600080fd5b611467846113f6565b9250611475602085016113f6565b9150604084013590509250925092565b60006020828403121561149757600080fd5b611267826113f6565b600080600080600080600080610100898b0312156114bd57600080fd5b6114c6896113f6565b97506114d460208a016113f6565b96506040890135955060608901359450608089013580151581146114f757600080fd5b935060a089013560ff8116811461150d57600080fd5b979a969950949793969295929450505060c08201359160e0013590565b6000806040838503121561153d57600080fd5b611546836113f6565b9150611554602084016113f6565b90509250929050565b600181811c9082168061157157607f821691505b6020821081036115aa577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611610576116106115b0565b5060010190565b8181038181111561049a5761049a6115b0565b8082018082111561049a5761049a6115b056fea26469706673582212203da8d8f34a5631e0c618eba7ce9d5b915eb89c2042d2ddd7887700c8387c041c64736f6c63430008100033";

type CoinConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CoinConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Coin__factory extends ContractFactory {
  constructor(...args: CoinConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    chainId_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<Coin> {
    return super.deploy(
      name_,
      symbol_,
      chainId_,
      overrides || {}
    ) as Promise<Coin>;
  }
  override getDeployTransaction(
    name_: PromiseOrValue<string>,
    symbol_: PromiseOrValue<string>,
    chainId_: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      name_,
      symbol_,
      chainId_,
      overrides || {}
    );
  }
  override attach(address: string): Coin {
    return super.attach(address) as Coin;
  }
  override connect(signer: Signer): Coin__factory {
    return super.connect(signer) as Coin__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CoinInterface {
    return new utils.Interface(_abi) as CoinInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Coin {
    return new Contract(address, _abi, signerOrProvider) as Coin;
  }
}