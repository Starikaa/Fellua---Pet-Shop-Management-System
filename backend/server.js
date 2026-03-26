require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
const pool = mysql.createPool(dbConfig);
// TEST KẾT NỐI NGAY KHI START SERVER
console.log("--- KIỂM TRA BIẾN MÔI TRƯỜNG ---");
console.log("DB_HOST:", process.env.DB_HOST ? "Đã nhận ✅" : "TRỐNG ❌");
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

pool.getConnection()
    .then(connection => {
        console.log("✅ KẾT NỐI TIDB THÀNH CÔNG! ID kết nối:", connection.threadId);
        connection.release();
    })
    .catch(err => {
        console.error("❌ THẤT BẠI KHI KẾT NỐI TIDB:", err.message);
        console.error("Chi tiết lỗi:", err.code); // Ví dụ: 'ETIMEDOUT' hoặc 'ECONNREFUSED'
    });

cloudinary.config({
    cloud_name: 'CLOUDINARY_CLOUD_NAME',
    api_key: 'CLOUDINARY_API_KEY',
    api_secret: 'CLOUDINARY_API_SECRET'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'pet-shop-products',
        allowed_formats: ['jpg', 'png', 'webp']
    }
});

const upload = multer({ storage: storage });

// API Thêm sản phẩm mới kèm ảnh (C10)
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

