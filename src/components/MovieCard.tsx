import { Movie, Genre } from "@/types/movie";
import { tmdb } from "@/lib/tmdb";
import { Star } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  genres: Genre[];
  isFavorite: boolean;
  onClick: () => void;
}

export const MovieCard = ({ movie, genres, isFavorite, onClick }: MovieCardProps) => {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  
  const getRatingColor = (vote: number) => {
    if (vote >= 8) return 'bg-rating-high';
    if (vote >= 6) return 'bg-rating-medium';
    if (vote >= 4) return 'bg-rating-low';
    return 'bg-muted';
  };
  
  const movieGenres = movie.genre_ids
    .map(id => genres.find(g => g.id === id))
    .filter(Boolean)
    .slice(0, 3);
  
  return (
    <div
      onClick={onClick}
      className="group relative glass rounded-lg overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
        {movie.poster_path ? (
          <img
            src={tmdb.getImageUrl(movie.poster_path)!}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-6xl">🎬</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <div className={`${getRatingColor(movie.vote_average)} text-foreground px-2 py-1 rounded-md text-sm font-semibold shadow-lg`}>
            {rating}
          </div>
          {isFavorite && (
            <div className="bg-accent text-accent-foreground px-2 py-1 rounded-md shadow-lg">
              <Star className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-lg line-clamp-1 text-foreground">{movie.title}</h3>
        <p className="text-sm text-muted-foreground">{releaseYear}</p>
        
        <div className="flex flex-wrap gap-1">
          {movieGenres.map((genre) => (
            <span
              key={genre!.id}
              className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md"
            >
              {genre!.name}
            </span>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {movie.overview || 'No description available.'}
        </p>
      </div>
    </div>
  );
};
