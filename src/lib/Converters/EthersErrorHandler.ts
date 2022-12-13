// Utility functions to convert ethers.js errors to typescript types.
// Perhaps this file can be deleted if https://github.com/dethcrypto/TypeChain/pull/682 is ever finished/merged.

import { type Result, Ok, Err } from "@sniptt/monads";
import { CrowdtainerErrors } from '$lib/Converters/SolidityCustomErrors';
import { ethers } from "ethers";

// JSON decoding types mappings

export interface RPCException {
  code: number
  message: string
  stack: string
}

export interface EthersException {
  reason: string
  code: string
  method: string
  transaction: Transaction
  error: Error
}

export interface Transaction {
  from: string
  to: string
  data: string
  accessList: any
}

export interface Error {
  code: number
  message: string
  data: Data
}

export interface Data {
  code: number
  message: string
  data: Data2
}

export interface Data2 {
  message: string
  data: string
}

// RPC Error

export interface RPCErrorRoot {
  value: Value
}

export interface Value {
  code: number
  data: Payload
}

export interface Payload {
  code: number
  message: string
  data: Payload2
}

export interface Payload2 {
  message: string
  txHash: string
  data: string
}

function capitalizeFirstLetter(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

// Conversion functions

let functionSignatures = new Map<string, string>(); // key: function signature (hash) -> value: function name (ABI)
let errorsABI = new Array<string>();                // Known errors
let ethersInterface: ethers.utils.Interface;

export function decodeEthersError(error: any): Result<string, string> {
  // Note: Ethers.js seems to return different error formats depending on the error..

  try {
    if (functionSignatures.size === 0) {
      for (var index in CrowdtainerErrors) {
        errorsABI.push(`function ${CrowdtainerErrors[index]}`);
      }

      ethersInterface = new ethers.utils.Interface(errorsABI);

      for (var index in CrowdtainerErrors) {
        functionSignatures.set(ethersInterface.getSighash(CrowdtainerErrors[index]), CrowdtainerErrors[index]);
      }
    }

    let errorData: string = '';
    let errorSignature: string = '';
    let isCustomError: boolean;
    try {
      // Crowdtainer specific errors
      let ethersError: EthersException = JSON.parse(JSON.stringify(error));
      isCustomError = ethersError.reason.includes('custom error');
      if (isCustomError) {
        errorData = ethersError.reason;
        errorSignature = errorData.substring(0, 10);
      }
    } catch (suberror) {
      let rpcError: RPCException = JSON.parse(JSON.stringify(error));
      let message = rpcError.message;
      message = message.substring(message.indexOf('{')).slice(0, -1);

      let rpcInnerError: RPCErrorRoot = JSON.parse(message);
      let rpcInnerErrorMessage = rpcInnerError.value.data.message;

      isCustomError = rpcInnerErrorMessage.includes('custom error');
      if (isCustomError) {
        const matches = rpcInnerErrorMessage.match(/.*custom error '(.*)'/);
        if (matches) {
          errorSignature = matches[1].substring(0, matches[1].indexOf('('));
        }
      }
    }

    if (isCustomError) {
      let knownError = functionSignatures.get(errorSignature);
      if (knownError !== undefined) {
        let theError = knownError.substring(0, knownError.indexOf('('));
        if (theError === 'CallerNotAllowed') {
          const decoded = ethersInterface.decodeFunctionData(
            ethersInterface.functions["CallerNotAllowed(address,address)"],
            errorData
          );
          let fullMessage = "\nCaller not allowed. " +
            `\nExpected: ${decoded.expected.toString()}` +
            `\n  actual: ${decoded.actual.toString()}.`
          return Ok(fullMessage);
        }
        return Ok(theError);
      }
      if (errorSignature === 'SignatureExpired') {
        return Ok('Your authorization token expired. Please try again.');
      }
    }
  } catch (error) {
    return Err(JSON.stringify(error));
  }

  // Ethers errors - needs rewrite when implementing localisation.
  if (error.message !== undefined) {
    let ethersError = error.code.toLowerCase().replaceAll("_", " ");
    return Ok(`${capitalizeFirstLetter(ethersError)}. ${capitalizeFirstLetter(error.error.message)}.`);
  }
  return Err("Unknown");
}