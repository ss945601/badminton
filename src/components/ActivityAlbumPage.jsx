import './ActivityAlbumPage.css'

export default function ActivityAlbumPage() {
  return (
    <section className="activity-album-page">
      <div className="activity-album-header">
        <h2>活動相簿</h2>
        <p>查看社團近期活動照片與回憶。</p>
      </div>

      <div className="activity-album-frame">
        <iframe
          src="https://filedn.eu/lSrWKJtJXIvFW5W9d9fLRSy/badminton/"
          title="活動相簿"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </section>
  )
}
