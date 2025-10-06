import { useEffect, useState } from "react";
import { Movie, MovieDetails, Credits, Video, Genre } from "@/types/movie";
import { tmdb } from "@/lib/tmdb";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Play, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  genres: Genre[];
}

export const MovieModal = ({ movie, isOpen, onClose, isFavorite, onToggleFavorite, genres }: MovieModalProps) => {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (movie && isOpen) {
      setShowTrailer(false);
      loadMovieData();
    }
  }, [movie, isOpen]);

  const loadMovieData = async () => {
    if (!movie) return;
    
    setLoading(true);
    try {
      const [detailsData, creditsData, videosData, similarData] = await Promise.all([
        tmdb.fetchMovieDetails(movie.id),
        tmdb.fetchCredits(movie.id),
        tmdb.fetchVideos(movie.id),
        tmdb.fetchSimilar(movie.id),
      ]);
      
      setDetails(detailsData);
      setCredits(creditsData);
      setVideos(videosData.results || []);
      setSimilar(similarData.results?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error loading movie data:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  if (!movie) return null;

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const directors = credits?.crew.filter(c => c.job === 'Director') || [];
  
  const getRatingColor = (vote: number) => {
    if (vote >= 8) return 'text-rating-high';
    if (vote >= 6) return 'text-rating-medium';
    if (vote >= 4) return 'text-rating-low';
    return 'text-muted-foreground';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose} key={movie.id}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">{movie.title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="relative rounded-lg overflow-hidden shadow-card">
                {movie.poster_path ? (
                  <img
                    src={tmdb.getImageUrl(movie.poster_path)!}
                    alt={movie.title}
                    className="w-full"
                  />
                ) : (
                  <div className="aspect-[2/3] bg-secondary flex items-center justify-center">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <Button
                  onClick={onToggleFavorite}
                  variant="outline"
                  className="w-full"
                >
                  <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current text-accent' : ''}`} />
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Button>
                
                {trailer && (
                  <Button
                    onClick={() => setShowTrailer(true)}
                    variant="default"
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Trailer
                  </Button>
                )}
                
                <Button
                  onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.id}`, '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on TMDb
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className={`text-4xl font-bold ${getRatingColor(movie.vote_average)}`}>
                  {rating}
                </div>
                {details?.runtime && (
                  <span className="text-muted-foreground">
                    {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                  </span>
                )}
                {movie.release_date && (
                  <span className="text-muted-foreground">
                    {new Date(movie.release_date).getFullYear()}
                  </span>
                )}
              </div>
              
              {details?.genres && details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {details.genres.map(genre => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
              
              {details?.tagline && (
                <p className="text-muted-foreground italic">"{details.tagline}"</p>
              )}
              
              <p className="text-foreground">{movie.overview || 'No description available.'}</p>
              
              {directors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Director{directors.length > 1 ? 's' : ''}</h4>
                  <p className="text-muted-foreground">{directors.map(d => d.name).join(', ')}</p>
                </div>
              )}
              
              {credits && credits.cast.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Cast</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {credits.cast.slice(0, 8).map(person => (
                      <div key={person.id} className="text-center">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-secondary mb-2">
                          {person.profile_path ? (
                            <img
                              src={tmdb.getImageUrl(person.profile_path)!}
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              👤
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{person.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{person.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {similar.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Similar Movies</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {similar.map(m => (
                      <div
                        key={m.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          onClose();
                          // This would reopen with the new movie
                        }}
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                          {m.poster_path ? (
                            <img
                              src={tmdb.getImageUrl(m.poster_path)!}
                              alt={m.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🎬
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">{m.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {showTrailer && trailer && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowTrailer(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <Button
              onClick={() => setShowTrailer(false)}
              variant="default"
              size="icon"
              className="absolute -top-14 right-0 z-[110] bg-white text-black hover:bg-gray-200 shadow-2xl"
            >
              <X className="w-6 h-6" />
            </Button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&controls=1&modestbranding=1&rel=0`}
              className="w-full h-full rounded-lg"
              allowFullScreen
              allow="autoplay; encrypted-media"
              title="Movie Trailer"
            />
          </div>
        </div>
      )}
    </>
  );
};
