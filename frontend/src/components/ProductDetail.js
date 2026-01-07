// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ProductDetail({ product: initialProduct, user, onBack }) {
    // 1. Tạo state để lưu số lượng người dùng chọn
    const [product, setProduct] = useState(initialProduct);
    const [quantity, setQuantity] = useState(1);
    const [feedbacks, setFeedbacks] = useState([]);
    const displayStock = (product?.ppc_status === 'Active' && Number(product?.max_discount_qty) > 0)
        ? product.max_discount_qty
        : product?.num_product;

    const isPromo = product?.ppc_status === 'Active' && Number(product?.max_discount_qty) > 0;

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/feedback/product/${product.product_id}`);
                setFeedbacks(res.data);
            } catch (err) {
                console.error("Lỗi tải bình luận");
            }
        };
        if (product) fetchFeedbacks();
    }, [product]);


    useEffect(() => {
        const loadProductData = async () => {
            try {
                // Gọi API lấy thông tin mới nhất bao gồm discount_amount
                const res = await axios.get(`http://localhost:5000/api/products/${initialProduct.product_id}`);
                setProduct(res.data);

                // Tải bình luận
                const fbRes = await axios.get(`http://localhost:5000/api/feedback/product/${initialProduct.product_id}`);
                setFeedbacks(fbRes.data);
            } catch (err) {
                console.error("Lỗi tải dữ liệu sản phẩm");
            }
        };
        if (initialProduct) loadProductData();
    }, [initialProduct]);

    if (!product) return null;

    const handleOrder = async () => {
        if (!user) {
            alert("Chủ nhân vui lòng đăng nhập để đặt hàng nhé!");
            return;
        }

        // Kiểm tra số lượng hợp lệ
        if (quantity <= 0 || quantity > product.num_product) {
            alert("HẾT HÀNG TẠM THỜI 🐾");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/orders', {
                userId: user.user_id,
                productId: product.product_id,
                quantity: quantity, 
                totalPrice: product.price * quantity 
            });
            alert("Đặt hàng thành công!")
            const res = await axios.get(`http://localhost:5000/api/products/${product.product_id}`);
            setProduct(res.data); 
            setQuantity(1);
        } catch (err) {
            alert("Lỗi khi đặt hàng!");
        }
    };

    const discountAmount = Number(product.discount_amount || 0); 
    const originalPrice = Number(product.price) + discountAmount;
    const discountPercent = discountAmount > 0
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0;

    return (
        <div className="product-detail-page">
            <div className="detail-header">
                <button className="back-btn" onClick={onBack}>
                    <span className="back-icon">←</span> Quay lại trang chủ
                </button>
            </div>
            <div className="product-detail-content">
                <div className="detail-image-section" style={{ position: 'relative' }}>
                    {/* 1. HIỂN THỊ BADGE PHẦN TRĂM NGAY TRÊN ẢNH */}
                    {discountPercent > 0 && (
                        <div className="discount-badge">-{discountPercent}%</div>
                    )}
                    <img src={product.image_url} alt={product.product_name} className="main-product-img" />
                </div>

                <div className="detail-info-section">
                    <h1 className="detail-title">{product.product_name}</h1>

                    <div className="price-container" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <p className="detail-price">
                            {(product.price * quantity).toLocaleString()}đ
                        </p>

                        {/* 2. HIỂN THỊ GIÁ CŨ GẠCH ĐI */}
                        {discountAmount > 0 && (
                            <p className="original-price-strikethrough">
                                {(originalPrice * quantity).toLocaleString()}đ
                            </p>
                        )}
                    </div>
                    <div className="detail-stock">
                        <span className={`status-dot ${displayStock > 0 ? 'in-stock' : 'out-of-stock'}`}></span>
                        <span>
                            {displayStock > 0
                                ? (isPromo
                                    ? `Chỉ còn ${displayStock} suất giá ưu đãi!`
                                    : `Còn lại: ${displayStock} sản phẩm`)
                                : "Hết hàng"}
                        </span>
                    </div>
                    <div className="detail-description">
                        <h3>Mô tả sản phẩm:</h3>
                        <p>{product.detail_product || "Sản phẩm được tuyển chọn kỹ lưỡng, đảm bảo an toàn và sức khỏe cho thú cưng của bạn."}</p>
                    </div>

                    <div className="quantity-selector">
                        <div className="qty-controls">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                            <input type="number" value={quantity} readOnly />
                            <button onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}>+</button>
                        </div>
                        {isPromo && <p className="stock-hint">(Khách hàng nên mua nhanh kẻo hết suất giảm giá 🐾)</p>}
                    </div>

                    <div className="action-buttons">
                        <button className="buy-now-btn" onClick={handleOrder}>ĐẶT MUA NGAY</button>
                    </div>
                </div>
            </div>
            <div className="feedback-section" style={{ marginTop: '50px' }}>
                <h3>Đánh giá từ khách hàng ({feedbacks.length})</h3>
                <hr />
                {feedbacks.length > 0 ? (
                    <div className="feedback-list" style={{ marginTop: '20px' }}>
                        {feedbacks.map((fb, index) => (
                            <div key={index} className="feedback-item" style={{
                                background: 'white',
                                padding: '20px',
                                borderRadius: '15px',
                                marginBottom: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{fb.full_name}</strong>
                                    <span style={{ color: '#f39c12' }}>{'⭐'.repeat(Math.round(fb.rating))}</span>
                                </div>
                                <p style={{ margin: '10px 0', color: '#555' }}>{fb.content}</p>
                                <small style={{ color: '#aaa' }}>{new Date(fb.feedback_date).toLocaleDateString()}</small>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Sản phẩm này chưa có bình luận nào. Hãy là người đầu tiên đánh giá nhé! 🐾</p>
                )}
            </div>
        </div>
    );
}
export default ProductDetail;