import { transliterate as tr } from 'transliteration';
import { Ok, Err, type Result } from '@sniptt/monads';

/**
 * Sanitize/validate the string by removing special characters and limiting its length.
 * @param {string} value - The string to be sanitized.
 * @param {number} [maximumSize=100] - Trim the string to a maximum size (default: 300 characters).
 * @param {boolean} mustBeAnInt - Whether the string must be parseable to a valid integer number (default: false).
* @returns {Result<string, string>} If sanitized, the new string value. Error otherwise.
 */
export function sanitizeString(value: string, maximumSize: number = 100, mustBeAnInt: boolean = false): Result<string, string> {
    try {
        if (!value) return Err('Undefined input.');
        // validate that the string is not empty and doesn't contain only whitespace
        let result = removeSpecialCharacters(value);
        result = limitStringLength(value, maximumSize);
        result = treatSpecialChars(result);
        if (result.trim().length <= 0) return Err('Only whitespace on string input');

        if (mustBeAnInt) {
            let parsedNumber = parseInt(result);
            if (isNaN(parsedNumber)) {
                return Err("Given input is not a valid number.");
            }
        }
        return Ok(result);
    } catch (error) {
        return Err(`${error}`);
    }
}

// Sanitize function to remove special characters
export function removeSpecialCharacters(input: string): string {
    return input.replace(/[^\w\s]/gi, '');
}

// Limit function to restrict the length of the string
export function limitStringLength(input: string, maxLength: number): string {
    if (!input) return '';
    // Truncate or limit the string length
    return input.slice(0, maxLength);
}

export function treatSpecialChars(input: string): string {
    if (!input) return '';
    let asciiRepresentation = tr(input);
    return asciiRepresentation.replace(/[^@:/\.a-zA-Z0-9 ]/g, "");
}