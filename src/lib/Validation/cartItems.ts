import { Err, Ok, type Result } from '@sniptt/monads';

/**
 * Iterates through all products in the cart to check for conflicts.
 * @param {string[]} productLineItems - The full product list names, as read from the smart contract.
 * @param {string} delimiterChar - The string used as the category separator.
 * @param {string[]} categoryDescriptors - The name of each category.
 * @param {string[]} mutuallyExclusiveItems - The categories which are mutually exclusive.
 * @param {number[]} cartItems - The items present in the shopping bag.
 * @returns {Result<string, string>} Returns Err with error message in case of conflict, Ok otherwise.
 */
export function checkConflictingItems(
    productLineItems: string[],
    delimiterChar: string,
    categoryDescriptors: string[],
    mutuallyExclusiveItems: string[],
    cartItems: number[]
): Result<string, string> {
    for (let index = 0; index < cartItems.length; index++) {
        if (cartItems[index] > 0) {
            const result = mutuallyExclusiveItemPresentOnSelection(
                productLineItems,
                delimiterChar,
                categoryDescriptors,
                mutuallyExclusiveItems,
                cartItems,
                index
            );
            if (result.isErr()) {
                return result;
            }
        }
    }
    return Ok('No conflicts.');
}

/**
 * Determines if the given selection conflicts with items in cartItems array.
 * @param {string[]} productLineItems - The full product list names, as read from the smart contract.
 * @param {string} delimiterChar - The string used as the category separator.
 * @param {string[]} categoryDescriptors - The name of each category.
 * @param {string[]} mutuallyExclusiveItems - The categories which are mutually exclusive.
 * @param {number[]} cartItems - The items present in the shopping bag.
 * @param {number} [currentSelectionProductIndex=100] - the product to check the shopping cart list with.
 * @returns {Result<string, string>} Returns Err with error message in case of conflict, Ok otherwise.
 */
export function mutuallyExclusiveItemPresentOnSelection(
    productLineItems: string[],
    delimiterChar: string,
    categoryDescriptors: string[],
    mutuallyExclusiveItems: string[],
    cartItems: number[],
    currentSelectionProductIndex: number
): Result<string, string> {
    if (
        !Array.isArray(productLineItems) ||
        !Array.isArray(categoryDescriptors) ||
        !Array.isArray(mutuallyExclusiveItems)
    ) {
        console.warn('Unexpected product input configuration:');
        console.log(`Array.isArray(productLineItems) ?${Array.isArray(productLineItems)}`);
        console.log(`Array.isArray(categoryDescriptors) ?${Array.isArray(categoryDescriptors)}`);
        console.log(
            `Array.isArray(mutuallyExclusiveItems) ?${Array.isArray(mutuallyExclusiveItems)}`
        );
        return Err('Unexpected product input configuration.');
    }
    if (mutuallyExclusiveItems.length === 0) {
        console.log('No mutex category');
        return Ok('No conflicts.');
    } else console.log(`mutex items: ${mutuallyExclusiveItems}`);

    // Find mutually exclusive category "descriptor index"
    let exclusiveDescriptorIndexes = new Array<number>();
    mutuallyExclusiveItems.forEach((element: string) => {
        exclusiveDescriptorIndexes.push(categoryDescriptors.indexOf(element));
    });

    if (exclusiveDescriptorIndexes.length === 0) {
        throw new Error('Project configuration error: Unable to find mutually exclusive category.');
    }

    let selectedProductLine = productLineItems[currentSelectionProductIndex];

    let selectedCategoryDescriptors = selectedProductLine.split(delimiterChar);
    console.log(`Selected product ${selectedProductLine}`);

    let conflictDetected: string | undefined;

    exclusiveDescriptorIndexes.forEach((mutexCategoryIndex) => {
        cartItems.forEach((productCount, productIndex) => {
            if (productCount > 0) {
                // console.log(`Found ${productCount} x ${productLineItems[productIndex]} in cart.`);
                let currentCategoryDescriptor =
                    productLineItems[productIndex].split(delimiterChar)[mutexCategoryIndex];
                if (currentCategoryDescriptor != selectedCategoryDescriptors[mutexCategoryIndex]) {
                    conflictDetected = `You must have the same product ${categoryDescriptors[mutexCategoryIndex].toLowerCase()} for all items in your basket, as only one ${categoryDescriptors[mutexCategoryIndex].toLocaleLowerCase()} is allowed per order.`
                    conflictDetected += ` Please remove items of ${categoryDescriptors[mutexCategoryIndex].toLowerCase()} '${currentCategoryDescriptor.replace(categoryDescriptors[mutexCategoryIndex], '')}' before adding an item of ${categoryDescriptors[mutexCategoryIndex].toLocaleLowerCase()} '${selectedCategoryDescriptors[mutexCategoryIndex].replace(categoryDescriptors[mutexCategoryIndex], '')}'.`;
                    console.log(conflictDetected);
                }
            }
        });
    });
    if (conflictDetected) {
        return Err(conflictDetected);
    } else return Ok('No conflicts.');
}