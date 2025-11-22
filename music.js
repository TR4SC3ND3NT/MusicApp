// --- DOM ELEMENTS ---
const searchInput = document.querySelector('.search-bar');
const resultsContainer = document.getElementById('results-container');
const popularContainer = document.getElementById('popular-container');

// Panels
const libraryPanel = document.getElementById('library-panel');
const playerPanel = document.getElementById('player-panel');
const backBtn = document.getElementById('back-btn');

// Audio & Controls
const audio = new Audio();
const playButton = document.getElementById('play-pause-btn');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackTitle = document.querySelector('.track-title');
const trackArtist = document.querySelector('.track-artist');
const trackAlbum = document.querySelector('.track-album');
const trackCover = document.getElementById('track-cover');
const visualizer = document.getElementById('visualizer');
const albumWrapper = document.querySelector('.album-art-wrapper');

// --- VARIABLES ---
let isPlaying = false;
let currentTrackIndex = 0;
let currentPlaylist = [];

// --- INITIAL LOADING ---
window.addEventListener('DOMContentLoaded', () => {
    fetchSongs('The Weeknd', 'popular');
    // Убираем плеер на старте для мобильных
    if(window.innerWidth < 900) {
        playerPanel.classList.add('player-hidden');
    }
});

// --- API & SEARCH ---
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
        // Debounce could be added here for performance
        fetchSongs(query, 'search');
    }
});

async function fetchSongs(term, type) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (type === 'popular') {
            renderPopular(data.results);
        } else {
            renderResults(data.results);
        }
    } catch (err) {
        console.error(err);
    }
}

// --- RENDERING ---
function renderPopular(songs) {
    popularContainer.innerHTML = '';
    songs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'popular-card';
        const img = song.artworkUrl100.replace('100x100', '400x400');
        
        card.innerHTML = `
            <img src="${img}" loading="lazy" alt="${song.trackName}">
            <div class="card-overlay">
                <div style="font-size:13px; font-weight:600; color:white;">${truncate(song.trackName, 20)}</div>
                <div style="font-size:11px; color:#ccc;">${truncate(song.artistName, 20)}</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            currentPlaylist = songs;
            loadTrack(index);
        });
        popularContainer.appendChild(card);
    });
}

function renderResults(songs) {
    resultsContainer.innerHTML = '';
    if(!songs.length) {
        resultsContainer.innerHTML = '<div class="empty-state">Nothing found</div>';
        return;
    }

    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        
        item.innerHTML = `
            <img src="${song.artworkUrl100}" alt="art">
            <div class="track-info">
                <h4>${song.trackName}</h4>
                <p>${song.artistName} • ${truncate(song.collectionName, 30)}</p>
            </div>
        `;

        item.addEventListener('click', () => {
            // Remove active class from others
            document.querySelectorAll('.track-item').forEach(el => el.classList.remove('active-track'));
            item.classList.add('active-track');
            
            currentPlaylist = songs;
            loadTrack(index);
        });

        resultsContainer.appendChild(item);
    });
}

// --- PLAYER CORE ---
function loadTrack(index) {
    const song = currentPlaylist[index];
    if (!song) return;

    currentTrackIndex = index;

    // Update UI
    trackTitle.textContent = song.trackName;
    trackArtist.textContent = song.artistName;
    trackAlbum.textContent = song.collectionName || 'Single';
    trackCover.src = song.artworkUrl100.replace('100x100', '600x600');

    // Update Audio
    audio.src = song.previewUrl;
    audio.load();
    
    // Open Player View
    openPlayerMobile();
    
    playAudio();
}

function playAudio() {
    audio.play().then(() => {
        isPlaying = true;
        playButton.innerHTML = '⏸'; // Pause icon
        albumWrapper.classList.add('playing');
        visualizer.classList.add('playing');
    }).catch(e => console.warn(e));
}

function pauseAudio() {
    audio.pause();
    isPlaying = false;
    playButton.innerHTML = '▶'; // Play icon
    albumWrapper.classList.remove('playing');
    visualizer.classList.remove('playing');
}

playButton.addEventListener('click', () => isPlaying ? pauseAudio() : playAudio());

// Navigation Buttons
nextButton.addEventListener('click', () => {
    if (currentPlaylist.length) {
        loadTrack((currentTrackIndex + 1) % currentPlaylist.length);
    }
});

prevButton.addEventListener('click', () => {
    if (currentPlaylist.length) {
        loadTrack((currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length);
    }
});

// Progress Bar
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.value = percent;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }
});

progressBar.addEventListener('input', (e) => {
    if (audio.duration) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
    }
});

audio.addEventListener('ended', () => nextButton.click());

// --- RESPONSIVE NAVIGATION ---
// Эта функция управляет переходами только на мобильных устройствах
function openPlayerMobile() {
    if (window.innerWidth >= 900) return; // На десктопе ничего не делаем

    libraryPanel.classList.add('library-hidden');
    libraryPanel.classList.remove('library-active');
    
    playerPanel.classList.remove('player-hidden');
    playerPanel.classList.add('player-active');
}

backBtn.addEventListener('click', () => {
    playerPanel.classList.add('player-hidden');
    playerPanel.classList.remove('player-active');

    libraryPanel.classList.remove('library-hidden');
    libraryPanel.classList.add('library-active');
});

// Handle window resize (reset classes if switching from mobile to desktop)
window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) {
        // Clean up mobile classes to avoid conflicts with grid layout
        libraryPanel.classList.remove('library-hidden', 'library-active');
        playerPanel.classList.remove('player-hidden', 'player-active');
    } else {
        // Restore defaults for mobile
        libraryPanel.classList.add('library-active');
        playerPanel.classList.add('player-hidden');
    }
});

// --- UTILS ---
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0'+sec : sec}`;
}

function truncate(str, n) {
    return str.length > n ? str.substr(0, n-1) + '...' : str;
}