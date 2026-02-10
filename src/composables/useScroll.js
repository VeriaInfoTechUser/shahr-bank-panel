export function useScroll(position) {
    function scrollTo(position) {
        window.scrollTo({
            top: position,
            behavior: 'smooth'
        });
    }

    return {scrollTo};
}
