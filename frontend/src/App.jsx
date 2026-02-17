import { useState, useRef } from 'react'
import './App.css'

const API_URL = 'http://localhost:8000'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getObjectEmoji(name) {
  const map = {
    person: '🧑', car: '🚗', dog: '🐕', cat: '🐱', bus: '🚌',
    truck: '🚛', bicycle: '🚲', motorcycle: '🏍️', bird: '🐦',
    horse: '🐴', chair: '🪑', bottle: '🍾', tv: '📺', laptop: '💻',
    phone: '📱', book: '📖', cup: '☕', clock: '🕐', umbrella: '☂️',
    backpack: '🎒', handbag: '👜', knife: '🔪', fork: '🍴',
    airplane: '✈️', boat: '⛵', train: '🚆', bed: '🛏️',
  }
  return map[name?.toLowerCase()] || '📦'
}

function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)
  const [videoName, setVideoName] = useState('')
  const [canPlay, setCanPlay] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  // === Upload ===
  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setStatusMessage(null)
      setAnalysis(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('video/')) {
      setFile(dropped)
      setStatusMessage(null)
      setAnalysis(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    setStatusMessage({ type: 'loading', text: 'מעלה ומנתח את הסרטון... זה עשוי לקחת כמה רגעים ⏳' })
    setAnalysis(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90 }
        return prev + Math.random() * 15
      })
    }, 500)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/upload-video`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()

      setAnalysis(data.analysis)
      setVideoName(data.filename)
      setCanPlay(false)
      setStatusMessage({ type: 'success', text: '✅ הניתוח הושלם! אפשר לבצע חיפוש במאגר.' })
    } catch (err) {
      clearInterval(progressInterval)
      setStatusMessage({ type: 'error', text: '❌ שגיאה בהעלאת הסרטון. ודא שהשרת פעיל.' })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // === Search ===
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setSearchResults(null)

    try {
      const response = await fetch(`${API_URL}/search?object=${encodeURIComponent(searchQuery.trim())}`)
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (err) {
      setStatusMessage({ type: 'error', text: '❌ שגיאה בחיפוש. ודא שהשרת פעיל.' })
    } finally {
      setSearching(false)
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header-icon">🎬</span>
        <h1>Video Search AI</h1>
      </header>

      <main className="main-content">
        {/* Video Player */}
        {videoName && (
          <section className="upload-section" style={{marginTop: '1rem'}}>
            <h3 style={{color: '#c4b5fd', marginTop: 0}}>נגן וידאו</h3>
            <video
              ref={videoRef}
              width={600}
              controls
              src={`${API_URL}/videos/${encodeURIComponent(videoName)}`}
              onLoadedMetadata={() => setCanPlay(true)}
              onError={() => {
                setCanPlay(false)
                setStatusMessage({ type: 'error', text: '❌ לא ניתן לטעון את הוידאו (מקודד/נתיב). ודא שהשם תקין וקיים.' })
              }}
              style={{maxWidth: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)'}}
            />
          </section>
        )}
        {/* Upload Section */}
        <section className="upload-section">
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <span className="upload-icon">🎥</span>
            <h3>גרור סרטון לכאן או לחץ לבחירה</h3>
            <p>MP4, AVI, MOV — עד 500MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
            />
          </div>

          {file && (
            <div className="file-info">
              <span>🎞️ {file.name}</span>
              <button
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
              >
                ✕
              </button>
            </div>
          )}

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner"></span>
                מנתח...
              </>
            ) : (
              <>🚀 העלה ונתח סרטון</>
            )}
          </button>

          {uploading && (
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">{Math.round(uploadProgress)}% הושלם</div>
            </div>
          )}

          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.type === 'loading' && <span className="spinner"></span>}
              {statusMessage.text}
            </div>
          )}

          {/* Removed analysis list per request: keep only search */}
        </section>

        {/* Divider */}
        <div className="divider">
          <span>חיפוש במאגר</span>
        </div>

        {/* Search Section */}
        <section className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder='חפש אובייקט... לדוגמה: "person", "car", "dog"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
            >
              {searching ? <span className="spinner"></span> : '🔎'}
              חפש
            </button>
          </div>
        </section>

        {/* Search Results */}
        {searchResults !== null && (
          searchResults.length > 0 ? (
            <section className="results-section">
              <div className="results-header">
                <h2>תוצאות חיפוש: "{searchQuery}"</h2>
                <span className="results-count">{searchResults.length} תוצאות</span>
              </div>
              <div className="results-grid">
                {searchResults.map((result, i) => (
                  <div className="result-card" key={i}>
                    <div className="object-name">
                      <span className="emoji">{getObjectEmoji(result.object)}</span>
                      {result.object}
                    </div>
                    <div className="timestamp">
                      🕐 זמן:
                      <span className="time-value">{formatTime(result.time)}</span>
                    </div>
                    {(videoRef.current && canPlay) ? (
                      <div style={{marginTop: '0.5rem'}}>
                        <button
                          className="search-btn"
                          onClick={() => {
                            videoRef.current.currentTime = result.time
                            videoRef.current.play()
                          }}
                        >
                          קפוץ לזמן
                        </button>
                      </div>
                    ) : (
                      <div style={{marginTop: '0.5rem'}}>
                        <button className="search-btn" disabled>
                          קפוץ לזמן (נגן נטען)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="no-results">
              <div className="icon">🔍</div>
              <h3>לא נמצאו תוצאות</h3>
              <p>נסה לחפש אובייקט אחר, או העלה סרטון קודם</p>
            </div>
          )
        )}
      </main>
    </div>
  )
}

export default App
