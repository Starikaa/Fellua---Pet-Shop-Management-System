import React, { useState, useEffect } from 'react';
import axios from 'axios';

const STATUS_OPTIONS = [
    "Bạn có một đơn hàng mới",
    "Đã xác nhận đơn hàng",
    "Đã gói đơn hàng",
    "Đã gửi đơn hàng cho bên vận chuyển",
    "Giao hàng không thành công, hoàn đơn về cửa hàng",
    "Giao hàng thành công",
    "Hoàn đơn thành công",
    "Đã hủy"
];

function OrderManagement({ onBack }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/orders');
            setOrders(res.data);
        } catch (err) { alert("Lỗi tải danh sách đơn hàng"); }
    };

    const handleStatusChange = async (orderId, currentStatus, newStatus) => {
        try {
            await axios.put('http://localhost:5000/api/admin/orders/status', {
                orderId: orderId,
                newStatus: newStatus
            });
            fetchOrders(); 
        } catch (err) {
            console.error("Lỗi cập nhật:", err.response?.data);
            alert("Lỗi khi cập nhật trạng thái: " + (err.response?.data?.error || "Server không phản hồi"));
        }
    };

    return (
        <div className="admin-management-container">
            <div className="admin-header">
                <h2>Quản lý đơn hàng hệ thống</h2>
                <button className="back-btn" onClick={onBack}>← Quay lại</button>
            </div>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Tổng tiền</th>
                        <th>Ngày đặt hàng</th>
                        <th>Trạng thái hiện tại</th>
                        <th>Cập nhật trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.order_id}>
                            <td>{o.order_id}</td>
                            <td>{o.full_name}</td>
                            <td>{o.product_name} (x{o.num_per_prod})</td>
                            <td>{o.total_price.toLocaleString()}đ</td>
                            <td>{new Date(o.order_date).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <span className={`status-pill ${o.status_order === 'Giao hàng thành công' ? 'active' : 'pending'}`}>
                                    {o.status_order}
                                </span>
                            </td>
                            <td>
                                <select
                                    value={o.status_order}
                                    onChange={(e) => handleStatusChange(o.order_id, o.status_order, e.target.value)}
                                >
                                    <option disabled value="">-- Chọn trạng thái --</option>
                                    {STATUS_OPTIONS.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default OrderManagement; 
