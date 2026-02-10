
export function useNumberFormat() {
    const formatNumber = (number) => {
        return new Intl.NumberFormat('fa-IR').format(number);
    };

    return { formatNumber };
}
