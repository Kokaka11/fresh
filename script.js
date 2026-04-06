document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    
    // Скрываем кнопку регистрации, если пользователь авторизован
    const regButton = document.getElementById('nav-reg-item');
    if (regButton && userId) regButton.style.display = 'none';

    // Если есть ID пользователя, обновляем данные в шапке и на страницах
    if (userId) {
        if (document.getElementById('user-phone-display')) updateHeaderPhone(userId);
        if (document.getElementById('orders-list')) loadProfileData(userId);
        if (document.getElementById('cart-items-container')) loadBasket(userId);
    }
});

// --- ФУНКЦИИ ЗАГРУЗКИ ДАННЫХ ---

async function updateHeaderPhone(id) {
    try {
        const res = await fetch(`http://localhost:3000/api/user/${id}`);
        if (!res.ok) throw new Error("Пользователь не найден");
        const data = await res.json();
        document.getElementById('user-phone-display').innerText = data.phone;
    } catch (e) { 
        console.error("Ошибка связи с сервером при получении номера");
        document.getElementById('user-phone-display').innerText = "Ошибка";
    }
}

async function loadProfileData(userId) {
    try {
        // Загрузка заказов
        const ordersRes = await fetch(`http://localhost:3000/api/orders/${userId}`);
        const orders = await ordersRes.json();
        document.getElementById('orders-list').innerHTML = orders.length > 0 
            ? orders.map(o => `<li>Заказ №${o.id} — ${o.total_amount} ₽</li>`).join('')
            : '<li>Заказов пока нет</li>';

        // Загрузка промокодов
        const promoRes = await fetch(`http://localhost:3000/api/promos`);
        const promos = await promoRes.json();
        document.getElementById('promo-list').innerHTML = promos.length > 0
            ? promos.map(p => `<li>${p.code} — скидка ${p.discount}%</li>`).join('')
            : '<li>Нет активных промокодов</li>';
    } catch (e) { console.error("Ошибка загрузки данных профиля", e); }
}

async function loadBasket(userId) {
    try {
        const res = await fetch(`http://localhost:3000/api/cart/${userId}`);
        const items = await res.json();
        const container = document.getElementById('cart-items-container');
        let total = 0;

        if (items.length === 0) {
            container.innerHTML = "<p>Корзина пуста</p>";
        } else {
            container.innerHTML = items.map(item => {
                total += item.price * item.quantity;
                return `
                <div class="cart-item" style="border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3>${item.product_name}</h3>
                        <p>${item.price} ₽ x ${item.quantity}</p>
                    </div>
                    <button onclick="removeBasketItem('${item.product_name}')" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Удалить</button>
                </div>`;
            }).join('');
        }
        
        // Обновляем итоговые суммы в интерфейсе корзины[cite: 14]
        if(document.getElementById('total-items-price')) document.getElementById('total-items-price').innerText = `${total} ₽`;
        if(document.getElementById('final-price')) document.getElementById('final-price').innerText = `${total} ₽`;
    } catch (e) { console.error("Ошибка загрузки корзины", e); }
}

// --- ФУНКЦИИ ВЗАИМОДЕЙСТВИЯ (ДОБАВЛЕНИЕ/УДАЛЕНИЕ) ---

async function addToBasket(name, price) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert("Пожалуйста, сначала авторизуйтесь!");
        window.location.href = 'registr.html';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/cart', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId, name, price, quantity: 1 }) 
        });
        if (res.ok) alert(`${name} добавлен в корзину!`);
    } catch (e) { console.error("Ошибка добавления", e); }
}

async function removeBasketItem(itemName) {
    const userId = localStorage.getItem('userId');
    try {
        await fetch(`http://localhost:3000/api/cart/${userId}/${itemName}`, { method: 'DELETE' });
        loadBasket(userId); // Обновляем список в корзине
    } catch (e) { console.error("Ошибка удаления", e); }
}

// --- ФУНКЦИЯ ОФОРМЛЕНИЯ ЗАКАЗА ---

async function createOrder() {
    const userId = localStorage.getItem('userId');

    const totalText = document.getElementById('final-price').innerText; 
const totalAmount = parseInt(totalText.replace(/\D/g, '')); 

    if (totalAmount <= 0) {
        alert("Корзина пуста!");
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ userId, totalAmount })
        });

        if (res.ok) {
            alert("Заказ успешно оформлен!");
            window.location.href = 'profile.html';
        } else {
            const errorData = await res.json();
            alert("Ошибка сервера: " + errorData.error);
        }
    } catch (e) { 
        console.error(e);
        alert("Не удалось связаться с сервером"); 
    }
}