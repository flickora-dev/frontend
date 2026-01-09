import axios from './axios';

export const moviesAPI = {
  getMovies: (params = {}) =>
    axios.get('/movies/', { params }),

  getMovie: (id) =>
    axios.get(`/movies/${id}/`),

  getMovieSections: (id) =>
    axios.get(`/movies/${id}/sections/`),

  getMovieCast: (id) =>
    axios.get(`/movies/${id}/cast/`),

  getSimilarMovies: (id) =>
    axios.get(`/movies/${id}/similar/`),

  markAsViewed: (id) =>
    axios.post(`/movies/${id}/view/`),

  getTrending: () =>
    axios.get('/movies/trending/'),

  getRecentlyViewed: () =>
    axios.get('/movies/recently_viewed/'),

  searchMovies: (query, params = {}) =>
    axios.get('/movies/', { params: { search: query, ...params } }),

  getGenres: () =>
    axios.get('/genres/'),

  // Favorites endpoints
  getFavorites: () =>
    axios.get('/movies/favorites/'),

  addToFavorites: (id) =>
    axios.post(`/movies/${id}/favorite/`),

  removeFromFavorites: (id) =>
    axios.delete(`/movies/${id}/unfavorite/`),

  isFavorited: (id) =>
    axios.get(`/movies/${id}/is_favorited/`),
};