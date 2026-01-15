// src/components/FinancialReport.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';
function FinancialReport({ onBack }) {
    const [reportData, setReportData] = useState(null);
    const currentYear = new Date().getFullYear();
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        month: new Date().getMonth() + 1,
        year: currentYear
    });
    const fetchReport = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/admin/reports/${dateFilter.month}/${dateFilter.year}`);
            setReportData(res.data);
        } catch (err) { console.error("Lỗi tải báo cáo"); }
    };

    useEffect(() => { fetchReport(); }, [dateFilter]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`BAO CAO TAI CHINH FELLUA - THANG ${dateFilter.month}/${dateFilter.year}`, 20, 20);
        autoTable(doc, {
            head: [['Chi tieu', 'Gia tri']],
            body: [
                ['Tong doanh thu', `${reportData?.totalRevenue.toLocaleString()}d`],
                ['Tong don hang', `${reportData?.totalOrders} don`],
                ['Thoi gian', `${dateFilter.month}/${dateFilter.year}`]
            ],
            startY: 25,
            styles: { font: "helvetica" }
        });
        doc.save(`Bao_cao_Fellua_${dateFilter.month}_${dateFilter.year}.pdf`);
    };

    const handleGetAIAnalysis = async () => {
        setLoadingAI(true);
        try {
            const res = await axios.get('http://localhost:5000/api/admin/ai-report');
            setAiAnalysis(res.data.analysis);
        } catch (err) {
            alert("Không thể kết nối với trí tuệ nhân tạo Fellua lúc này.");
        } finally {
            setLoadingAI(false);
        }
    };

    if (!reportData) return <div className="loading">Đang tổng hợp dữ liệu...</div>;

    return (
        <div className="admin-management-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <button onClick={onBack} className="back-btn">← Quay lại</button>
                <div>
                    <select value={dateFilter.year} onChange={e => setDateFilter({...dateFilter, year: e.target.value})}>
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                        <option key={y} value={y}>Năm {y}</option>
                    ))}
                </select>
                    <select value={dateFilter.month} onChange={e => setDateFilter({ ...dateFilter, month: e.target.value })}>
                        {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                    </select>
                    <button onClick={exportPDF} style={{ marginLeft: '10px', background: '#d35400', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                        📥 EXPORT AS PDF
                    </button>
                </div>
            </div>

            <h2>Báo cáo Tài chính & Chiến lược AI</h2>

            <div className="ai-trigger-section" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '30px',
                borderRadius: '20px',
                color: 'white',
                marginBottom: '30px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0 }}>🤖 Trợ lý Phân tích Chiến lược Fellua</h3>
                        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>AI sẽ phân tích Doanh thu, Quảng cáo và Feedback khách hàng để đưa ra lời khuyên.</p>
                    </div>
                    <button
                        onClick={handleGetAIAnalysis}
                        disabled={loadingAI}
                        style={{
                            background: '#f39c12',
                            color: 'white',
                            border: 'none',
                            padding: '12px 25px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {loadingAI ? 'Đang phân tích...' : '✨ Chạy phân tích AI'}
                    </button>
                </div>

                {aiAnalysis && (
                    <div className="ai-result-box" style={{
                        marginTop: '25px',
                        background: 'rgba(255,255,255,0.95)', 
                        padding: '25px',
                        borderRadius: '15px',
                        lineHeight: '1.8',
                        color: '#2c3e50', 
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)',
                        textAlign: 'left'
                    }}>
                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
                <div className="report-card" style={{ background: '#fff5e6', padding: '20px', borderRadius: '15px' }}>
                    <h4>Tổng doanh thu tháng</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d35400' }}>{reportData?.totalRevenue.toLocaleString()}đ</p>
                </div>
                <div className="report-card" style={{ background: '#e6f7ff', padding: '20px', borderRadius: '15px' }}>
                    <h4>Tổng đơn hàng</h4>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{reportData?.totalOrders} đơn</p>
                </div>
            </div>

            <div style={{ height: '300px', background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <h4>Biểu đồ doanh thu theo ngày</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData?.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" label={{ value: 'Ngày', position: 'insideBottom', offset: -5 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="dailyRevenue" fill="#d35400" radius={[5, 5, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default FinancialReport; 