app.post('/api/logout', (req, res) => {
    res.json({ message: "Đã đăng xuất an toàn" });
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT user_id, full_name, email, role_id, status FROM Users');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cập nhật trạng thái (C14)
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

// Cập nhật quyền hạn (C15)
app.put('/api/admin/users/role', async (req, res) => {
    const { userId, roleId } = req.body;
    try {
        if (roleId === 'ADM') {
            return res.status(403).json({ error: "Việc cấp quyền Quản trị viên mới bị nghiêm cấm!" });
        }
        const [checkAdmin] = await pool.execute('SELECT role_id FROM Users WHERE user_id = ?', [userId]);
        if (checkAdmin[0]?.role_id === 'ADM') {
            return res.status(403).json({ error: "Không thể thay đổi quyền hạn của tài khoản Quản trị viên!" });
        }
        await pool.execute('UPDATE Users SET role_id = ? WHERE user_id = ?', [roleId, userId]);
        res.json({ message: "Cập nhật quyền thành công" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/user/update', async (req, res) => {
    try {
        const { userId, fullName, dob, sex } = req.body;
        await pool.execute(
            'UPDATE Users SET full_name = ?, date_of_birth = ?, sex = ? WHERE user_id = ?',
            [fullName, dob, sex, userId]
        );
        res.json({ message: "Cập nhật thành công!", fullName });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Xóa sản phẩm (C10)
app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        // 1. Check quảng cáo
        const [ppcCheck] = await pool.execute('SELECT campaign_id FROM PCC_Campaign WHERE product_id = ?', [productId]);
        if (ppcCheck.length > 0) {
            return res.status(400).json({ error: "Không thể xóa! Sản phẩm đang chạy quảng cáo PPC." });
        }
        // 2. Check đơn hàng
        const [orderCheck] = await pool.execute('SELECT order_id FROM Order_Item WHERE product_id = ?', [productId]);
        if (orderCheck.length > 0) {
            return res.status(400).json({ error: "Sản phẩm đã có lịch sử giao dịch, không thể xóa!" });
        }
        // 3. Thực hiện xóa
        await pool.execute('DELETE FROM Product WHERE product_id = ?', [productId]);
        res.json({ message: "Đã xóa sản phẩm thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sửa thông tin sản phẩm (C10)
app.put('/api/admin/products/:id', upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;
        const { productName, price, numProduct, detailProduct, categoryId } = req.body;
        let imageUrl = req.body.imageUrl;
        if (req.file) imageUrl = req.file.path;

        await pool.execute(
            `UPDATE Product 
             SET product_name = ?, price = ?, num_product = ?, image_url = ?, detail_product = ?, category_id = ?
             WHERE product_id = ?`,
            [productName, price, numProduct, imageUrl, detailProduct, categoryId, productId]
        );
        res.json({ message: "Cập nhật thành công!", imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    try {
        const { userId, productId, content, rating } = req.body;

        // Kiểm tra điều kiện Alternative Flow: Đánh giá phải từ 3 từ trở lên
        const wordCount = content.trim().split(/\s+/).length;
        if (wordCount < 3) {
            return res.status(400).json({ error: "Vui lòng nhập thêm đánh giá (tối thiểu 3 từ)!" });
        }

        let pool = await sql.connect(dbConfig);
        await pool.execute('INSERT INTO Feedback (user_id, product_id, content, rating, feedback_date) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)', [userId, productId, content, rating]);
        res.json({ message: "Gửi đánh giá thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Lấy danh sách tất cả đơn hàng cho nhân viên
app.get('/api/admin/orders', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT o.order_id, o.order_date, o.total_price, o.status_order, 
                   u.full_name, p.product_name, oi.num_per_prod
            FROM Orders o
            JOIN Users u ON o.user_id = u.user_id
            JOIN Order_Item oi ON o.order_id = oi.order_id
            JOIN Product p ON oi.product_id = p.product_id
            ORDER BY o.order_date DESC
        `);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cập nhật trạng thái đơn hàng (C13)
app.put('/api/admin/orders/status', async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        await pool.execute('UPDATE Orders SET status_order = ? WHERE order_id = ?', [newStatus, orderId]);
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Lấy lịch sử đơn hàng của 1 khách hàng (C08)
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT o.order_id, o.order_date, o.total_price, o.status_order, 
                   oi.num_per_prod, p.product_name, p.product_id 
            FROM Orders o
            JOIN Order_Item oi ON o.order_id = oi.order_id
            JOIN Product p ON oi.product_id = p.product_id
            WHERE o.user_id = ?
            ORDER BY o.order_date DESC`, [req.params.userId]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/chat/guest/clear', async (req, res) => {
    try {
        await pool.execute('DELETE FROM Chat_History WHERE user_id IS NULL');
        res.json({ message: "Đã dọn dẹp lịch sử Guest" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
app.get('/api/admin/ppc', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM PCC_Campaign ORDER BY campaign_id DESC");
        res.json(rows); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/ppc/:id', async (req, res) => {
    try {
        const campaignId = req.params.id;
        const [checkCp] = await pool.execute(
            "SELECT product_id, cost_per_click, status FROM PCC_Campaign WHERE campaign_id = ?", 
            [campaignId]
        );

        if (checkCp.length > 0) {
            const { product_id, cost_per_click, status } = checkCp[0];
            if (status === 'Active') {
                await pool.execute("UPDATE Product SET price = price + ? WHERE product_id = ?", [cost_per_click, product_id]);
            }
        }
        await pool.execute("DELETE FROM PCC_Campaign WHERE campaign_id = ?", [campaignId]);
        res.json({ message: "Đã xóa chiến dịch thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/feedback/product/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT f.content, f.rating, f.feedback_date, u.full_name
            FROM Feedback f
            JOIN Users u ON f.user_id = u.user_id
            WHERE f.product_id = ?
            ORDER BY f.feedback_date DESC
        `, [req.params.id]); 
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        console.log('lmao')
        const [rows] = await pool.execute('SELECT category_id, category_name, category_icon FROM Category');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/categories', async (req, res) => {
    try {
        const { categoryId, categoryName, categoryIcon } = req.body;
        await pool.execute('INSERT INTO Category (category_id, category_name, category_icon) VALUES (?, ?, ?)', [categoryId, categoryName, categoryIcon]);
        res.json({ message: "Thêm thành công!" });
    } catch (err) { res.status(500).json({ error: "Lỗi: " + err.message }); }
});
app.put('/api/admin/categories/:id', async (req, res) => {
    try {
        const { categoryName, categoryIcon } = req.body;
        await pool.execute(
            'UPDATE Category SET category_name = ?, category_icon = ? WHERE category_id = ?',
            [categoryName, categoryIcon, req.params.id]
        );
        res.json({ message: "Cập nhật danh mục thành công!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/ppc', upload.single('banner'), async (req, res) => {
    try {
        const creatorId = Number(req.body.creatorId);
        const productId = Number(req.body.productId);
        const budget = Number(req.body.budget);
        const cpc = Number(req.body.cpc);
        const { campaignName } = req.body;
        
        // Link ảnh từ Cloudinary
        const imageUrl = req.file ? req.file.path : null;

        console.log("Đang tạo chiến dịch cho SP ID:", productId);

        // Chèn vào bảng PCC_Campaign
        await pool.execute(
            `INSERT INTO PCC_Campaign (creator_id, product_id, campaign_name, budget, cost_per_click, banner_url, status, num_of_clicks)
             VALUES (?, ?, ?, ?, ?, ?, 'Active', 0)`,
            [creatorId, productId, campaignName, budget, cpc, imageUrl]
        );

        // Cập nhật giảm giá sản phẩm
        await pool.execute(
            'UPDATE Product SET price = price - ? WHERE product_id = ?', 
            [cpc, productId]
        );

        res.json({ message: "Kích hoạt quảng cáo thành công!", imageUrl });
    } catch (err) { 
        console.error("LỖI PPC POST:", err.message);
        res.status(500).json({ error: err.message }); 
    }
});

app.put('/api/admin/ppc/:id', upload.single('banner'), async (req, res) => {
    try {
        const nNewCPC = Number(req.body.cost_per_click || 0);
        const { campaign_name, budget, status } = req.body;
        const campaignId = req.params.id;
        const nNewBudget = Number(budget);

        // 1. Lấy dữ liệu hiện tại để kiểm tra bằng pool.execute
        const [oldRows] = await pool.execute(
            `SELECT ppc.status, p.product_id, p.price, ppc.cost_per_click, ppc.num_of_clicks 
             FROM PCC_Campaign ppc 
             JOIN Product p ON ppc.product_id = p.product_id 
             WHERE ppc.campaign_id = ?`, 
            [campaignId]
        );

        if (oldRows.length > 0) {
            const {
                status: oldStatus,
                product_id,
                price: currentPrice,
                cost_per_click: oldCPC,
                num_of_clicks
            } = oldRows[0];

            // TÍNH TOÁN SỐ TIỀN ĐÃ TIÊU
            const spent = num_of_clicks * oldCPC;

            // KIỂM TRA ĐIỀU KIỆN KHỞI ĐỘNG LẠI (ADMIN RESTART)
            if (oldStatus === 'Ended' && status === 'Active') {
                if (nNewBudget <= spent) {
                    return res.status(400).json({
                        error: `Không thể kích hoạt! Ngân sách (${nNewBudget.toLocaleString()}đ) phải lớn hơn số tiền đã tiêu (${spent.toLocaleString()}đ). Vui lòng tăng ngân sách!`
                    });
                }
            }

            // Logic tính toán lại giá sản phẩm (GIỮ NGUYÊN NHƯ CODE GỐC CỦA CHIẾN)
            let nPrice = Number(currentPrice);
            let nOldCPC = Number(oldCPC);

            if (oldStatus === 'Active' && status === 'Ended') {
                nPrice = nPrice + nOldCPC; // Hoàn lại giá gốc
            } else if (oldStatus === 'Ended' && status === 'Active') {
                nPrice = nPrice - nNewCPC; // Trừ giá khuyến mãi mới
            } else if (oldStatus === 'Active' && status === 'Active' && nOldCPC !== nNewCPC) {
                nPrice = nPrice + nOldCPC - nNewCPC;
            }

            // Cập nhật lại giá sản phẩm nếu có thay đổi
            if (!isNaN(nPrice) && nPrice !== Number(currentPrice)) {
                await pool.execute(
                    "UPDATE Product SET price = ? WHERE product_id = ?", 
                    [nPrice, product_id]
                );
            }
        }

        // 2. Cập nhật thông tin chiến dịch
        let bannerUrl = req.body.banner_url;
        if (req.file) bannerUrl = req.file.path;

        await pool.execute(
            `UPDATE PCC_Campaign 
             SET campaign_name = ?, budget = ?, status = ?, cost_per_click = ?, banner_url = ? 
             WHERE campaign_id = ?`,
            [campaign_name, nNewBudget, status, nNewCPC, bannerUrl, campaignId]
        );

        res.json({ message: "Cập nhật và kích hoạt chiến dịch thành công!" });
    } catch (err) {
        console.error("Lỗi PPC Update:", err.message);
        res.status(500).json({ error: "Lỗi hệ thống: " + err.message });
    }
});

app.get('/api/ppc/active', async (req, res) => {
    try {
        const [rows] = await pool.execute("SELECT * FROM PCC_Campaign WHERE status = 'Active' ORDER BY campaign_id DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/cancel/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const orderId = req.params.id;

        const [orders] = await connection.execute('SELECT oi.product_id, oi.num_per_prod, o.status_order FROM Orders o JOIN Order_Item oi ON o.order_id = oi.order_id WHERE o.order_id = ?', [orderId]);
        if (orders.length === 0) return res.status(404).json({ error: "Không tìm thấy đơn hàng!" });
        
        const order = orders[0];
        if (order.status_order === 'Đã hủy') return res.status(400).json({ error: "Đơn hàng đã hủy trước đó!" });

        await connection.execute("UPDATE Orders SET status_order = 'Đã hủy' WHERE order_id = ?", [orderId]);
        await connection.execute("UPDATE Product SET num_product = num_product + ? WHERE product_id = ?", [order.num_per_prod, order.product_id]);

        await connection.commit();
        res.json({ message: "Hủy đơn hàng và hoàn kho thành công!" });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally { connection.release(); }
});

// API: Xóa danh mục (Lưu ý: Chỉ xóa được nếu không có sản phẩm nào thuộc loại này)
app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM Category WHERE category_id = ?', [req.params.id]);
        res.json({ message: "Đã xóa loại hàng thành công!" });
    } catch (err) { res.status(500).json({ error: "Không thể xóa loại hàng đang có sản phẩm!" }); }
});

// Lấy toàn bộ sản phẩm (C04)
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

// Lấy chi tiết sản phẩm (C05)
app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.*, ppc.cost_per_click as discount_amount, ppc.budget, ppc.num_of_clicks, ppc.status as ppc_status,
                   CASE WHEN ppc.status = 'Active' THEN FLOOR((ppc.budget - (ppc.num_of_clicks * ppc.cost_per_click)) / ppc.cost_per_click) ELSE 0 END as max_discount_qty
            FROM Product p
            LEFT JOIN PCC_Campaign ppc ON p.product_id = ppc.product_id AND ppc.status = 'Active'
            WHERE p.product_id = ?
        `, [req.params.id]);
        res.json(rows[0]); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/reports/:month/:year', async (req, res) => {
    try {
        const { month, year } = req.params;
        const [revenueRows] = await pool.execute(`
            SELECT DAY(order_date) as day, SUM(total_price) as dailyRevenue, COUNT(order_id) as orderCount
            FROM Orders
            WHERE MONTH(order_date) = ? AND YEAR(order_date) = ? AND status_order = 'Giao hàng thành công'
            GROUP BY DAY(order_date) ORDER BY day`, [month, year]);

        const [ppcRows] = await pool.execute(`
            SELECT campaign_name, budget, (num_of_clicks * cost_per_click) as spent, num_of_clicks as conversions
            FROM PCC_Campaign`);

        res.json({
            dailyStats: revenueRows,
            ppcStats: ppcRows,
            totalRevenue: revenueRows.reduce((sum, item) => sum + Number(item.dailyRevenue), 0),
            totalOrders: revenueRows.reduce((sum, item) => sum + item.orderCount, 0)
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Route cho Chatbot Gemini
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId, role, messageCount } = req.body;
        let pool = await sql.connect(dbConfig);

        if (!userId && messageCount >= 1) {
            return res.status(403).json({
                reply: "Bạn chỉ được hỏi 1 câu với tư cách khách. Vui lòng đăng nhập để tiếp tục trò chuyện!"
            });
        }
        if (role !== 'ADM') {
            const [rows] = await pool.execute(
            `SELECT COUNT(*) AS todayCount 
             FROM Chat_History 
             WHERE user_id = ? AND DATE(chat_time) = CURDATE()`, [userId]);

        const todayCount = rows[0].todayCount;

        if (todayCount >= 15) {
            return res.status(429).json({ message: "Chủ nhân ơi, hôm nay bạn đã hỏi Fellua 15 câu rồi. Hãy nghỉ ngơi và quay lại vào ngày mai nhé! 🐾"
                });
            }
        }
        const [productsResult] = await pool.execute(`
            SELECT p.product_name, p.price, p.num_product, p.detail_product, c.category_name,
                   pcc.cost_per_click AS discount_amount, pcc.status AS pcc_status,
                   FLOOR((pcc.budget - (pcc.num_of_clicks * pcc.cost_per_click)) / pcc.cost_per_click) AS remaining_discount_qty
            FROM Product p 
            JOIN Category c ON p.category_id = c.category_id 
            LEFT JOIN PCC_Campaign pcc ON p.product_id = pcc.product_id AND pcc.status = 'Active'
            WHERE p.num_product > 0
        `);

        const productContext = productsResult.recordset.map(p => {
            let info = `- ${p.product_name} (${p.category_name}): `;
            info += `Trong kho còn: ${p.num_product} sản phẩm. `;

            if (p.pcc_status === 'Active' && p.remaining_discount_qty > 0) {
                const originalPrice = p.price + p.discount_amount;
                info += `🔥 ĐANG GIẢM GIÁ MẠNH! Giá ưu đãi: ${p.price.toLocaleString()}đ (Giá cũ: ${originalPrice.toLocaleString()}đ). `;
                info += `CẢNH BÁO: Chỉ còn đúng ${p.remaining_discount_qty} suất giá rẻ cuối cùng! `;
            } else {
                info += `Giá bán: ${p.price.toLocaleString()}đ. `;
            }
            return info + `Mô tả: ${p.detail_product}`;
        }).join('\n');

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Bạn là Fellua - Quản gia thông minh của cửa hàng thú cưng Fellua. 
            Nhiệm vụ:
                - Tư vấn chăm sóc thú cưng tận tâm và sâu sắc.
                - Sử dụng danh sách sản phẩm thực tế cùng với chiến dịch giảm giá của cửa hàng dưới đây để gợi ý cho khách: ${productContext}
                - Nếu khách hàng hỏi về chủ đề không liên quan, hãy lịch sự từ chối và hướng họ quay lại chủ đề thú cưng và sản phẩm cửa hàng.
                - Nếu khách hỏi sản phẩm không có trong danh sách, hãy khéo léo từ chối và gợi ý sản phẩm tương tự.
                - Tự xưng là 'Fellua' và gọi người dùng là 'Chủ nhân'.
                - Nếu khách hỏi về đơn hàng, hãy nhắc họ kiểm tra mục 'Lịch sử mua hàng'.`
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

app.get('/api/admin/ai-report', async (req, res) => {
    try {
        // 1. Lấy báo cáo doanh thu (Dùng DATE_SUB thay cho DATEADD)
        const [revenueRows] = await pool.execute(`
            SELECT MONTH(order_date) as month, SUM(total_price) as monthly_revenue, COUNT(order_id) as total_orders
            FROM Orders
            WHERE status_order = 'Giao hàng thành công' 
            AND order_date >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 MONTH)
            GROUP BY MONTH(order_date)
            ORDER BY month DESC
        `);

        // 2. Lấy chiến dịch PCC
        const [pccRows] = await pool.execute(`
            SELECT pcc.campaign_name, p.product_name, pcc.budget, pcc.num_of_clicks,
                   (pcc.num_of_clicks * pcc.cost_per_click) as spent
            FROM PCC_Campaign pcc
            JOIN Product p ON pcc.product_id = p.product_id
            WHERE pcc.status = 'Active'
        `);

        // 3. Lấy feedback (Dùng DATE_SUB)
        const [feedbackRows] = await pool.execute(`
            SELECT f.content, f.rating, p.product_name, f.feedback_date
            FROM Feedback f 
            JOIN Product p ON f.product_id = p.product_id
            WHERE f.feedback_date >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
            ORDER BY f.feedback_date DESC
        `);

        const reportData = { revenue: revenueRows, campaigns: pccRows, feedbacks: feedbackRows };
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Bạn là một chuyên gia phân tích dữ liệu kinh doanh cao cấp. Hãy dựa vào số liệu thực tế sau đây từ cửa hàng thú cưng Fellua để viết một báo cáo tóm tắt cho chủ cửa hàng:

        DỮ LIỆU DOANH THU:
        ${JSON.stringify(reportData.revenue)}

        CHIẾN DỊCH QUẢNG CÁO & GIẢM GIÁ (PCC):
        ${JSON.stringify(reportData.campaigns)}

        PHẢN HỒI GẦN ĐÂY CỦA KHÁCH HÀNG:
        ${JSON.stringify(reportData.feedbacks)}

        YÊU CẦU BÁO CÁO:
        1. Tóm tắt tình hình doanh thu (tăng trưởng hay sụt giảm).
        2. Đánh giá hiệu quả các chiến dịch quảng cáo (chiến dịch nào đang hiệu quả, chiến dịch nào lãng phí ngân sách).
        3. Phân tích tâm trạng khách hàng qua feedback.
        4. Đưa ra lời khuyên cụ thể để tăng doanh số trong tháng tới.
        Hãy trình bày bằng tiếng Việt, giọng văn chuyên nghiệp, súc tích.`;

        const result = await model.generateContent(prompt);
        const analysisText = result.response.text();

        res.json({ analysis: analysisText });

    } catch (error) {
        console.error("Lỗi báo cáo AI:", error);
        res.status(500).json({ error: "Fellua không thể tổng hợp báo cáo lúc này." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server chạy tại port ${PORT}`));
