// Простая логика переключения активной категории
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.category-item.active')?.classList.remove('active');
        item.classList.add('active');
    });
});

// Анимация появления для карточек при наведении (уже в CSS, но можно усилить JS)
console.log("Магазин готов к работе!");

