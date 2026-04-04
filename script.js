// 1. Проверяем, вошел ли пользователь при загрузке страницы профиля
document.addEventListener('DOMContentLoaded', () => {
    initProfile();
});

async function initProfile() {
    const userId = localStorage.getItem('userId');
    console.log("Текущий userId из памяти:", userId); // Проверка в консоли

    if (!userId) {
        document.getElementById('user-phone-display').innerText = "Не авторизован";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/user/${userId}`);
        
        if (response.ok) {
            const userData = await response.json();
            console.log("Данные от сервера:", userData); // Проверка в консоли
            
            // Если в базе колонка называется phone, выводим её
            if (userData.phone) {
                document.getElementById('user-phone-display').innerText = userData.phone;
            } else {
                document.getElementById('user-phone-display').innerText = "Номер не найден";
            }
        } else {
            console.error("Ошибка сервера:", response.status);
            document.getElementById('user-phone-display').innerText = "Ошибка загрузки";
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
        document.getElementById('user-phone-display').innerText = "Сервер выключен";
    }
}

// 2. Функция входа / регистрации
async function login(event) {
    event.preventDefault(); // Чтобы страница не перезагрузилась просто так

    const phoneInput = document.getElementById('phone').value;
    const errorDiv = document.getElementById('error-message');

    if (!phoneInput) return;

    try {
        const response = await fetch('http://localhost:3000/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput })
        });

        if (response.ok) {
            const data = await response.json();
            
            // 1. Сохраняем ID, чтобы профиль знал, кого показывать
            localStorage.setItem('userId', data.id);
            
            // 2. ПЕРЕХОДИМ В ПРОФИЛЬ
            window.location.href = 'index.html';
        } else {
            errorDiv.innerText = "Ошибка при входе. Попробуйте еще раз.";
        }
    } catch (error) {
        console.error("Ошибка:", error);
        errorDiv.innerText = "Сервер не отвечает. Проверь, запущен ли Node.js";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const regButton = document.getElementById('nav-reg-item');

    if (userId) {
        // Если пользователь вошел, скрываем кнопку регистрации
        if (regButton) {
            regButton.style.display = 'none';
        }
    } else {
        // Если не вошел, показываем
        if (regButton) {
            regButton.style.display = 'block';
        }
    }
});

// 3. Функция загрузки данных (номера)
async function loadUserData(id) {
    try {
        // Обрати внимание: запрос написан строго в одну строчку
        const res = await fetch(`http://localhost:3000/api/user/${id}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('user-phone').innerText = data.phone;
        }
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
    }
}

// Получение истории заказов пользователя
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY order_date DESC', [req.params.userId]);
        res.json(orders.rows);
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// 4. Функция выхода
function logout() {
    localStorage.removeItem('userId');
    window.location.href = 'index.html'; // При выходе сразу на главную
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
loadCart(); // Загружаем при открытии страницы


