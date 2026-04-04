document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    
    // Скрываем регистрацию
    const regButton = document.getElementById('nav-reg-item');
    if (regButton && userId) regButton.style.display = 'none';

    // Номер в шапке
    if (userId && document.getElementById('user-phone-display')) {
        updateHeaderPhone(userId);
    }

    // Загрузка данных страниц
    if (document.getElementById('orders-list')) loadProfileData(userId);
    if (document.getElementById('cart-items-container')) loadBasket(userId);
});

async function updateHeaderPhone(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/user/${id}`);
        const data = await res.json();
        document.getElementById('user-phone-display').innerText = data.phone;
    } catch (e) { console.error("Ошибка связи с сервером"); }
}

async function loadProfileData(userId) {
    if (!userId) return;
    try {
        // Заказы
        const ordersRes = await fetch(`http://localhost:3000/api/orders/${userId}`);
        const orders = await ordersRes.json();
        document.getElementById('orders-list').innerHTML = orders.length > 0 
            ? orders.map(o => `<li>Заказ №${o.id} — ${o.total_amount} ₽</li>`).join('')
            : '<li>Заказов пока нет</li>';

        // Промокоды
        const promoRes = await fetch(`http://localhost:3000/api/promos`);
        const promos = await promoRes.json();
        document.getElementById('promo-list').innerHTML = promos.length > 0
            ? promos.map(p => `<li>${p.code} — скидка ${p.discount}%</li>`).join('')
            : '<li>Нет активных промокодов</li>';
    } catch (e) { console.error("Ошибка профиля", e); }
}

async function loadBasket(userId) {
    if (!userId) return;
    try {
        const res = await fetch(`http://localhost:3000/api/cart/${userId}`);
        const items = await res.json();
        const container = document.getElementById('cart-items-container');
        let total = 0;

        container.innerHTML = items.length > 0 
            ? items.map(item => {
                total += item.price * item.quantity;
                return `<div class="cart-item">...</div>`; // ваш HTML шаблона
              }).join('')
            : "<p>Корзина пуста</p>";

        document.getElementById('final-price').innerText = `${total} ₽`;
    } catch (e) { console.error("Ошибка корзины", e); }
}