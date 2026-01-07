import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import ProductDetail from './components/ProductDetail';
import UserManagement from './components/UserManagement';
import ProductManagement from './components/ProductManagement';
import OrderHistory from './components/OrderHistory';
import OrderManagement from './components/OrderManagement';
import CategoryManagement from './components/CategoryManagement';
import PPCManagement from './components/PPCManagement';
import FinancialReport from './components/FinancialReport';

function App() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isRegistering, setIsRegistering] = useState(false);
    const [guestAskCount, setGuestAskCount] = useState(0);
    const [setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ fullName: '', dob: '', sex: '' });
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [currentPPC, setCurrentPPC] = useState(null);
    const [activeCampaigns, setActiveCampaigns] = useState([]);

    // 1. Lấy danh sách sản phẩm từ Backend khi web vừa load
    useEffect(() => {
        // Giả sử bạn có route /api/products ở backend
        axios.get('http://localhost:5000/api/products')
            .then(res => setProducts(res.data))
            .catch(err => console.log("Chưa có API lấy sản phẩm"));
        const handleTabClose = () => {
            if (!user) {
                // Gửi yêu cầu xóa lời thoại Guest trước khi đóng trình duyệt
                navigator.sendBeacon('http://localhost:5000/api/chat/guest/clear');
            }
        };
        const fetchCats = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/categories');
                setCategories(res.data);
            } catch (err) {
                console.error("Lỗi: Không thể lấy danh mục từ DB");
            }
        };
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user'); // Xóa khi logout
        }
        fetchCats();
        const fetchPPC = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/ppc/active');
                setActiveCampaigns(res.data);
            } catch (err) { console.error("Lỗi tải PPC"); }
        };
        fetchPPC();
        window.addEventListener('beforeunload', handleTabClose);
        return () => window.removeEventListener('beforeunload', handleTabClose);
    }, [user]);

    useEffect(() => {
        if (currentPage === 'home') {
            refreshHomeData();
        }
    }, [currentPage]);

    const refreshHomeData = async () => {
        try {
            // Lấy lại danh sách sản phẩm (để cập nhật giá gốc/giảm)
            const prodRes = await axios.get('http://localhost:5000/api/products');
            setProducts(prodRes.data);

            // Lấy lại danh sách quảng cáo đang Active (để gỡ banner hết hạn)
            const ppcRes = await axios.get('http://localhost:5000/api/ppc/active');
            setActiveCampaigns(ppcRes.data);
        } catch (err) {
            console.error("Lỗi làm mới dữ liệu trang chủ:", err);
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setCurrentPage('home');
        setMessages([]); 
    };

    const handleBannerClick = (campaign) => {
        // Tìm sản phẩm tương ứng trong danh sách products đã có
        const targetProduct = products.find(p => p.product_id === campaign.product_id);
        if (targetProduct) {
            setSelectedProduct(targetProduct);
            setCurrentPage('product-detail'); // Chuyển thẳng tới trang chi tiết để mua
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'login':
                return <Login onLogin={(data) => { handleLoginSuccess(data); setCurrentPage('home'); }}
                    onSwitch={() => setCurrentPage('register')} />;
            case 'register':
                return <Register onSwitch={() => setCurrentPage('login')} />;
            case 'profile':
                return <ProfilePage user={user} setUser={setUser} onLogout={handleLogout} onBack={() => setCurrentPage('home')} />;
            case 'product-detail':
                return <ProductDetail
                    product={selectedProduct}
                    user={user} 
                    onBack={() => {
                        refreshHomeData(); 
                        setCurrentPage('home');
                    }}
                />;
            case 'admin-users':
                if (user && user.role === 'ADM') {
                    return <UserManagement user={user} onBack={() => setCurrentPage('home')} />;
                } else {
                    setCurrentPage('home'); // Chặn nếu không phải Admin [cite: 138]
                    return null;
                }
            case 'manage-products':
                if (user && (user.role === 'STA' || user.role === 'ADM')) {
                    return <ProductManagement onBack={() => setCurrentPage('home')} />;
                }
                return null;
            case 'order-history':
                return <OrderHistory user={user} onBack={() => setCurrentPage('home')} />;
            case 'manage-orders':
                if (user && (user.role === 'STA' || user.role === 'ADM')) {
                    return <OrderManagement onBack={() => setCurrentPage('home')} />;
                }
                return null;
            case 'manage-categories':
                if (user && (user.role === 'STA' || user.role === 'ADM')) {
                    return <CategoryManagement onBack={() => setCurrentPage('home')} />;
                }
                return null;
            case 'manage-ppc':
                if (user && user.role === 'ADM') {
                    return <PPCManagement user={user} onBack={() => setCurrentPage('home')} />;
                }
                setCurrentPage('home');
                return null;
            case 'view-reports':
                if (user && user.role === 'ADM') {
                    return <FinancialReport onBack={() => setCurrentPage('home')} />;
                }
                return null;
            default:
                const availableProducts = products.filter(p => p.num_product > 0);

                const filteredAndAvailable = selectedCategory
                    ? availableProducts.filter(p => p.category_id === selectedCategory)
                    : availableProducts;
                return (
                    <HomePage
                        products={filteredAndAvailable} 
                        categories={categories}
                        onProductClick={(p) => { setSelectedProduct(p); setCurrentPage('product-detail'); }}
                        onCategorySelect={handleCategoryClick}
                        activeCategory={selectedCategory} 
                    />
                );
        }
    };

    const handleCategoryClick = (categoryId) => {
        if (selectedCategory === categoryId) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(categoryId);
        }
    };
    const filteredProducts = selectedCategory
        ? products.filter(p => p.category_id === selectedCategory)
        : products;
    const handleUpdateProfile = async () => {
        try {
            const res = await axios.put('http://localhost:5000/api/user/update', {
                userId: user.user_id,
                ...editData
            });
            alert(res.data.message);
            setUser({ ...user, fullName: editData.fullName }); // Cập nhật tên hiển thị trên header
            setIsEditing(false);
        } catch (error) {
            alert("Lỗi cập nhật!");
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        // Lưu token vào localStorage để không bị logout khi F5
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // 2. Hàm gửi tin nhắn tới Gemini (thông qua Backend)
    const handleChat = async () => {
        if (!input.trim()) return;
        if (!user && guestAskCount >= 1) {
            alert("Guest chỉ được hỏi 1 câu. Vui lòng đăng nhập!");
            return;
        }
        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: input,
                userId: user ? user.user_id : null,
                messageCount: guestAskCount,
                role: user ? user.role : 'GUEST'
            });

            const botMsg = { role: 'bot', text: response.data.reply };
            setMessages(prev => [...prev, botMsg]);

            if (!user) setGuestAskCount(prev => prev + 1); 
        } catch (error) {
            if (error.response && error.response.status === 403) {
                const botMsg = { role: 'bot', text: error.response.data.reply };
                setMessages(prev => [...prev, botMsg]);
            }
        }
    };

    return (
        <div className="App">
            <nav className="navbar">
                <div className="nav-left">
                    <div className="logo-icon">🐾</div>
                    <div className="logo-text" onClick={() => setCurrentPage('home')}>Fellua</div>
                </div>
                <div className="nav-links">
                    {user && user.role === 'ADM' && (
                        <>
                            {/* Xóa style={{color: 'red'}} và thay bằng className */}
                            <span className="nav-item admin-btn" onClick={() => setCurrentPage('admin-users')}>
                                ⚙️ Quản lý tài khoản
                            </span>
                            <span className="nav-item ppc-btn" onClick={() => setCurrentPage('manage-ppc')}>
                                📢 Quản lý quảng cáo PPC
                            </span>
                            <span onClick={() => setCurrentPage('view-reports')}>📊 Xem báo cáo</span>
                        </>
                    )}
                
                    {user && (user.role === 'STA' || user.role === 'ADM') && (
                        <>
                            <span className="nav-item" onClick={() => setCurrentPage('manage-products')}>📦 Quản lý kho</span>
                            <span className="nav-item" onClick={() => setCurrentPage('manage-orders')}>📝 Xử lý đơn hàng</span>
                            <span className="nav-item" onClick={() => setCurrentPage('manage-categories')}>📁 Quản lý danh mục</span>
                        </>
                    )}
                {user && (
                <span onClick={() => setCurrentPage('order-history')}>Lịch sử mua hàng</span>
                    )}
                </div>
                <div className="nav-right">
                    {!user ? (
                        <button className="auth-btn login" onClick={() => setCurrentPage('login')}>
                            ➜ Đăng nhập
                        </button>
                    ) : (
                        <button className="auth-btn profile" onClick={() => setCurrentPage('profile')}>
                            👤 {user.fullName}
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section theo mẫu mới */}
            {currentPage === 'home' && (
                <section className="hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Thú cưng của bạn<br />
                            <span className="highlight">Niềm tự hào của chúng tôi</span>
                        </h1>
                        <p className="hero-desc">Chăm sóc toàn diện cho người bạn bốn chân của bạn</p>
                        {currentPPC && (
                            <div className="ppc-banner" onClick={handleBannerClick} style={{ cursor: 'pointer', marginBottom: '20px' }}>
                                <img src={currentPPC.banner_url} alt="Quảng cáo Fellua" style={{ width: '100%', borderRadius: '15px' }} />
                            </div>
                        )}
                    </div>
                    <div className="hero-image-wrapper">
                        <img src="https://res.cloudinary.com/dzipisbon/image/upload/v1767524703/photo-1546377791-2e01b4449bf0_om0fsk.jpg" alt="Pet" />
                    </div>
                </section>
            )}

            {currentPage === 'home' && (
                <>
                    <section className="hero-container">...</section>

                    {activeCampaigns.length > 0 && (
                        <div className="ppc-carousel-wrapper" style={{ margin: '20px 8%', borderRadius: '20px', overflow: 'hidden' }}>
                            <Carousel autoPlay infiniteLoop showThumbs={false} showStatus={false} interval={5000}>
                                {activeCampaigns.map(cp => (
                                    <div key={cp.campaign_id} onClick={() => handleBannerClick(cp)} style={{ cursor: 'pointer' }}>
                                        <img
                                            src={cp.banner_url}
                                            alt={cp.campaign_name}
                                            style={{ height: '350px', objectFit: 'cover' }}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        </div>
                    )}
                </>
            )}

            <main className="main-content">
                {renderPage()}
            </main>

            {/* Nút Chatbot tròn */}
            <button className="chatbot-toggle-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
                {isChatOpen ? '×' : '💬'}
            </button>

            {/* Khung Chatbot Fellua */}
            <div className={`chatbot-window ${isChatOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="header-info">
                        <div className="bot-avatar">🎩</div>
                        <div>
                            <div className="bot-name">Fellua</div>
                            <div className="bot-status">Quản gia cửa hàng</div>
                        </div>
                    </div>
                </div>
                <div className="chat-box">
                    <div className="message bot">
                        Mừng chủ nhân đã về! Tôi là <strong>Fellua</strong> – Quản gia của cửa hàng này. Tôi có thể giúp gì cho chủ nhân hôm nay?
                    </div>
                    {messages.map((m, i) => (
                        <div key={i} className={`message ${m.role}`}>{m.text}</div>
                    ))}
                </div>
                <div className="input-area">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    />
                    <button className="send-btn" onClick={handleChat}>➤</button>
                </div>
            </div>
        </div>
    );
}

export default App;