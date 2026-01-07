import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PPCManagement({ user, onBack }) {
    const [formData, setFormData] = useState({ name: '', budget: '', cpc: '', banner: null });
    const [campaigns, setCampaigns] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);

    const [newPPC, setNewPPC] = useState({
        name: '',
        productId: '',
        budget: '',
        cpc: '',
        banner: null
    });

    const fetchCampaigns = async () => {
        const res = await axios.get('http://localhost:5000/api/admin/ppc');
        setCampaigns(res.data);
    };

    useEffect(() => { fetchCampaigns(); }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn dừng và xóa quảng cáo này?")) {
            await axios.delete(`http://localhost:5000/api/admin/ppc/${id}`);
            fetchCampaigns();
        }
    };

    const handleCreatePPC = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('creatorId', user.user_id);
        data.append('campaignName', formData.name);
        data.append('budget', formData.budget);
        data.append('cpc', formData.cpc);
        data.append('productId', formData.productId);
        data.append('banner', formData.banner);

        try {
            await axios.post('http://localhost:5000/api/admin/ppc', data);
            setShowAddForm(false); 
            fetchCampaigns();
        } catch (err) {
            alert("Lỗi tạo chiến dịch: " + err.response?.data?.error);
        }
    };


    const handleUpdatePPC = async (e) => {
        e.preventDefault();
        const formDataUpdate = new FormData();
        formDataUpdate.append('campaign_name', editingCampaign.campaign_name);
        formDataUpdate.append('budget', editingCampaign.budget);
        formDataUpdate.append('status', editingCampaign.status);
        formDataUpdate.append('cost_per_click', editingCampaign.cost_per_click);
        formDataUpdate.append('banner_url', editingCampaign.banner_url);

        if (editingCampaign.newBanner) {
            formDataUpdate.append('banner', editingCampaign.newBanner);
        }

        try {
            await axios.put(`http://localhost:5000/api/admin/ppc/${editingCampaign.campaign_id}`, formDataUpdate);
            setEditingCampaign(null);
            fetchCampaigns();
        } catch (err) {
            const errorMsg = err.response?.data?.error || "Lỗi khi xóa";
            alert("❌ " + errorMsg);
        }
    };

    return (
        <div className="admin-management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={onBack} className="back-btn">← Quay lại</button>

                {/* NÚT THÊM CHIẾN DỊCH MỚI */}
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{ background: '#27ae60', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Tạo chiến dịch PPC mới
                </button>
            </div>

            <h2>📢 Quản lý chiến dịch quảng cáo</h2>

            {/* MODAL FORM TẠO MỚI (Chỉ hiện khi showAddForm là true) */}
            {showAddForm && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.6)', width: '100%', height: '100%', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="auth-card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Tạo chiến dịch PPC mới</h3>
                        <form onSubmit={handleCreatePPC} className="auth-form-content">
                            <div className="input-group">
                                <label>Tên chiến dịch</label>
                                <input required onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Mã sản phẩm quảng cáo & giảm giá</label>
                                <input
                                    type="number"
                                    placeholder="Nhập Product ID"
                                    onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                />
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label>Ngân sách (Budget)</label>
                                    <input type="number" onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Giá mỗi lượt click (CPC)</label>
                                    <input type="number" onChange={e => setFormData({ ...formData, cpc: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Tải banner quảng cáo</label>
                                <input type="file" onChange={e => setFormData({ ...formData, banner: e.target.files[0] })} />
                            </div>
                            <button type="submit" className="auth-submit-btn">Xác nhận tạo chiến dịch</button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn" style={{ width: '100%', marginTop: '10px' }}>Hủy bỏ</button>
                        </form>
                    </div>
                </div>
            )}

            {/* BẢNG DANH SÁCH CHIẾN DỊCH (Luôn hiển thị) */}
            <div className="campaign-list-section">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Banner</th>
                            <th>Chiến dịch</th>
                            <th>Sản phẩm</th>
                            <th>Ngân sách</th>
                            <th>Mức giảm giá mỗi lượt mua (CPC)</th>
                            <th>Đã tiêu</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.map(cp => (
                            <tr key={cp.campaign_id}>
                                <td><img src={cp.banner_url} style={{ width: '80px', borderRadius: '5px' }} alt="banner" /></td>
                                <td>{cp.campaign_name}</td>
                                <td>#{cp.product_id}</td>
                                <td>{Number(cp.budget).toLocaleString()}đ</td>
                                <td>{Number(cp.cost_per_click).toLocaleString()}đ</td>
                                <td>{(cp.num_of_clicks * cp.cost_per_click).toLocaleString()}đ</td>
                                <td>
                                    <span className={`status-pill ${cp.status.toLowerCase()}`}>
                                        {cp.status === 'Active' ? '🟢 Đang chạy' : '🔴 Kết thúc'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => setEditingCampaign(cp)} style={{ color: '#f39c12', border: 'none', background: 'none', cursor: 'pointer', marginRight: '10px' }}>
                                        ✏️ Sửa
                                    </button>
                                    <button onClick={() => handleDelete(cp.campaign_id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️ Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingCampaign && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.6)', width: '100%', height: '100%', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="auth-card" style={{ width: '500px' }}>
                        <h3>Chỉnh sửa chiến dịch #{editingCampaign.campaign_id}</h3>
                        <form onSubmit={handleUpdatePPC} className="auth-form-content">
                            <div className="input-group">
                                <label>Tên chiến dịch</label>
                                <input value={editingCampaign.campaign_name} onChange={(e) => setEditingCampaign({ ...editingCampaign, campaign_name: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Ngân sách (VNĐ)</label>
                                <input type="number" value={editingCampaign.budget} onChange={(e) => setEditingCampaign({ ...editingCampaign, budget: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Mức giảm giá mỗi lượt mua (CPC)</label>
                                <input
                                    type="number"
                                    value={editingCampaign.cost_per_click}
                                    onChange={(e) => setEditingCampaign({ ...editingCampaign, cost_per_click: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Trạng thái</label>
                                <select value={editingCampaign.status} onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}>
                                    <option value="Active">Active (Đang chạy)</option>
                                    <option value="Ended">Ended (Dừng)</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Thay banner mới (Để trống nếu giữ cũ)</label>
                                <input type="file" onChange={(e) => setEditingCampaign({ ...editingCampaign, newBanner: e.target.files[0] })} />
                            </div>

                            <button type="submit" className="auth-submit-btn">Lưu thay đổi</button>
                            <button type="button" onClick={() => setEditingCampaign(null)} className="cancel-btn" style={{ width: '100%', marginTop: '10px' }}>Hủy</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 
export default PPCManagement;
