const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express(); // Создаем экземпляр приложения один раз

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fresh', // Убедись, что база называется именно так
    password: '2613346ko', 
    port: 5432,
});

// Эндпоинт для добавления (тот самый, на котором была ошибка)
app.post('/api/cart/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        const existingItem = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            await pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, userId, productId]
            );
        } else {
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }
        res.status(200).send('Добавлено в базу!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка БД');
    }
});

// Эндпоинт для авторизации (нужен для работы входа)
app.post('/api/auth', async (req, res) => {
    let { phone } = req.body;
    // Убираем возможные пробелы и приводим к строке
    phone = String(phone).trim(); 
    
    try {
        // Добавь консоль-лог, чтобы видеть, что происходит в терминале VS Code
        console.log("Попытка входа с номером:", phone);
        
        const checkUser = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);

        if (checkUser.rows.length > 0) {
            console.log("Пользователь найден, ID:", checkUser.rows[0].id);
            res.json(checkUser.rows[0]);
        } else {
            console.log("Пользователь не найден, создаем нового.");
            const newUser = await pool.query(
                'INSERT INTO users (phone) VALUES ($1) RETURNING *', 
                [phone]
            );
            res.json(newUser.rows[0]);
        }
    } catch (err) {
        console.error("Ошибка базы данных:", err);
        res.status(500).send('Ошибка сервера');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер летит на http://localhost:${PORT}`);
});

// Эндпоинт для добавления товара в корзину
app.post('/api/cart/add', async (req, res) => {
    const { userId, productId, quantity } = req.body;
    try {
        // Проверяем, есть ли уже такой товар у пользователя
        const existingItem = await pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            // Если есть — увеличиваем количество
            await pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3',
                [quantity, userId, productId]
            );
        } else {
            // Если нет — добавляем новую запись
            await pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)',
                [userId, productId, quantity]
            );
        }
        res.status(200).send('Добавлено');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка БД');
    }
});

app.post('/api/auth', async (req, res) => {
    const { phone } = req.body;
    try {
        // Ищем пользователя по телефону
        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        
        if (result.rows.length > 0) {
            // Пользователь найден — просто возвращаем его данные
            res.json(result.rows[0]);
        } else {
            // Пользователь новый — создаем
            const newUser = await pool.query(
                'INSERT INTO users (phone) VALUES ($1) RETURNING *', 
                [phone]
            );
            res.json(newUser.rows[0]);
        }
    } catch (err) {
        res.status(500).send('Ошибка сервера');
    }
});

app.get('/api/cart/:userId', async (req, res) => {
    const { userId } = req.params;
    const result = await pool.query(
        'SELECT p.name, p.price, c.quantity FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1',
        [userId]
    );
    res.json(result.rows);
});