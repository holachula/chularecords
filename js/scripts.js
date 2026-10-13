document.addEventListener('DOMContentLoaded', () => {
    const photoStacks = document.querySelectorAll('.photo-stack');

    photoStacks.forEach(stack => {
        const cards = stack.querySelectorAll('.stack-card');

        stack.addEventListener('click', () => {
            cards.forEach(card => {
                card.classList.toggle('active-card');
            });
        });
    });
});