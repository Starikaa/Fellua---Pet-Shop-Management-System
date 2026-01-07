// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';

function Register({ onSwitch }) {
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', dob: '', sex: 'M'
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('http://localhost:5000/api/register', formData);
            alert("Đăng ký thành công! Mời chủ nhân đăng nhập.");
            onSwitch();
        } catch (err) {
            const serverError = err.response?.data?.error || "Đăng ký thất bại!";
            setError(serverError);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🐾</div>
                    <h2>Gia nhập PSVA</h2>
                    <p>Tạo tài khoản để nhận ưu đãi chăm sóc tốt nhất</p>
                </div>

                {error && <div className="auth-error-msg">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="auth-form-content">
                    <div className="input-group">
                        <label>Họ và tên</label>
                        <input
                            type="text"
                            placeholder="Nhập tên của bạn"
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Ngày sinh</label>
                            <input
                                type="date"
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Giới tính</label>
                            <select onChange={e => setFormData({ ...formData, sex: e.target.value })}>
                                <option value="M">Nam</option>
                                <option value="F">Nữ</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn">Tạo tài khoản</button>
                </form>

                <div className="auth-footer">
                    <p>Đã có tài khoản? <span onClick={onSwitch}>Đăng nhập ngay</span></p>
                </div>
            </div>
        </div>
    );
}

export default Register;