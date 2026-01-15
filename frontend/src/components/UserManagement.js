// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserManagement({ user, onBack }) {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users');
            setUsers(res.data);
        } catch (err) { alert("Không thể lấy danh sách người dùng"); }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        try {
            await axios.put(`http://localhost:5000/api/admin/users/status`, { userId, status: newStatus });
            fetchUsers(); // C14: Cập nhật lại giao diện [cite: 198]
        } catch (err) { alert("Lỗi khi thay đổi trạng thái"); }
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            await axios.put(`http://localhost:5000/api/admin/users/role`, { userId, roleId: newRole });
            fetchUsers(); // C15: Cập nhật lại giao diện [cite: 200]
        } catch (err) { alert(err.response?.data?.error); }
    };

    return (
        <div className="admin-management-container">
            <div className="admin-header">
                <h2>Quản lý tài khoản hệ thống</h2>
                <button className="back-btn" onClick={onBack}>← Quay lại</button>
            </div>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.user_id}>
                            <td>{u.user_id}</td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>
                                <select value={u.role_id} onChange={(e) => handleChangeRole(u.user_id, e.target.value)} disabled={u.role_id === 'ADM'}>
                                    <option value="CUS">Khách hàng</option>
                                    <option value="STA">Nhân viên</option>
                                    <option value="ADM">Quản trị viên</option>
                                </select>
                            </td>
                            <td>
                                <span className={`status-pill ${u.status === 'Active' ? 'active' : 'inactive'}`}>
                                    {u.status || 'Active'}
                                </span>
                            </td>
                            <td>
                                {u.role_id !== 'ADM' ? (
                                    <button className="toggle-btn" onClick={() => handleToggleStatus(u.user_id, u.status)}>
                                        {u.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                                    </button>
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#888' }}>Hệ thống bảo vệ</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default UserManagement; 
