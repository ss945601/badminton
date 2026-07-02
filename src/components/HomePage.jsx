import { Link } from 'react-router-dom'
import homeImage from '../assets/home_img.png'
import './HomePage.css'

export default function HomePage({ token }) {
  return (
    <div className="home-page">


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
            <section className="hero-section">
        <div className="hero-content">
          <a href="https://www.youtube.com/@%E5%8F%B0%E5%85%83%E8%8F%9C%E9%9B%9E%E5%9C%98" target="_blank" rel="noopener noreferrer">
            <img src={homeImage} alt="Latticework 羽球社活動照片" className="hero-image" />
          </a>
          <h2 className="hero-title">歡迎來到 Latticework 羽球社 🏸</h2>
        </div>
      </section>
    </div>
  )
}
