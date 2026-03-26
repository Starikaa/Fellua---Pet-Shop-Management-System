require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // ĐÃ SỬA: Dùng mysql2 thay vì mssql
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());

// CẤU HÌNH KẾT NỐI MYSQL (TiDB Cloud)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    }
};

// Tạo Pool kết nối
const pool = mysql.createPool(dbConfig);

cloudinary.config({
    cloud_name: 'dzipisbon',
    api_key: '885293945594758',
    api_secret: '0HIHiK_J_H4ockYERk5pGNCQHkY'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pet-shop-products',
        allowed_formats: ['jpg', 'png', 'webp']
    }
});

const upload = multer({ storage: storage });

// --- CÁC API QUẢN TRỊ (ADMIN) ---

// 1. Thêm sản phẩm (C10)
app.post('/api/admin/products', upload.single('image'), async (req, res) => {
    try {
        const { categoryId, productName, price, numProduct, detailProduct } = req.body;
        const imageUrl = req.file ? req.file.path : null;

        const [result] = await pool.execute(
            `INSERT INTO Product (category_id, product_name, price, num_product, image_url, detail_product)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [categoryId, productName, price, numProduct, imageUrl, detailProduct]
        );

        res.json({ message: "Thêm sản phẩm thành công!", imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Lấy danh sách người dùng
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT user_id, full_name, email, role_id, status FROM Users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Cập nhật trạng thái người dùng (C14)
app.put('/api/admin/users/status', async (req, res) => {
    const { userId, status } = req.body;
    try {
        const [users] = await pool.execute('SELECT role_id FROM Users WHERE user_id = ?', [userId]);
        if (users[0]?.role_id === 'ADM') {
            return res.status(403).json({ error: "Không thể thay đổi trạng thái Admin!" });
        }
        await pool.execute('UPDATE Users SET status = ? WHERE user_id = ?', [status, userId]);
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CÁC API NGƯỜI DÙNG (USER) ---

// 4. Đăng nhập (ĐÃ SỬA BẢNG Users)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.execute('SELECT * FROM Users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });
        if (user.status !== 'Active') return res.status(403).json({ error: "Tài khoản bị khóa!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Sai mật khẩu" });

        const token = jwt.sign({ id: user.user_id, role: user.role_id }, 'SECRET_KEY', { expiresIn: '1d' });
        res.json({ token, role: user.role_id, fullName: user.full_name, user_id: user.user_id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. Đăng ký
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, password, dob, sex } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO Users (role_id, full_name, email, password, date_of_birth, sex, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['CUS', fullName, email, hashedPassword, dob, sex, 'Active']
        );
        res.json({ message: "Đăng ký thành công!" });
    } catch (err) {
        res.status(400).json({ error: "Email đã tồn tại hoặc lỗi dữ liệu!" });
    }
});

// 6. Lấy danh sách sản phẩm (C04) - Cú pháp IFNULL cho MySQL
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                p.*, 
                COUNT(f.feedback_id) AS total_feedback,
                AVG(f.rating) AS avg_rating,
                IFNULL(ppc.cost_per_click, 0) as discount_amount
            FROM Product p
            LEFT JOIN Feedback f ON p.product_id = f.product_id
            LEFT JOIN PCC_Campaign ppc ON p.product_id = ppc.product_id AND ppc.status = 'Active'
            GROUP BY p.product_id, ppc.cost_per_click
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Đặt hàng (Transactions trong MySQL)
app.post('/api/orders', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { userId, productId, quantity, totalPrice } = req.body;

        const [orderRes] = await connection.execute(
            `INSERT INTO Orders (user_id, order_date, status_order, total_price, prods_per_order) 
             VALUES (?, CURRENT_DATE(), 'Chờ xác nhận', ?, 1)`,
            [userId, totalPrice]
        );
        const orderId = orderRes.insertId;

        await connection.execute(
            'INSERT INTO Order_Item (order_id, product_id, num_per_prod) VALUES (?, ?, ?)',
            [orderId, productId, quantity]
        );

        await connection.execute(
            'UPDATE Product SET num_product = num_product - ? WHERE product_id = ?',
            [quantity, productId]
        );

        await connection.commit();
        res.json({ message: "Đặt hàng thành công! 🐾" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// --- CHATBOT GEMINI ---
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId, role, messageCount } = req.body;

        // Logic check giới hạn chat...
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Bạn là Fellua - Quản gia thông minh của cửa hàng thú cưng Fellua..."
        });

        const result = await model.generateContent(message);
        const response = result.response.text();

        await pool.execute(
            'INSERT INTO Chat_History (user_id, question, answer, chat_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            [userId || null, message, response]
        );

        res.json({ reply: response });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Port cho Railway
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server chạy tại port ${PORT}`));
