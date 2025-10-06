import { useState, useEffect } from "react";
import { Movie, Genre, TMDbResponse } from "@/types/movie";
import { tmdb } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { MovieModal } from "@/components/MovieModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Star, ChevronLeft, ChevronRight, Github } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Index = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGenres();
    loadFavorites();
    loadMovies();
  }, []);

  useEffect(() => {
    if (!showFavoritesOnly) {
      loadMovies();
    }
  }, [currentPage, selectedGenres]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      if (!showFavoritesOnly) {
        loadMovies();
      }
    }, 500);
    
    setSearchTimeout(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery]);

  const loadGenres = async () => {
    try {
      const data = await tmdb.fetchGenres();
      setGenres(data.genres || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem('movieFavorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  const saveFavorites = (newFavorites: Movie[]) => {
    setFavorites(newFavorites);
    localStorage.setItem('movieFavorites', JSON.stringify(newFavorites));
  };

  const loadMovies = async () => {
    setLoading(true);
    try {
      let data: TMDbResponse;
      
      if (searchQuery.trim()) {
        data = await tmdb.searchMovies(searchQuery, currentPage);
      } else if (selectedGenres.length > 0) {
        data = await tmdb.fetchByGenre(selectedGenres, currentPage);
      } else {
        data = await tmdb.fetchPopular(currentPage);
      }
      
      setMovies(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500)); // TMDb limits to 500 pages
      setTotalResults(data.total_results || 0);
    } catch (error) {
      console.error('Error loading movies:', error);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      }
      return [...prev, genreId];
    });
    setCurrentPage(1);
  };

  const toggleFavorite = (movie: Movie) => {
    const isFavorite = favorites.some(m => m.id === movie.id);
    if (isFavorite) {
      saveFavorites(favorites.filter(m => m.id !== movie.id));
      toast.success('Removed from favorites');
    } else {
      saveFavorites([...favorites, movie]);
      toast.success('Added to favorites');
    }
  };

  const displayedMovies = showFavoritesOnly ? favorites : movies;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Robi movies logo" className="w-10 h-10 rounded-lg object-cover shadow-glow" />
              <h1 className="text-2xl font-bold text-foreground">Robi movies</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.open('https://github.com/robikas19', '_blank')}
                variant="outline"
                size="icon"
                className="gap-2"
              >
                <Github className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  setCurrentPage(1);
                }}
                variant={showFavoritesOnly ? "default" : "outline"}
                className="gap-2"
              >
                <Star className={showFavoritesOnly ? "fill-current" : ""} />
                Favorites ({favorites.length})
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={showFavoritesOnly}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={showFavoritesOnly}>
                  <Filter className="w-4 h-4" />
                  Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
                {genres.map(genre => (
                  <DropdownMenuCheckboxItem
                    key={genre.id}
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={() => toggleGenre(genre.id)}
                  >
                    {genre.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {!showFavoritesOnly && totalResults > 0 && (
            <div className="mt-3 text-sm text-muted-foreground">
              {totalResults.toLocaleString()} movies found
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading movies...</p>
            </div>
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎬</div>
              <h3 className="text-xl font-semibold text-foreground">
                {showFavoritesOnly ? 'No favorites yet' : 'No movies found'}
              </h3>
              <p className="text-muted-foreground">
                {showFavoritesOnly 
                  ? 'Start adding movies to your favorites!' 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedMovies.map(movie => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  genres={genres}
                  isFavorite={favorites.some(m => m.id === movie.id)}
                  onClick={() => {
                    setSelectedMovie(movie);
                    setShowModal(true);
                  }}
                />
              ))}
            </div>
            
            {!showFavoritesOnly && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Movie Modal */}
      <MovieModal
        movie={selectedMovie}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedMovie(null);
        }}
        isFavorite={selectedMovie ? favorites.some(m => m.id === selectedMovie.id) : false}
        onToggleFavorite={() => selectedMovie && toggleFavorite(selectedMovie)}
        genres={genres}
      />
    </div>
  );
};

export default Index;
