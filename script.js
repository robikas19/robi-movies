
const n = "0507e6d3";
const i = "dd7b3ec6";
const g = "761946fe";
const a = "eab16d97";
const API_KEY = n + i + g + a;

async function fetchMovies(query = "popular") {
  const PROXY_URL = "https://api.allorigins.win/get?url=";
  const TMDB_URL = encodeURIComponent(
    `https://api.themoviedb.org/3/movie/${query}?api_key=${API_KEY}`
  );
  
  const res = await fetch(`${PROXY_URL}${TMDB_URL}`);
  const data = await res.json();
  return JSON.parse(data.contents);
}

// Usage
fetchMovies("popular")
  .then(data => displayMovies(data.results));
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const YOUTUBE_URL = 'https://www.youtube.com/embed/';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const toggleThemeBtn = document.getElementById('toggleTheme');
const genreFilterBtn = document.getElementById('genreFilterBtn');
const genreDropdown = document.getElementById('genreDropdown');
const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const statsBar = document.getElementById('statsBar');
const totalResults = document.getElementById('totalResults');
const searchTime = document.getElementById('searchTime');
const yearRange = document.getElementById('yearRange');
const moviesGrid = document.getElementById('moviesGrid');
const loading = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const popularLink = document.getElementById('popularLink');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const totalPages = document.getElementById('totalPages');
const modal = document.getElementById('modal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalTitle = document.getElementById('modalTitle');
const modalYear = document.getElementById('modalYear');
const modalRuntime = document.getElementById('modalRuntime');
const modalCertification = document.getElementById('modalCertification');
const modalOverview = document.getElementById('modalOverview');
const modalPoster = document.getElementById('modalPoster');
const modalRating = document.getElementById('modalRating');
const modalGenres = document.getElementById('modalGenres');
const modalReleaseDate = document.getElementById('modalReleaseDate');
const modalDirectors = document.getElementById('modalDirectors');
const castContainer = document.getElementById('castContainer');
const similarContainer = document.getElementById('similarContainer');
const favToggleBtn = document.getElementById('favToggleBtn');
const watchTrailerBtn = document.getElementById('watchTrailerBtn');
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutModalClose = document.getElementById('aboutModalClose');
const privacyBtn = document.getElementById('privacyBtn');
const trailerContainer = document.getElementById('trailerContainer');
const trailerIframe = document.getElementById('trailerIframe');
const closeTrailerBtn = document.getElementById('closeTrailerBtn');
const viewOnTMDb = document.getElementById('viewOnTMDb');
// App State
let currentPage = 1;
let currentQuery = '';
let currentTotalPages = 1;
let currentTotalResults = 0;
let currentMovie = null;
let currentGenres = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let genres = [];
let searchStartTime = 0;
let isShowingFavorites = false;
let searchDebounceTimer;

// Initialize the app
async function init() {
  fetchGenres();
  fetchMovies();
  setupEventListeners();
  updateThemeIcon();
}

// Fetch movie genres from TMDb
async function fetchGenres() {
  try {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    const data = await response.json();
    genres = data.genres;
    populateGenreDropdown();
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

// Populate genre dropdown
function populateGenreDropdown() {
  genreDropdown.innerHTML = '';
  
  // Add "All Genres" option
  const allItem = document.createElement('div');
  allItem.className = 'dropdown-item';
  allItem.innerHTML = `
    <span>All Genres</span>
    <i class="fas fa-check ${currentGenres.length === 0 ? '' : 'hidden'}"></i>
  `;
  allItem.addEventListener('click', () => {
    currentGenres = [];
    fetchMovies(currentQuery, 1);
    updateGenreDropdown();
  });
  genreDropdown.appendChild(allItem);
  
  // Add all genres
  genres.forEach(genre => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
      <span>${genre.name}</span>
      <i class="fas fa-check ${currentGenres.includes(genre.id) ? '' : 'hidden'}"></i>
    `;
    item.addEventListener('click', () => {
      toggleGenre(genre.id);
      fetchMovies(currentQuery, 1);
      updateGenreDropdown();
    });
    genreDropdown.appendChild(item);
  });
}

// Toggle genre selection
function toggleGenre(genreId) {
  const index = currentGenres.indexOf(genreId);
  if (index >= 0) {
    currentGenres.splice(index, 1);
  } else {
    currentGenres.push(genreId);
  }
}

// Update genre dropdown checkmarks
function updateGenreDropdown() {
  const items = genreDropdown.querySelectorAll('.dropdown-item');
  items.forEach((item, index) => {
    if (index === 0) {
      // "All Genres" item
      const icon = item.querySelector('i');
      icon.classList.toggle('hidden', currentGenres.length !== 0);
    } else {
      const genre = genres[index - 1];
      const icon = item.querySelector('i');
      icon.classList.toggle('hidden', !currentGenres.includes(genre.id));
    }
  });
}

// Fetch movies from TMDb
async function fetchMovies(query = '', page = 1) {
  isShowingFavorites = false;
  loading.style.display = 'flex';
  noResults.style.display = 'none';
  moviesGrid.innerHTML = '';
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  pageInfo.textContent = '';
  totalPages.textContent = '';
  statsBar.style.display = 'none';
  
  searchStartTime = performance.now();
  
  let url;
  if (query.trim() === '') {
    if (currentGenres.length > 0) {
      url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}&with_genres=${currentGenres.join(',')}`;
    } else {
      url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`;
    }
  } else {
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
    if (currentGenres.length > 0) {
      url += `&with_genres=${currentGenres.join(',')}`;
    }
  }
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const searchEndTime = performance.now();
    const searchDuration = ((searchEndTime - searchStartTime) / 1000).toFixed(2);
    
    if (data.results && data.results.length > 0) {
      displayMovies(data.results);
      currentTotalPages = data.total_pages;
      currentTotalResults = data.total_results;
      currentPage = data.page;
      currentQuery = query;
      
      // Update pagination
      pageInfo.textContent = `Page ${currentPage}`;
      totalPages.textContent = `of ${currentTotalPages}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= currentTotalPages;
      
      // Update stats bar
      totalResults.textContent = `${data.total_results.toLocaleString()} ${data.total_results === 1 ? 'movie' : 'movies'} found`;
      searchTime.textContent = `${searchDuration}s`;
      
      // Calculate year range
      const years = data.results.map(movie => {
        return movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
      }).filter(year => year !== null);
      
      if (years.length > 0) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        yearRange.textContent = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
      } else {
        yearRange.textContent = 'All years';
      }
      
      statsBar.style.display = 'flex';
    } else {
      noResults.style.display = 'flex';
    }
  } catch (error) {
    noResults.textContent = 'Error loading movies. Please try again later.';
    noResults.style.display = 'flex';
    console.error('Error fetching movies:', error);
  } finally {
    loading.style.display = 'none';
  }
}

// Display movies in grid
function displayMovies(movies) {
  moviesGrid.innerHTML = '';
  
  movies.forEach(movie => {
    const movieCard = createMovieCard(movie);
    moviesGrid.appendChild(movieCard);
  });
}

// Create movie card element
function createMovieCard(movie) {
  const { title, poster_path, vote_average, release_date, overview, id, genre_ids } = movie;
  
  const releaseYear = release_date ? release_date.split('-')[0] : 'N/A';
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
  const ratingColor = getRatingColor(vote_average);
  const isFavorite = favorites.some(m => m.id === id);
  
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="movie-poster">
      ${poster_path ? 
        `<img src="${IMAGE_BASE_URL}${poster_path}" alt="${title}" loading="lazy">` : 
        `<i class="fas fa-film"></i>`
      }
      <div class="rating-badge ${ratingColor}">${rating}</div>
      ${isFavorite ? `<div class="favorite-badge"><i class="fas fa-star"></i></div>` : ''}
    </div>
    <div class="movie-info">
      <h3 class="movie-title" title="${title}">${title}</h3>
      <p class="movie-year">${releaseYear}</p>
      <div class="movie-genres">
        ${genre_ids.slice(0, 3).map(id => {
          const genre = genres.find(g => g.id === id);
          return genre ? `<span class="genre-tag">${genre.name}</span>` : '';
        }).join('')}
      </div>
      <p class="movie-overview">${overview || 'No description available.'}</p>
      <div class="movie-footer">
        <span>ID: ${id}</span>
        <a class="more-info">More info</a>
      </div>
    </div>
  `;
  
  card.addEventListener('click', () => showMovieDetails(movie));
  return card;
}
// Fetch GitHub star count
async function fetchGitHubStars() {
  try {
    const response = await fetch('https://api.github.com/repos/robikas19/robi-movies');
    const data = await response.json();
    const starCount = data.stargazers_count;
    document.querySelector('.star-count').textContent = starCount.toLocaleString();
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
  }
}

// Call the function when the page loads
window.addEventListener('load', fetchGitHubStars);
// Update the showMovieDetails function
async function showMovieDetails(movie) {
  currentMovie = movie;
  modalTitle.textContent = movie.title;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  trailerContainer.classList.add('hidden');

  // Clear previous content
  modalGenres.innerHTML = '';
  castContainer.innerHTML = '';
  similarContainer.innerHTML = '';

  // Set poster image
  if (movie.poster_path) {
    modalPoster.innerHTML = `<img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" loading="lazy">`;
  } else {
    modalPoster.innerHTML = '<i class="fas fa-film"></i>';
  }

  // Set TMDb link
  viewOnTMDb.onclick = () => {
    window.open(`https://www.themoviedb.org/movie/${movie.id}`, '_blank');
  };

  // Set rating
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const ratingColor = getRatingColor(movie.vote_average);
  modalRating.textContent = rating;
  modalRating.className = `rating-circle ${ratingColor}`;
  updateFavButton();

  // Fetch additional details
  try {
    const [detailsRes, creditsRes, videosRes, similarRes] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`),
      fetch(`${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}&language=en-US&page=1`)
    ]);

    const details = await detailsRes.json();
    const credits = await creditsRes.json();
    const videos = await videosRes.json();
    const similar = await similarRes.json();

    // Update overview
    modalOverview.textContent = details.overview || 'No description available.';

    // Update release date
    modalReleaseDate.textContent = details.release_date ? 
      new Date(details.release_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'N/A';

    // Update genres
    if (details.genres && details.genres.length > 0) {
      details.genres.forEach(genre => {
        const genreEl = document.createElement('span');
        genreEl.className = 'genre-tag-large';
        genreEl.innerHTML = `<i class="fas fa-tag"></i> ${genre.name}`;
        modalGenres.appendChild(genreEl);
      });
    }

    // Update directors
    const directors = credits.crew.filter(c => c.job === 'Director');
    if (directors.length > 0) {
      modalDirectors.textContent = directors.map(d => d.name).join(', ');
    } else {
      modalDirectors.textContent = 'Unknown';
    }

    // Update runtime
    if (details.runtime) {
      const hours = Math.floor(details.runtime / 60);
      const minutes = details.runtime % 60;
      document.getElementById('runtimeText').textContent = `${hours}h ${minutes}m`;
    } else {
      document.getElementById('runtimeText').textContent = 'N/A';
    }

    // Certification
    if (details.release_dates && details.release_dates.results) {
      const usRelease = details.release_dates.results.find(r => r.iso_3166_1 === 'US');
      if (usRelease && usRelease.release_dates.length > 0) {
        modalCertification.textContent = usRelease.release_dates[0].certification || 'NR';
      } else {
        modalCertification.textContent = 'NR';
      }
    } else {
      modalCertification.textContent = 'NR';
    }

    // Cast
    if (credits.cast && credits.cast.length > 0) {
      const topCast = credits.cast.slice(0, 8);
      topCast.forEach(person => {
        const castItem = document.createElement('div');
        castItem.className = 'cast-member';
        castItem.innerHTML = `
          <div class="cast-photo">
            ${person.profile_path ? 
              `<img src="${IMAGE_BASE_URL}${person.profile_path}" alt="${person.name}" loading="lazy">` : 
              `<i class="fas fa-user"></i>`
            }
          </div>
          <p class="cast-name">${person.name}</p>
          <p class="cast-character">${person.character || 'Unknown'}</p>
        `;
        castContainer.appendChild(castItem);
      });
    }

    // Similar movies
    if (similar.results && similar.results.length > 0) {
      const similarMovies = similar.results.slice(0, 4);
      similarMovies.forEach(movie => {
        const similarItem = document.createElement('div');
        similarItem.className = 'similar-movie';
        similarItem.innerHTML = `
          <div class="similar-poster">
            ${movie.poster_path ? 
              `<img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}" loading="lazy">` : 
              `<i class="fas fa-film"></i>`
            }
          </div>
          <p class="similar-title">${movie.title}</p>
        `;
        similarItem.addEventListener('click', () => showMovieDetails(movie));
        similarContainer.appendChild(similarItem);
      });
    }

    // Trailer functionality
    watchTrailerBtn.onclick = () => {
      const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) {
        trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
        trailerContainer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      } else {
        alert('No trailer available for this movie.');
      }
    };

  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
}

// Add to setupEventListeners
closeTrailerBtn.addEventListener('click', () => {
  trailerContainer.classList.add('hidden');
  trailerIframe.src = '';
  document.body.style.overflow = 'auto';
});

// Close trailer when clicking outside
trailerContainer.addEventListener('click', (e) => {
  if (e.target === trailerContainer) {
    trailerContainer.classList.add('hidden');
    trailerIframe.src = '';
    document.body.style.overflow = 'auto';
  }
});

// Get color based on rating
function getRatingColor(rating) {
  if (!rating) return 'rating-none';
  if (rating >= 8) return 'rating-high';
  if (rating >= 6) return 'rating-medium';
  if (rating >= 4) return 'rating-low';
  return 'rating-none';
}

// Update favorite button state
function updateFavButton() {
  if (!currentMovie) return;
  const isFav = favorites.some(m => m.id === currentMovie.id);
  favToggleBtn.innerHTML = isFav ? 
    '<i class="fas fa-star"></i> Remove from Favorites' : 
    '<i class="far fa-star"></i> Add to Favorites';
}

// Toggle favorite status
function toggleFavorite() {
  if (!currentMovie) return;
  const index = favorites.findIndex(m => m.id === currentMovie.id);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(currentMovie);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavButton();
  
  // If showing favorites, update the view
  if (isShowingFavorites) {
    showFavorites();
  }
}

// Show favorite movies
function showFavorites() {
  isShowingFavorites = true;
  loading.style.display = 'none';
  noResults.style.display = 'none';
  moviesGrid.innerHTML = '';
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  pageInfo.textContent = '';
  totalPages.textContent = '';
  
  if (favorites.length === 0) {
    noResults.textContent = 'You have no favorite movies saved.';
    noResults.style.display = 'flex';
  } else {
    displayMovies(favorites);
    pageInfo.textContent = 'Your Favorites';
    totalResults.textContent = `${favorites.length} ${favorites.length === 1 ? 'movie' : 'movies'} found`;
    statsBar.style.display = 'flex';
  }
}

// Theme handling
function setTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.dataset.theme = 'light';
  } else {
    document.body.classList.remove('light-mode');
    document.body.dataset.theme = 'dark';
  }
  updateThemeIcon();
  localStorage.setItem('theme', theme);
}

// Update theme toggle icon
function updateThemeIcon() {
  const icon = toggleThemeBtn.querySelector('i');
  if (document.body.dataset.theme === 'dark') {
    icon.classList.replace('fa-sun', 'fa-moon');
  } else {
    icon.classList.replace('fa-moon', 'fa-sun');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  toggleThemeBtn.addEventListener('click', () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });
  
  // Search input with debounce
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      searchDebounceTimer = setTimeout(() => {
        fetchMovies(query, 1);
      }, 500);
    } else if (query.length === 0) {
      fetchMovies('', 1);
    }
  });
  
  // Clear search
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    fetchMovies('', 1);
    searchSuggestions.style.display = 'none';
  });
  
  // Genre filter dropdown
  genreFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    genreDropdown.style.display = genreDropdown.style.display === 'block' ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    genreDropdown.style.display = 'none';
  });
  
  // Pagination
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      fetchMovies(currentQuery, currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentPage < currentTotalPages) {
      fetchMovies(currentQuery, currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  
  // Favorites
  favToggleBtn.addEventListener('click', toggleFavorite);
  showFavoritesBtn.addEventListener('click', showFavorites);
  
  // Modal
  modalCloseBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
  
  // Popular link in no results
  popularLink.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    fetchMovies('', 1);
  });
  
  // About modal
  aboutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
  
  aboutModalClose.addEventListener('click', () => {
    aboutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Privacy button
  privacyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Privacy policy: We store your favorites locally in your browser and do not collect any personal data.');
  });
}

// Initialize theme from localStorage or default dark
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

// Initialize the app
init();
