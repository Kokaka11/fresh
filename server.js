// подключении к бд
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'fresh', 
    password: '2613346ko', 
    port: 5432,
});
// подключении к бд

//авторизации (нужен для работы входа)
app.post('/api/auth', async (req, res) => {
    let { phone } = req.body;
    
    if (!phone) {
        return res.status(400).send('Номер телефона обязателен');
    }
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

// создание и проверка номера телефона
app.post('/api/auth', async (req, res) => {
    const { phone } = req.body;
    try {

        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        
        if (result.rows.length > 0) {

            res.json(result.rows[0]);
        } else {

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

// Получение данных пользователя по ID
app.get('/api/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT phone FROM users WHERE id = $1', [id]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Пользователь не найден');
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


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер летит на http://localhost:${PORT}`);
});