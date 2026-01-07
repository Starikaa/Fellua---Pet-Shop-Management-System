// OrderHistory.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function OrderHistory({ user, onBack }) {
    const [orders, setOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedProd, setSelectedProd] = useState(null);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    // Fetch lịch sử đơn hàng
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/orders/user/${user.user_id}`);
                setOrders(res.data);
            } catch (err) { console.error("Lỗi tải đơn hàng"); }
        };
        if (user) fetchOrders();
    }, [user]);

    const handleFeedbackSubmit = async () => {
        // Kiểm tra tính hợp lệ của dữ liệu trước khi gửi
        if (!selectedProd || !selectedProd.product_id) {
            alert("Lỗi hệ thống: Không xác định được mã sản phẩm!");
            return;
        }

        // Kiểm tra quy tắc tối thiểu 3 từ
        const words = content.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 3) {
            alert("Đánh giá dưới 3 từ: Vui lòng nhập thêm cảm nhận của bạn! 🐾");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/feedback', {
                userId: user.user_id,
                productId: selectedProd.product_id, // Truyền mã sản phẩm vào đây
                content: content,
                rating: rating
            });

            alert("Đánh giá thành công! Sản phẩm đã được cập nhật thêm 1 đánh giá mới. ✨");
            setShowModal(false);
            setContent('');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.error || "Không thể gửi đánh giá"));
        }
    };
    const handleCancelOrder = async (orderId) => {
        if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không? Số lượng sản phẩm sẽ được hoàn lại kho.")) {
            try {
                await axios.put(`http://localhost:5000/api/orders/cancel/${orderId}`);
                // Tải lại danh sách đơn hàng
                const res = await axios.get(`http://localhost:5000/api/orders/user/${user.user_id}`);
                setOrders(res.data);
            } catch (err) {
                alert("Lỗi khi hủy đơn: " + (err.response?.data || err.message));
            }
        }
    };

    return (
        <div className="order-history-page" style={{ padding: '40px 8%' }}>
            <button onClick={onBack} className="back-btn">← Quay lại</button>
            <h2 className="section-title">Lịch sử đơn hàng của bạn</h2>

            <div className="order-list">
                {orders.map((order) => (
                    <div key={order.order_id} className="order-item-card" style={{ marginBottom: '20px', border: '1px solid #eee' }}>
                        <div className="order-info">
                            <h3>Đơn hàng #{order.order_id}</h3>
                            <p>Sản phẩm: <strong>{order.product_name}</strong></p>
                            <p>Số lượng: {order.num_per_prod}</p>
                            <p className="order-total">Tổng tiền: {Number(order.total_price).toLocaleString()}đ</p>

                            <span className={`order-status ${order.status_order === 'Giao hàng thành công' ? 'completed' : ''}`}>
                                {order.status_order}
                            </span>

                            {order.status_order === 'Giao hàng thành công' && (
                                <button
                                    className="view-detail"
                                    style={{
                                        background: '#27ae60',
                                        color: 'white',
                                        border: 'none',
                                        marginLeft: '15px',
                                        padding: '8px 20px',
                                        borderRadius: '10px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => { setSelectedProd(order); setShowModal(true); }}
                                >
                                    FEEDBACK
                                </button>
                            )}
                            <td>
                                {order.status_order !== 'Đã hủy' && order.status_order !== 'Giao hàng thành công' && (
                                    <button
                                        onClick={() => handleCancelOrder(order.order_id)}
                                        style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                                    >
                                        Hủy đơn
                                    </button>
                                )}
                            </td>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="auth-card">
                        <h3>Đánh giá cho: {selectedProd?.product_name}</h3>
                        <div className="input-group">
                            <label>Chọn số sao</label>
                            <select value={rating} onChange={(e) => setRating(e.target.value)}>
                                <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                                <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                                <option value="3">⭐⭐⭐ (3 sao)</option>
                                <option value="2">⭐⭐ (2 sao)</option>
                                <option value="1">⭐ (1 sao)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Nội dung đánh giá</label>
                            <textarea
                                placeholder="Cảm nhận của bạn về sản phẩm..."
                                style={{ width: '100%', padding: '10px', borderRadius: '10px' }}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        <button
                            className="auth-submit-btn"
                            onClick={handleFeedbackSubmit}
                        >
                            Gửi
                        </button>
                        <button className="cancel-btn" onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: '10px' }}>Hủy</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderHistory;