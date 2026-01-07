import React, { useState } from 'react';
import axios from 'axios';

function ProfilePage({ user, setUser, onLogout, onBack }) {
    const [isEditing, setIsEditing] = useState(false);
    // Sửa lỗi: Lấy đúng trường date_of_birth từ database
    const [editData, setEditData] = useState({
        fullName: user.fullName,
        dob: user.dob ? user.dob.split('T')[0] : '', // Chuyển định dạng ISO sang YYYY-MM-DD
        sex: user.sex || 'M'
    });

    const handleUpdate = async () => {
        try {
            const res = await axios.put('http://localhost:5000/api/user/update', {
                userId: user.user_id,
                ...editData
            });
            alert(res.data.message);
            setUser({ ...user, ...editData, fullName: editData.fullName });
            setIsEditing(false); // Đóng chế độ sửa sau khi lưu
        } catch (err) { alert("Lỗi cập nhật!"); }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <button className="back-link" onClick={onBack}>← Quay lại trang chủ</button>
                    <h2>Hồ sơ cá nhân</h2>
                </div>

                <div className="profile-avatar-section">
                    <div className="avatar-circle">{user.fullName.charAt(0)}</div>
                    <p className="user-role-badge">{user.role === 'ADM' ? 'Quản trị viên' : 'Khách hàng'}</p>
                </div>

                <div className="profile-form">
                    <div className="info-group">
                        <label>Họ và tên</label>
                        <input
                            type="text"
                            disabled={!isEditing}
                            value={editData.fullName}
                            onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                        />
                    </div>

                    <div className="info-row">
                        <div className="info-group">
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                disabled={!isEditing}
                                value={editData.dob}
                                onChange={e => setEditData({ ...editData, dob: e.target.value })}
                            />
                        </div>
                        <div className="info-group">
                            <label>Giới tính</label>
                            <select
                                disabled={!isEditing}
                                value={editData.sex}
                                onChange={e => setEditData({ ...editData, sex: e.target.value })}
                            >
                                <option value="M">Nam</option>
                                <option value="F">Nữ</option>
                            </select>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {!isEditing ? (
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>Chỉnh sửa thông tin</button>
                        ) : (
                            <div className="edit-mode-btns">
                                <button className="save-btn" onClick={handleUpdate}>Lưu thay đổi</button>
                                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Hủy</button>
                            </div>
                        )}
                        <button className="logout-btn-outline" onClick={onLogout}>Đăng xuất tài khoản</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default ProfilePage;