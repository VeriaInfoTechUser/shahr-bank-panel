export function generateUniqueInt() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return timestamp % 10000000000 + random;
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value)
}

export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}