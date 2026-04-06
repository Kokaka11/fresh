const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fresh', 
    password: '2613346ko', 
    port: 5432,
});

// Авторизация[cite: 15]
app.post('/api/auth', async (req, res) => {
    const { phone } = req.body;
    try {
        let user = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (user.rows.length === 0) {
            user = await pool.query('INSERT INTO users (phone) VALUES ($1) RETURNING *', [phone]);
        }
        res.json(user.rows[0]);
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// Получение данных пользователя[cite: 15]
app.get('/api/user/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT phone FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).send('Пользователь не найден');
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// История заказов[cite: 15]
app.get('/api/orders/:userId', async (req, res) => {
    try {
        const orders = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', 
            [req.params.userId]
        );
        res.json(orders.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение корзины[cite: 15]
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const items = await pool.query('SELECT * FROM cart WHERE user_id = $1', [req.params.userId]);
        res.json(items.rows);
    } catch (err) {
    console.error(err); 
    res.status(500).json({ error: 'Ошибка сервера' }); 
}
});

// Добавление/Обновление корзины[cite: 15]
app.post('/api/cart', async (req, res) => {
    const { userId, name, price, quantity } = req.body;
    try {
        await pool.query(
            `INSERT INTO cart (user_id, product_name, price, quantity) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (user_id, product_name) DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity`,
            [userId, name, price, quantity]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// Удаление из корзины[cite: 15]
app.delete('/api/cart/:userId/:itemName', async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_name = $2', 
            [req.params.userId, req.params.itemName]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

// Получение списка активных промокодов
app.get('/api/promos', async (req, res) => {
    try {
        const promos = await pool.query('SELECT * FROM promos');
        res.json(promos.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка загрузки промокодов' });
    }
});

// Оформление заказа
app.post('/api/orders', async (req, res) => {
    const { userId, totalAmount } = req.body;
    try {
        await pool.query('BEGIN'); // Начало транзакции

        // 1. Создаем запись в таблице заказов
        await pool.query(
            'INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING *',
            [userId, totalAmount]
        );

        // 2. Очищаем корзину пользователя
        await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);

        await pool.query('COMMIT'); // Фиксируем изменения
        res.json({ success: true });
    } catch (err) {
        await pool.query('ROLLBACK'); // Откат при ошибке
        console.error(err);
        res.status(500).json({ error: 'Ошибка оформления заказа' });
    }
});

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));