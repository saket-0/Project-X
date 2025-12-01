import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Simple debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useBooks = (initialFilters = {}) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters); // { floor: 'III', category: '...' }
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const debouncedSearch = useDebounce(search, 400);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: debouncedSearch,
        page,
        limit: 50,
        ...filters
      };
      
      const response = await axios.get('http://localhost:5001/api/books', { params });
      
      setBooks(response.data.data);
      setMeta(response.data.meta);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load books. Please check backend.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, filters]);

  // Refetch when these change
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilters,
    page,
    setPage,
    meta,
    refresh: fetchBooks
  };
};