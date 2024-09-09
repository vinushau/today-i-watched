import "./style.css";
import supabase from "./supabase";
import { useEffect, useState } from "react";

const OMDB_API_KEY = process.env.REACT_APP_API_KEY;

const CATEGORIES = [
  { name: "top rated", color: "#064e3b" },
  { name: "hidden gems", color: "#701a75" },
  { name: "critically acclaimed", color: "#0c4a6e" },
  { name: "cult classics", color: "#881337" },
  { name: "indie films", color: "#db2777" },
  { name: "blockbusters", color: "#0d9488" },
  { name: "recently released", color: "#5a1c93" },
];

function App() {
  //1. Define state variable
  const [showForm, setShowForm] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");
  useEffect(
    function () {
      async function getRecommendations() {
        setIsLoading(true);
        let query = supabase.from("recommendations").select("*");
        if (currentCategory !== "all")
          query = query.eq("category", currentCategory);
        const { data: recommendations, error } = await query
          .order("votesLove", { ascending: false })
          .limit(1000);
        if (!error) setRecommendations(recommendations);
        else alert("There was a problem getting data");
        setIsLoading(false);
      }
      getRecommendations();
    },
    [currentCategory]
  );
  return (
    <>
      <Header showForm={showForm} setShowForm={setShowForm} />
      {/* 2. use state variable */}
      {showForm ? (
        <NewRecommendationForm
          setRecommendations={setRecommendations}
          setShowForm={setShowForm}
        />
      ) : null}
      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <RecommendationList
            recommendations={recommendations}
            setRecommendations={setRecommendations}
          />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setShowForm }) {
  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" height="68" width="68" alt="Today I Watched Logo" />
        <h1>Today I Watched</h1>
      </div>
      <button
        className="btn btn-large btn-open"
        // 3. update state variable
        onClick={() => setShowForm((show) => !show)}
      >
        {showForm ? "Close" : "Share a recommendation"}
      </button>
    </header>
  );
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function NewRecommendationForm({ setRecommendations, setShowForm }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    // 1. Prevent browser reload
    e.preventDefault();
    console.log(text, source, category);

    // 2. Check if data is valid. If so, create a new recommendation
    if (text && isValidHttpUrl(source) && category && textLength <= 250)
      console.log("data");
    {
      //3. upload recommendation to supabase and receive the new recommendation object
      setIsUploading(true);
      const { data: newRecommendation, error } = await supabase
        .from("recommendations")
        .insert([{ text, source, category }])
        .select();
      setIsUploading(false);

      // 4. Add the new recommendation to the UI; add the recommendation to state
      if (!error)
        setRecommendations((recommendations) => [
          newRecommendation[0],
          ...recommendations,
        ]);
      // 5. Reset input fields
      setText("");
      setSource("");
      setCategory("");

      // 6. Close the form
      setShowForm(false);
    }
  }

  return (
    <form className="recommendation-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a recommendation with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{250 - text.length}</span>
      <input
        value={source}
        type="text"
        placeholder="IMDb link..."
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category:</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCategory("all")}
          >
            All
          </button>
        </li>
        {CATEGORIES.map((cat) => (
          <li key={cat.name} className="category">
            <button
              className="btn btn-category"
              style={{ backgroundColor: cat.color }}
              onClick={() => setCurrentCategory(cat.name)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RecommendationList({ recommendations, setRecommendations }) {
  if (recommendations.length === 0)
    return (
      <p className="message">
        No recommendations for this category yet Create the first one!
      </p>
    );

  return (
    <section>
      <ul className="recommendations-list">
        {recommendations.map((recommendation) => (
          <Recommendation
            key={recommendation.id}
            recommendation={recommendation}
            setRecommendations={setRecommendations}
          />
        ))}
      </ul>
      <p>
        There are {recommendations.length} recommendations posted. Add your own!
      </p>
    </section>
  );
}

function Recommendation({ recommendation, setRecommendations }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [poster, setPoster] = useState(null);
  const isDownvoted =
    recommendation.votesLove + recommendation.votesUp <
    recommendation.votesDown;

  useEffect(() => {
    async function fetchPoster() {
      if (recommendation.source) {
        const imdbID = recommendation.source.match(/tt\d+/);
        if (imdbID) {
          const response = await fetch(
            `https://www.omdbapi.com/?i=${imdbID[0]}&apikey=${OMDB_API_KEY}`
          );
          const data = await response.json();
          if (data.Poster) {
            setPoster(data.Poster);
          }
        }
      }
    }
    fetchPoster();
  }, [recommendation.source]);

  async function handleVote(columnName) {
    setIsUpdating(true);
    const { data: updatedRecommendation, error } = await supabase
      .from("recommendations")
      .update({ [columnName]: recommendation[columnName] + 1 })
      .eq("id", recommendation.id)
      .select();
    setIsUpdating(false);

    if (!error) {
      setRecommendations((recommendations) =>
        recommendations.map((f) =>
          f.id === recommendation.id ? updatedRecommendation[0] : f
        )
      );
    }
  }

  return (
    <li className="recommendation">
      <div className="recommendation-content">
        {poster && (
          <img
            src={poster}
            alt={`${recommendation.text} poster`}
            className="poster"
          />
        )}
        <div className="recommendation-text">
          {isDownvoted ? (
            <span className="downvoted">[⛔DOWNVOTED]</span>
          ) : null}
          <p>
            {recommendation.text}
            <a
              className="source"
              href={recommendation.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              (IMDb)
            </a>
          </p>
        </div>
      </div>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find(
            (cat) => cat.name === recommendation.category
          ).color,
        }}
      >
        {recommendation.category}
      </span>
      <div className="vote-buttons">
        <button onClick={() => handleVote("votesLove")} disabled={isUpdating}>
          ❤️ {recommendation.votesLove}
        </button>
        <button onClick={() => handleVote("votesUp")} disabled={isUpdating}>
          👍 {recommendation.votesUp}
        </button>
        <button onClick={() => handleVote("votesDown")} disabled={isUpdating}>
          👎 {recommendation.votesDown}
        </button>
      </div>
    </li>
  );
}

export default App;
