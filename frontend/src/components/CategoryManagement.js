import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CategoryManagement({ onBack }) {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState({ id: '', name: '', icon: '' });
    const [editingCat, setEditingCat] = useState(null);

    useEffect(() => { fetchCats(); }, []);

    const fetchCats = async () => {
        const res = await axios.get('http://localhost:5000/api/categories');
        setCategories(res.data);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admin/categories', {
                categoryId: newCat.id,
                categoryName: newCat.name,
                categoryIcon: newCat.icon
            });
            alert("Thêm thành công!");
            setNewCat({ id: '', name: '', icon: '' });
            fetchCats(); // Cập nhật danh sách mới
        } catch (err) { alert("Lỗi khi thêm!"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Xóa loại hàng này sẽ ảnh hưởng đến hiển thị, bạn chắc chứ?")) {
            try {
                await axios.delete(`http://localhost:5000/api/admin/categories/${id}`);
                fetchCats();
            } catch (err) { alert(err.response.data.error); }
        }
    };
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:5000/api/admin/categories/${editingCat.category_id}`, {
                categoryName: editingCat.category_name,
                categoryIcon: editingCat.category_icon
            });
            setEditingCat(null);
            fetchCats(); 
        } catch (err) {
            alert("Lỗi khi cập nhật danh mục");
        }
    };

    return (
        <div className="admin-management-container">
            <button onClick={onBack} className="back-btn">← Quay lại</button>
            <h2>Quản lý danh mục (Loại hàng)</h2>

            {editingCat && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.5)', width: '100%', height: '100%', zIndex: 3000, display: 'flex', alignItems: 'center' }}>
                    <div className="auth-card">
                        <h3>Chỉnh sửa danh mục: {editingCat.category_id}</h3>
                        <form onSubmit={handleUpdate} className="auth-form-content">
                            <div className="input-group">
                                <label>Tên loại hàng</label>
                                <input
                                    value={editingCat.category_name}
                                    onChange={e => setEditingCat({ ...editingCat, category_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Biểu tượng (Emoji)</label>
                                <input
                                    value={editingCat.category_icon}
                                    onChange={e => setEditingCat({ ...editingCat, category_icon: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="auth-submit-btn">Lưu thay đổi</button>
                            <button type="button" onClick={() => setEditingCat(null)} className="cancel-btn" style={{ width: '100%', marginTop: '10px' }}>Hủy</button>
                        </form>
                    </div>
                </div>
            )}
            <form onSubmit={handleAdd} className="auth-form-content" style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '15px' }}>
                <div className="input-row">
                    <div className="input-group">
                        <label>Mã (VD: DOG, CAT)</label>
                        <input value={newCat.id} onChange={e => setNewCat({ ...newCat, id: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label>Tên hiển thị</label>
                        <input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} required />
                    </div>
                    <div className="input-group">
                        <label>Biểu tượng (Emoji)</label>
                        <input value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} placeholder="🐶" />
                    </div>
                </div>
                <button type="submit" className="auth-submit-btn">Thêm loại hàng</button>
            </form>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Biểu tượng</th>
                        <th>Mã</th>
                        <th>Tên loại</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.category_id}>
                            <td style={{ fontSize: '24px' }}>{cat.category_icon}</td>
                            <td>{cat.category_id}</td>
                            <td>{cat.category_name}</td>
                            <td>
                                <button onClick={() => handleDelete(cat.category_id)} style={{ color: 'red' }}>Xóa</button>
                                <button onClick={() => setEditingCat(cat)}>Sửa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default CategoryManagement; 
