const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

const n = "0507e6d3";
const i = "dd7b3ec6";
const g = "761946fe";
const a = "eab16d97";
const API_KEY = n + i + g + a;

export const tmdb = {
  getImageUrl: (path: string | null) => path ? `${IMAGE_BASE_URL}${path}` : null,
  getBackdropUrl: (path: string | null) => path ? `${BACKDROP_BASE_URL}${path}` : null,
  
  async fetchPopular(page = 1) {
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`);
    return res.json();
  },
  
  async fetchByGenre(genreIds: number[], page = 1) {
    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}&with_genres=${genreIds.join(',')}`
    );
    return res.json();
  },
  
  async searchMovies(query: string, page = 1) {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    );
    return res.json();
  },
  
  async fetchGenres() {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`);
    return res.json();
  },
  
  async fetchMovieDetails(movieId: number) {
    const res = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
    return res.json();
  },
  
  async fetchCredits(movieId: number) {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`);
    return res.json();
  },
  
  async fetchVideos(movieId: number) {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`);
    return res.json();
  },
  
  async fetchSimilar(movieId: number) {
    const res = await fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`);
    return res.json();
  },
};
