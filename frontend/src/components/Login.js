// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin, onSwitch }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Thêm state để hiện lỗi ngay trên form

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/login', { email, password });
            onLogin(res.data);
        } catch (err) {
            // Hiển thị lỗi cụ thể từ server (ví dụ: Tài khoản bị khóa) 
            setError(err.response?.data?.error || "Sai tài khoản hoặc mật khẩu!");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🐾</div>
                    <h2>Mừng chủ nhân trở về</h2>
                    <p>Đăng nhập để tiếp tục chăm sóc thú cưng</p>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form-content">
                    <div className="input-group">
                        <label>Email của bạn</label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-submit-btn">Đăng nhập</button>
                </form>

                <div className="auth-footer">
                    <p>Chưa có tài khoản? <span onClick={onSwitch}>Đăng ký ngay</span></p>
                </div>
            </div>
        </div>
    );
}

export default Login;