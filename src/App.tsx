import React, { useState, useEffect } from 'react';
import './App.css'

interface Post {  // Define the Post interface
  data: {
    id: string;
    title: string;
    author: string;
    url?: string; // Optional url
    thumbnail?: string; // Optional thumbnail
  };
}

function App() {
  const [subreddit, setSubreddit] = useState(''); // Default subreddit
  const [posts, setPosts] = useState<Post[]>([]); // Type the posts state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favouritePostData, setFavouritePostData] = useState<Post[]>([]);  // Store fetched data for saved posts
  const [loadingFavourites, setLoadingFavourites] = useState(false); // loading state

  const [savedPosts, setSavedPosts] = useState<string[]>(() => {
    const storedPosts = localStorage.getItem('savedPosts');
    return storedPosts ? JSON.parse(storedPosts) : [];
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const subredditInput = target.elements.namedItem('subreddit') as HTMLInputElement;

    if (subredditInput) {
      setSubreddit(subredditInput.value);
    } else {
      console.error("Subreddit input not found!");
    }
  };

  const handleFavouriteClick = (postId: string) => {
    setSavedPosts([...savedPosts, postId]);
  };

  const handleRemoveFavourite = (postId: string) => {
    const updatedSavedPosts = savedPosts.filter(id => id !== postId);
    setSavedPosts(updatedSavedPosts);

    localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));  // Update local storage immediately
  };

  useEffect(() => {
    const fetchSavedPosts = async () => {
      localStorage.setItem('savedPosts', JSON.stringify(savedPosts)); // Store the saved posts in local storage whenever savedPosts changes

      setLoadingFavourites(true); // Start loading
      const fetchedPosts: Post[] = [];

      for (const postId of savedPosts) {
        try {
          const response = await fetch(`https://www.reddit.com/by_id/t3_${postId}.json`); // Construct API URL, including 't3_'
          if (!response.ok) {
            throw new Error(`Failed to fetch post ${postId}: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          fetchedPosts.push(data.data.children[0]);  // Get the post object from response
        } catch (error) {
          console.error("Error fetching saved post:", error);
          // Consider setting an error state or other error handling here
        }
      }

      setFavouritePostData(fetchedPosts);
      setLoadingFavourites(false); // Done loading
    };

    if (savedPosts.length > 0) { // Only fetch if there are saved posts
      fetchSavedPosts();
    } else { //If no posts are saved, clear any saved posts from the display
      setFavouritePostData([]);
    }
  }, [savedPosts]);


  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`
        );
        if (!response.ok) {
          throw new Error(
            `Error fetching posts: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        setPosts(data.data.children);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (subreddit) { // Only fetch if subreddit is not empty
      fetchPosts();
    } else {        // Clear posts if subreddit is empty
      setPosts([]);
    }
  }, [subreddit]);

  return (
    <div>
      <h1>Reddit Post Viewer</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="subreddit" placeholder="Enter subreddit" />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading posts...</p>}
      {error && <p className="error">Error: {error}</p>}

      <ul>
        {posts.map((post) => {
          const isFavourited = savedPosts.includes(post.data.id); // Check if already favourited

          return (
            <li key={post.data.id} className="post">
              <button
                onClick={() => handleFavouriteClick(post.data.id)}
                className="favourite-button"
                disabled={isFavourited}>
                <h2>{post.data.title}</h2>
                <p>By: {post.data.author}</p>
                {post.data.url && <a href={post.data.url} target="_blank" rel="noopener noreferrer"><p>Link</p></a>} {/* Conditionally render link if available */}
                <img src={post.data.thumbnail} alt={""} style={{ maxWidth: "200px" }} onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; }} /> {/* Handle thumbnail errors, providing a fallback */}
                {isFavourited ? "Favourited" : "Save To Favourites"}  {/* Change button text */}
              </button>
              {/* ... other post content ... */}
            </li>
          );
        })}
      </ul>

      <h1>Your Favourited Posts</h1>
      {loadingFavourites && <p>Loading Favourites...</p>} {/* Loading indicator */}
      <ul>
        {favouritePostData.length == 0 && <h2>Favourite a post to start saving!</h2>}
        {favouritePostData.map((post) => ( // Map over the fetched post data
          <li key={post.data.id} className="post">
            <button onClick={() => handleRemoveFavourite(post.data.id)} className="favourite-button">Remove</button>
            <h2>{post.data.title}</h2>
            <p>By: {post.data.author}</p>
            {post.data.url && (
              <a href={post.data.url} target="_blank" rel="noopener noreferrer">
                <p>Link</p>
              </a>
            )}
            {/* Conditionally render the image */}
            {post.data.thumbnail && <img src={post.data.thumbnail} alt={post.data.title} style={{ maxWidth: '200px' }} onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; }} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App
