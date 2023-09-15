/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type { ICrowdtainer, ICrowdtainerInterface } from "../ICrowdtainer";

const _abi = [
  {
    inputs: [],
    name: "crowdtainerState",
    outputs: [
      {
        internalType: "enum CrowdtainerState",
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
        name: "owner",
        type: "address",
      },
      {
        components: [
          {
            internalType: "address",
            name: "shippingAgent",
            type: "address",
          },
          {
            internalType: "address",
            name: "signer",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "openingTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expireTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "targetMinimum",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "targetMaximum",
            type: "uint256",
          },
          {
            internalType: "uint256[]",
            name: "unitPricePerType",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "referralRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "referralEligibilityValue",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "string",
            name: "legalContractURI",
            type: "string",
          },
        ],
        internalType: "struct CampaignData",
        name: "_campaignData",
        type: "tuple",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "_quantities",
        type: "uint256[]",
      },
    ],
    name: "join",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "_quantities",
        type: "uint256[]",
      },
      {
        internalType: "bool",
        name: "_enableReferral",
        type: "bool",
      },
      {
        internalType: "address",
        name: "_referrer",
        type: "address",
      },
    ],
    name: "join",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_wallet",
        type: "address",
      },
    ],
    name: "leave",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "numberOfProducts",
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
    name: "shippingAgent",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "unitPricePerType",
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
] as const;

export class ICrowdtainer__factory {
  static readonly abi = _abi;
  static createInterface(): ICrowdtainerInterface {
    return new utils.Interface(_abi) as ICrowdtainerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ICrowdtainer {
    return new Contract(address, _abi, signerOrProvider) as ICrowdtainer;
  }
}
