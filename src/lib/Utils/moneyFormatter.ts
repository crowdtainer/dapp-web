export let moneyFormatter = new Intl.NumberFormat('en-GB', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
});