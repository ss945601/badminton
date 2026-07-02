import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage({ token }) {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">歡迎來到 Latticework 羽球社 🏸</h2>
          <p className="hero-description">
            加入我們，一起享受羽球帶來的樂趣！管理你的打球時間，認識更多球友，隨時掌握社團動態。
          </p>
        </div>
      </section>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>會員總覽</h3>
          <p>查看所有會員資訊，了解每天可打球的夥伴，輕鬆組隊。</p>
          <Link to="/members" className="feature-link">查看會員 →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>留言板</h3>
          <p>與球友交流，分享打球心得，約球更方便。</p>
          <Link to="/messages" className="feature-link">前往留言板 →</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>個人資料</h3>
          <p>管理你的打球時間，更新個人資訊，讓大家更了解你。</p>
          {token ? (
            <Link to="/profile" className="feature-link">管理資料 →</Link>
          ) : (
            <Link to="/register" className="feature-link">立即註冊 →</Link>
          )}
        </div>
      </div>

      {!token && (
        <section className="cta-section">
          <h3>還不是會員嗎？</h3>
          <p>立即註冊，開始你的羽球之旅！</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn-primary">立即註冊</Link>
            <Link to="/login" className="btn-secondary">會員登入</Link>
          </div>
        </section>
      )}
    </div>
  )
}
