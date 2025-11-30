import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Refactored: No more hardcoded localhost
const API_URL = `${process.env.REACT_APP_API_URL}/api/books`; 

export const useBooks = (searchTerm, filters) => {
   // ... (rest of the code remains the same)
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    totalResults: 0
  });

  const fetchBooks = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Convert filters object into query params
      const params = {
        page: pageNum,
        search: searchTerm,
        limit: 50,
        ...filters // Spread filters (availableOnly, authors, etc) directly
      };

      const res = await axios.get(API_URL, { params });
      
      setBooks(res.data.data || []);
      setPagination({
        page: res.data.meta.currentPage,
        totalPages: res.data.meta.totalPages,
        totalResults: res.data.meta.totalResults
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Could not connect to the Library Database.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]); // Re-create fetcher when search or filters change

  // Initial Fetch & Reset on Search/Filter Change
  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchBooks(newPage);
    }
  };

  return { books, loading, error, pagination, goToPage, refresh: () => fetchBooks(pagination.page) };
};