import React, { useState } from 'react';

function HomePage({ products, categories, onProductClick, onCategorySelect, activeCategory }) {
    // 1. Đưa useState vào TRONG hàm component
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Logic lọc sản phẩm (nếu muốn dùng thanh tìm kiếm)
    const filteredProducts = products.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <div className="home-container">
            <section className="categories-grid">
                <h2 className="section-title">Danh mục thú cưng</h2>
                <div className="cat-list">
                    {/* categories ở đây chính là categories truyền từ App.js xuống */}
                    {categories && categories.map(cat => (
                        <div
                            key={cat.category_id}
                            className={`cat-item ${activeCategory === cat.category_id ? 'active' : ''}`}
                            onClick={() => onCategorySelect(cat.category_id)}
                        >
                            <div className="cat-icon">
                                {/* Hiện icon từ DB, nếu DB trống mới hiện dấu chân */}
                                {cat.category_icon ? cat.category_icon : '🐾'}
                            </div>
                            <p>{cat.category_name}</p>
                        </div>
                    ))}
                </div>
            </section>
            <div className="search-box" style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <section className="product-list-section">
                <h2 className="section-title">
                    {activeCategory
                        ? `Sản phẩm cho ${categories.find(c => c.category_id === activeCategory)?.category_name}`
                        : "Sản phẩm nổi bật"}
                </h2>
                <div className="grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div className="card" key={product.product_id} onClick={() => onProductClick(product)}>
                                <div className="product-img" style={{ position: 'relative' }}>
                                    {product.discount_amount > 0 && (
                                        <div className="card-discount-badge">
                                            -{Math.round((product.discount_amount / (product.price + product.discount_amount)) * 100)}%
                                        </div>
                                    )}
                                    <img src={product.image_url || 'https://via.placeholder.com/200'} alt={product.product_name} />
                                </div>
                                <div className="card-info">
                                    <h3>{product.product_name}</h3>
                                    <div className="rating-info" style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                                        {product.total_feedback > 0 ? (
                                            <span>⭐ {Number(product.avg_rating).toFixed(1)} ({product.total_feedback} đánh giá)</span>
                                        ) : (
                                            <span>Chưa có đánh giá</span>
                                        )}
                                    </div>
                                    <div className="price-box">
                                        <span className="current-price">{product.price.toLocaleString()}đ</span>
                                        {/* Nếu có discount_amount > 0 thì mới hiện giá cũ */}
                                        {product.discount_amount > 0 && (
                                            <span className="old-price">{(product.price + product.discount_amount).toLocaleString()}đ</span>
                                        )}
                                    </div>
                                    <button className="view-detail">Xem chi tiết</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ textAlign: 'center', gridColumn: '1/-1' }}>Hiện chưa có sản phẩm nào thuộc danh mục này.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
export default HomePage;