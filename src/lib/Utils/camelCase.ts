export function camelToSentenceCase(value: string) {
    return value.split(/([A-Z]|\d)/).map((v, i, arr) => {
        if (!i) return v.charAt(0).toUpperCase() + v.slice(1);
        if (!v) return v;
        if (v === '_') return " ";
        if (v.length === 1 && v === v.toUpperCase()) {
            const previousCapital = !arr[i-1] || arr[i-1] === '_';
            const nextWord = i+1 < arr.length && arr[i+1] && arr[i+1] !== '_';
            const nextTwoCapitalsOrEndOfString = i+3 > arr.length || !arr[i+1] && !arr[i+3];
            if (!previousCapital || nextWord) v = " " + v;
            if (nextWord || (!previousCapital && !nextTwoCapitalsOrEndOfString)) v = v.toLowerCase();
        }
        return v;
    }).join("");
}