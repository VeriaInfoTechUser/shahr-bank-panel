
export function useCalculator(value = 0) {
    return value > 1000 ? `${value / 1024} GB` : `${value} MB`;
}
