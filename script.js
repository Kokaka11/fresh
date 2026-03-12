// Простая логика переключения активной категории
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelector('.category-item.active')?.classList.remove('active');
        item.classList.add('active');
    });
});

async function addToCartServer(productId) {
    const userId = localStorage.getItem('userId'); // Получаем ID вошедшего пользователя
    
    if (!userId) {
        alert("Пожалуйста, сначала авторизуйтесь!");
        window.location.href = 'auth.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity: 1 })
        });

        if (response.ok) {
            alert("Товар добавлен в корзину!");
            // Тут можно вызвать функцию обновления суммы в шапке
        }
    } catch (err) {
        console.error("Ошибка при добавлении:", err);
    }
}

async function addToCart(productId) {
    const userId = 1; // Временно используем ID 1, пока не сделаем полноценный логин
    const response = await fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: 1 })
    });
    
    if (response.ok) {
        alert("Товар добавлен в корзину!");
    }
}

async function login() {
    // 1. Получаем номер телефона из поля ввода
    event.preventDefault();
    const phone = document.getElementById('phone').value;
    
    if (!/^\d{11}$/.test(phone)) {
        alert("Введите корректный номер телефона из 11 цифр");
        return; // Останавливаем выполнение, если номер плохой
    }
    // 2. Отправляем запрос на наш сервер
    const res = await fetch('http://localhost:3000/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    });

    if (res.ok) {
        const data = await res.json();
        // 3. Сохраняем ID пользователя, чтобы "запомнить" вход
        localStorage.setItem('userId', data.id);
        alert("Успешно! покупайте больше свежих продуктов: ");
        window.location.href = 'index.html'; // Переход на главную
    } else {
        alert("Ошибка авторизации");
    }
}

function logout() {
    localStorage.removeItem('userId'); // Удаляем ID из памяти
    window.location.href = 'profile.html'; // Возвращаем на страницу входа
}

async function loadCart() {
    const userId = localStorage.getItem('userId');
    const res = await fetch(`http://localhost:3000/api/cart/${userId}`);
    const items = await res.json();
    
    const container = document.getElementById('cart-list');
    container.innerHTML = items.map(item => `
        <div class="cart-item">
            <p>${item.name} - ${item.quantity} шт. по ${item.price}₽</p>
        </div>
    `).join('');
}

app.post('/api/auth', async (req, res) => {
    const { phone } = req.body;
    try {
        // Проверяем, есть ли такой пользователь, если нет - создаем
        let user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (user.rows.length === 0) {
            user = await pool.query('INSERT INTO users (phone) VALUES ($1) RETURNING *', [phone]);
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});
loadCart(); // Загружаем при открытии страницы


