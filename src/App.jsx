import Search from "./components/Search";
import { useState, useEffect } from "react";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingItems, updateSearchCount } from "./appwrite";

const API_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTION = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

function App() {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [trendingError, setTrendingError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isloading, setIsLoading] = useState(false);
  const [debounce, setDebounce] = useState("");

  useDebounce(() => setDebounce(searchTerm), 1000, [searchTerm]);

  const fetchMovies = async (queryParams = " ") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = queryParams
        ? `${API_URL}/search/multi?query=${encodeURIComponent(queryParams)}`
        : `${API_URL}/trending/all/week`;
      const response = await fetch(endpoint, API_OPTION);

      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }

      const data = await response.json();

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Error fetching movies");
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if (queryParams && data.results.length > 0) {
        await updateSearchCount(queryParams, data.results[0]);
      }
    } catch (error) {
      console.error("Error fetching movies", error);
      setErrorMessage("Error fetching movies");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendingMovies = async () => {
    setIsLoading(true);
    setTrendingError("");

    try {
      const results = await getTrendingItems();

      setTrendingMovies(results);
    } catch (error) {
      console.error("Error fetching trending movies", error);
      setTrendingError("Error fetching trending movies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(debounce);
  }, [debounce]);

  useEffect(() => {
    getTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="herro banner" />
          <h1>
            Find <span className="text-gradient">movies</span> and{" "}
            <span className="text-gradient">shows</span> you enjoy without hasle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {isloading ? (
          <>
            <div className="flex justify-center items-center h-[50vh]">
              <Spinner />
            </div>
          </>
        ) : trendingError ? (
          <p className="text-red-500">{trendingError}</p>
        ) : (
          trendingMovies.length > 0 && (
            <section className="trending">
              <h2>Trending Movies</h2>
              <ul>
                {trendingMovies.map((items, index) => (
                  <li key={items.$id}>
                    <p>{index + 1}</p>
                    <img src={items.poster_url} alt={items.title} />
                  </li>
                ))}
              </ul>
            </section>
          )
        )}

        <section className="all-movies">
          <h2 className="pt-[40px]">All movies</h2>

          {isloading ? (
            <>
              <div className="flex justify-center items-center h-[50vh]">
                <Spinner />
              </div>
            </>
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
