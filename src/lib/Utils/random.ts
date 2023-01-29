export function pseudoRandomNonce() {
    let min = 10000000;
    let max = 99999999;
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}