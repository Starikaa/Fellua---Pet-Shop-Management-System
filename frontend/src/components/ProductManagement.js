import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProductManagement({ onBack }) {
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [dbCategories, setDbCategories] = useState([]);

    // State cho sản phẩm mới
    const [newProduct, setNewProduct] = useState({
        categoryId: 'ACC',
        productName: '',
        price: '',
        numProduct: '',
        detailProduct: '',
        image: null
    });
    

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setDbCategories(res.data);

            // Cập nhật giá trị mặc định cho sản phẩm mới là ID của danh mục đầu tiên
            if (res.data.length > 0) {
                setNewProduct(prev => ({ ...prev, categoryId: res.data[0].category_id }));
            }
        } catch (err) { console.error("Lỗi tải danh mục"); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
        } catch (err) { console.error("Lỗi tải sản phẩm"); }
    };

    // --- CHỨC NĂNG THÊM MỚI ---
    const handleAddProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('categoryId', newProduct.categoryId);
        formData.append('productName', newProduct.productName);
        formData.append('price', newProduct.price);
        formData.append('numProduct', newProduct.numProduct);
        formData.append('detailProduct', newProduct.detailProduct);
        if (newProduct.image) formData.append('image', newProduct.image);

        try {
            await axios.post('http://localhost:5000/api/admin/products', formData);
            setShowAddForm(false);
            fetchProducts();
        } catch (err) { alert("Lỗi khi thêm sản phẩm"); }
    };

    // --- CHỨC NĂNG XÓA ---
    const handleDelete = async (id) => {
        if (window.confirm("Chủ nhân chắc chắn muốn xóa mặt hàng này chứ? 🐾")) {
            try {
                await axios.delete(`http://localhost:5000/api/admin/products/${id}`);
                fetchProducts();
            } catch (err) {
                const errorMsg = err.response?.data?.error || "Đã xảy ra lỗi không xác định khi xóa.";
                alert("⚠️ Lỗi: " + errorMsg); }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('productName', editingProduct.product_name);
        formData.append('price', editingProduct.price);
        formData.append('numProduct', editingProduct.num_product);
        formData.append('detailProduct', editingProduct.detail_product);
        formData.append('categoryId', editingProduct.category_id);
        formData.append('imageUrl', editingProduct.image_url); // Link ảnh cũ
        if (editingProduct.newImage) {
            formData.append('image', editingProduct.newImage); // File ảnh mới nếu có
        }

        try {
            await axios.put(`http://localhost:5000/api/admin/products/${editingProduct.product_id}`, formData);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) { alert("Lỗi khi cập nhật"); }
    };

    return (
        <div className="admin-management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={onBack} className="back-btn">← Quay lại</button>
                <button
                    onClick={() => setShowAddForm(true)}
                    style={{ background: '#27ae60', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
                >
                    + Thêm sản phẩm mới
                </button>
            </div>

            <h2>📦 Quản lý kho hàng</h2>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Giá</th>
                        <th>Số lượng</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.product_id}>
                            <td>{p.product_id}</td>
                            <td><img src={p.image_url} alt="pet" style={{ width: '50px', borderRadius: '5px' }} /></td>
                            <td>{p.product_name}</td>
                            <td>{Number(p.price).toLocaleString()}đ</td>
                            <td>{p.num_product}</td>
                            <td>
                                <button onClick={() => setEditingProduct(p)} className="toggle-btn">📝 Sửa</button>
                                <button onClick={() => handleDelete(p.product_id)} className="toggle-btn" style={{ color: 'red' }}>🗑️ Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* MODAL THÊM MỚI */}
            {showAddForm && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.6)', width: '100%', height: '100%', zIndex: 3000, display: 'flex', alignItems: 'center' }}>
                    <div className="auth-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Thêm sản phẩm mới</h3>
                        <form onSubmit={handleAddProduct} className="auth-form-content">
                            <div className="input-group">
                                <label>Danh mục</label>
                                <select
                                    value={newProduct.categoryId}
                                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                                >
                                    {dbCategories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Tên sản phẩm</label>
                                <input required onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label>Mô tả chi tiết sản phẩm</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Nhập đặc điểm, tính cách hoặc hướng dẫn sử dụng..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1.5px solid #eee' }}
                                    onChange={(e) => setNewProduct({ ...newProduct, detailProduct: e.target.value })}
                                />
                            </div>
                            <div className="input-row">
                                <div className="input-group">
                                    <label>Giá (VNĐ)</label>
                                    <input type="number" required onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Số lượng</label>
                                    <input type="number" required onChange={(e) => setNewProduct({ ...newProduct, numProduct: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Hình ảnh</label>
                                <input type="file" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, image: e.target.files[0] })} />
                            </div>
                            <button type="submit" className="auth-submit-btn">Xác nhận thêm</button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="cancel-btn" style={{ width: '100%', marginTop: '10px' }}>Đóng</button>
                        </form>
                    </div>
                </div>
            )}

            {editingProduct && (
                <div className="auth-container" style={{ position: 'fixed', top: 0, left: 0, background: 'rgba(0,0,0,0.6)', width: '100%', height: '100%', zIndex: 3000, display: 'flex', alignItems: 'center' }}>
                    <div className="auth-card" style={{ maxHeight: '95vh', overflowY: 'auto', width: '500px' }}>
                        <h3>Chỉnh sửa mặt hàng</h3>
                        <form onSubmit={handleUpdate} className="auth-form-content">
                            <div className="input-group">
                                <label>Loại thú cưng / Sản phẩm</label>
                                <select
                                    value={editingProduct.category_id}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                                >
                                    {dbCategories.map(cat => (
                                        <option key={cat.category_id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Tên sản phẩm</label>
                                <input value={editingProduct.product_name} onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })} />
                            </div>

                            <div className="input-group">
                                <label>Mô tả chi tiết</label>
                                <textarea
                                    rows="4"
                                    style={{ width: '100%', borderRadius: '12px', padding: '10px', border: '1.5px solid #eee' }}
                                    value={editingProduct.detail_product}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, detail_product: e.target.value })}
                                />
                            </div>

                            <div className="input-row">
                                <div className="input-group">
                                    <label>Giá</label>
                                    <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Số lượng</label>
                                    <input type="number" value={editingProduct.num_product} onChange={(e) => setEditingProduct({ ...editingProduct, num_product: e.target.value })} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Thay đổi ảnh minh họa (Để trống nếu giữ ảnh cũ)</label>
                                <input type="file" accept="image/*" onChange={(e) => setEditingProduct({ ...editingProduct, newImage: e.target.files[0] })} />
                            </div>

                            <button type="submit" className="auth-submit-btn">Lưu tất cả thay đổi</button>
                            <button type="button" onClick={() => setEditingProduct(null)} className="cancel-btn" style={{ width: '100%', marginTop: '10px' }}>Hủy bỏ</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductManagement;