import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Heart, Share, Play, Eye, ThumbsUp, Sparkles, Bell, RotateCcw, AlertCircle, User, Tag, Filter, Search, Grid, List } from 'lucide-react';

const Un = "/imgs/unl.jpg"; // Default image

// API base URL - adjust this to match your server
const API_BASE_URL =   import.meta.env.VITE_API_URL || "http://localhost:5000"; 

const Pro = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Improved CMS content fetching with multiple endpoints
  const fetchCMSContent = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching CMS content...'); // Debug log

      // Try both public and CMS endpoints to get all content
      const endpoints = [
        `${API_BASE_URL}/api/public/posts?limit=50`,
        `${API_BASE_URL}/api/cms/posts?limit=50`,
        `${API_BASE_URL}/api/public/posts?type=announcement&limit=20`,
        `${API_BASE_URL}/api/cms/posts?type=announcement&limit=20`
      ];

      let allPosts = [];
      let successfulFetches = 0;

      // Try each endpoint and collect all posts
      for (const endpoint of endpoints) {
        try {
          console.log('📡 Trying endpoint:', endpoint);
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Response from', endpoint, ':', data);
            
            if (data.success && data.posts && Array.isArray(data.posts)) {
              // Add posts that aren't already in our collection
              const newPosts = data.posts.filter(post => 
                !allPosts.some(existing => 
                  (existing.id === post.id) || (existing._id === post._id)
                )
              );
              allPosts = [...allPosts, ...newPosts];
              successfulFetches++;
              console.log('📝 Added', newPosts.length, 'new posts. Total:', allPosts.length);
            }
          }
        } catch (endpointError) {
          console.log('❌ Endpoint failed:', endpoint, endpointError.message);
        }
      }

      if (allPosts.length > 0) {
        console.log('✅ Total posts found:', allPosts.length);
        
        // Transform CMS posts into event format with improved parsing
        const transformedEvents = allPosts.map((post, index) => {
          console.log(`📝 Processing post ${index}:`, post.title);
          
          return {
            id: post.id || post._id,
            title: post.title,
            date: extractDate(post.content, post.scheduledDate) || new Date().toISOString().split('T')[0],
            time: extractTime(post.content, post.scheduledDate) || "10:00 AM",
            location: extractLocation(post.content) || "Church Sanctuary",
            attendees: Math.floor(Math.random() * 300) + 50,
            description: post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content,
            fullContent: post.content,
            category: mapPostTypeToCategory(post.type) || 'Church Event',
            featured: index === 0,
            views: post.views || 0,
            likes: post.likes || 0,
            author: post.author || 'Admin',
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            status: post.status,
            tags: post.tags || [],
            originalType: post.type // Keep original type for reference
          };
        });

        // Sort events by date and featured status
        transformedEvents.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
        });

        console.log('🎯 Transformed Events:', transformedEvents);
        setEvents(transformedEvents);
        
        // Reset selected event if it's out of bounds
        if (selectedEvent >= transformedEvents.length) {
          setSelectedEvent(0);
        }
      } else if (successfulFetches === 0) {
        throw new Error('No API endpoints responded successfully. Check if your server is running.');
      } else {
        console.log('⚠️ No posts found in any endpoint');
        throw new Error('No posts found. Add some content from the admin panel.');
      }
    } catch (err) {
      console.error('❌ Error fetching CMS content:', err);
      setError(err.message);
      
      // Fallback to default events if API fails
      console.log('🔄 Using fallback events');
      const fallbackEvents = [
        {
          id: 'default-1',
          title: "Welcome! No Events Found",
          date: new Date().toISOString().split('T')[0],
          time: "10:00 AM",
          location: "Add content from CMS",
          attendees: 0,
          description: "No events are currently available. Please add some content from the admin panel to see them here.",
          fullContent: "No events are currently available. Please add some content from the Content Management System to see them displayed here. You can create announcements, devotionals, or other content types that will automatically appear on this page.",
          category: "System Message",
          featured: true,
          views: 0,
          likes: 0,
          author: 'System',
          status: 'published'
        }
      ];
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  // Improved helper functions
  const mapPostTypeToCategory = (type) => {
    const typeMap = {
      'devotional': 'Daily Devotional',
      'scripture': 'Scripture Study',
      'announcement': 'Special Event',
      'event': 'Church Event',
      'news': 'Church News',
      'prayer': 'Prayer Request'
    };
    return typeMap[type] || 'Church Event';
  };

  const extractDate = (content, scheduledDate) => {
    // First check if there's a scheduled date
    if (scheduledDate) {
      try {
        return new Date(scheduledDate).toISOString().split('T')[0];
      } catch (e) {
        console.log('Invalid scheduled date:', scheduledDate);
      }
    }

    if (!content) return null;
    
    const datePatterns = [
      /\b(\d{4}-\d{2}-\d{2})\b/, // YYYY-MM-DD
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/, // MM/DD/YYYY or DD/MM/YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i, // Month DD, YYYY
      /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i, // DD Month YYYY
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/i // Abbreviated months
    ];
    
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          continue;
        }
      }
    }
    return null;
  };

  const extractTime = (content, scheduledDate) => {
    // First check if there's a scheduled date with time
    if (scheduledDate) {
      try {
        const date = new Date(scheduledDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        }
      } catch (e) {
        console.log('Invalid scheduled date for time:', scheduledDate);
      }
    }

    if (!content) return null;
    
    const timePatterns = [
      /\b(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\b/i,
      /\b(\d{1,2}\s*(?:AM|PM|am|pm))\b/i,
      /\b(\d{1,2}:\d{2})\b/
    ];
    
    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  };

  const extractLocation = (content) => {
    if (!content) return null;
    
    const locationKeywords = [
      'at ', 'in ', 'location:', 'venue:', 'held at', 'taking place at', 
      'happening at', 'join us at', 'meet at', 'gathering at'
    ];
    
    const lines = content.split(/[\n.!?]/);
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of locationKeywords) {
        const index = lowerLine.indexOf(keyword.toLowerCase());
        if (index !== -1) {
          const locationText = line.substring(index + keyword.length).trim();
          if (locationText && locationText.length > 2) {
            // Clean up the location text
            const cleanLocation = locationText
              .split(',')[0] // Take first part if comma-separated
              .split('.')[0] // Take first part if period-separated
              .split('!')[0] // Take first part if exclamation-separated
              .trim();
            
            if (cleanLocation.length > 2) {
              return cleanLocation;
            }
          }
        }
      }
    }
    return null;
  };

  // Load CMS content on component mount and set up auto-refresh
  useEffect(() => {
    console.log('🚀 Component mounted, fetching content...');
    fetchCMSContent();

    // Auto-refresh every 60 seconds to catch new content (reduced from 30s)
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing content...');
      fetchCMSContent();
    }, 60000);

    return () => {
      console.log('🧹 Cleaning up interval...');
      clearInterval(interval);
    };
  }, []);

  // Debug: Log events changes
  useEffect(() => {
    console.log('📋 Events state updated:', events.length, 'events');
  }, [events]);

  const handleEventSelect = (index) => {
    console.log('🎯 Event selected:', index);
    setSelectedEvent(index);
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchCMSContent(true);
  };

  const handleRemindMe = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    // Optional: Update likes on server
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date TBD';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Date TBD';
    }
  };

  // Filter events based on search and category
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.fullContent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           event.category === selectedCategory ||
                           event.originalType === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from events
  const categories = ['all', ...new Set([
    ...events.map(e => e.category),
    ...events.map(e => e.originalType).filter(Boolean)
  ])];

  // Loading state
  if (loading && events.length === 0) {
    return (
      <div className='font-[poppins] py-16 px-6 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 min-h-screen'>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="text-indigo-600 text-2xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Loading Events</h2>
            <p className="text-gray-600 mb-2">Connecting to your CMS...</p>
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Server: <span className="font-mono text-indigo-600">{API_BASE_URL}</span></p>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state with troubleshooting
  if (error && events.length === 0) {
    return (
      <div className='font-[poppins] py-16 px-6 bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 min-h-screen'>
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-500 w-12 h-12" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-red-200 rounded-full"></div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Connection Failed</h2>
            <p className="text-red-600 text-lg mb-8 max-w-2xl mx-auto">{error}</p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 text-left border border-red-100 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="text-red-600 w-5 h-5" />
                </div>
                Troubleshooting Steps
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Check Server Status</h4>
                      <p className="text-gray-600 text-sm">Ensure your server is running on <span className="font-mono bg-gray-100 px-2 py-1 rounded">{API_BASE_URL}</span></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Verify CMS Content</h4>
                      <p className="text-gray-600 text-sm">Make sure you've added posts from the admin panel</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Check API Endpoints</h4>
                      <p className="text-gray-600 text-sm">Verify that CMS endpoints are accessible</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Browser Console</h4>
                      <p className="text-gray-600 text-sm">Check developer tools for detailed errors</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                refreshing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg'
              }`}
            >
              <RotateCcw className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentEvent = events[selectedEvent] || filteredEvents[0];
  if (!currentEvent) {
    console.log('⚠️ No current event found for index:', selectedEvent);
    return null;
  }

  return (
    <div className='font-[poppins] py-8 px-4 sm:px-6 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 min-h-screen'>
      <div className="max-w-7xl mx-auto">
        
        {/* Enhanced Header Section */}
        {/* <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                <Calendar className="text-3xl text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Church Events
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Live from your CMS
              </p>
            </div>
          </div> */}
          
          {/* Stats Banner */}
          {/* <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-indigo-600 mb-1">{events.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{categories.length - 1}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-pink-600 mb-1">{events.filter(e => e.status === 'published').length}</div>
                <div className="text-sm text-gray-600">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">Live</div>
                <div className="text-sm text-gray-600">CMS Status</div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Enhanced Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events, content, and descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white appearance-none cursor-pointer min-w-[180px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* View Toggle and Refresh */}
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-300 ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
                title="Refresh events"
              >
                <RotateCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Filter Results Info */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {filteredEvents.length} of {events.length} events</span>
                {searchTerm && (
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                    "{searchTerm}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {selectedCategory}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {viewMode === 'grid' ? (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Event List Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="sticky top-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Calendar className="text-white w-5 h-5" />
                  </div>
                  All Events ({filteredEvents.length})
                </h2>
                
                <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {filteredEvents.map((event, index) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventSelect(index)}
                      className={`group p-5 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-102 border-2 ${
                        selectedEvent === index 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-lg scale-102' 
                          : 'bg-white/80 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                                                {/* Event Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {event.featured && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                              <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Featured</span>
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          {event.status && (
                            <div className="mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                event.status === 'published' ? 'bg-green-100 text-green-700' :
                                event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Quick Action */}
                        <div className="flex items-center gap-2">
                          {event.views > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              <span>{event.views}</span>
                            </div>
                          )}
                          <div className={`w-3 h-3 rounded-full ${selectedEvent === index ? 'bg-indigo-500' : 'bg-gray-300 group-hover:bg-indigo-300'} transition-colors duration-300`}></div>
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className={`font-bold text-lg mb-3 line-clamp-2 ${
                        selectedEvent === index ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-600'
                      } transition-colors duration-300`}>
                        {event.title}
                      </h3>
                      
                      {/* Event Details Grid */}
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className={`p-1.5 rounded-lg ${selectedEvent === index ? 'bg-indigo-100' : 'bg-gray-100 group-hover:bg-indigo-50'} transition-colors duration-300`}>
                            <Calendar className="w-4 h-4 text-indigo-500" />
                          </div>
                          <span className="text-gray-700 font-medium">{formatDate(event.date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className={`p-1.5 rounded-lg ${selectedEvent === index ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'} transition-colors duration-300`}>
                            <Clock className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-gray-700 font-medium">{event.time}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className={`p-1.5 rounded-lg ${selectedEvent === index ? 'bg-emerald-100' : 'bg-gray-100 group-hover:bg-emerald-50'} transition-colors duration-300`}>
                            <MapPin className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-gray-700 font-medium truncate">{event.location}</span>
                        </div>
                        
                        {event.attendees > 0 && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className={`p-1.5 rounded-lg ${selectedEvent === index ? 'bg-orange-100' : 'bg-gray-100 group-hover:bg-orange-50'} transition-colors duration-300`}>
                              <Users className="w-4 h-4 text-orange-500" />
                            </div>
                            <span className="text-gray-700 font-medium">{event.attendees} expected</span>
                          </div>
                        )}
                      </div>

                      {/* Event Category */}
                      <div className={`px-3 py-2 rounded-full text-xs font-bold w-fit transition-all duration-300 ${
                        selectedEvent === index 
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                      }`}>
                        {event.category}
                      </div>

                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {event.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              #{tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              +{event.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Author and Date */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{event.author}</span>
                        </div>
                        {event.createdAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(event.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Event Display */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                  
                  {/* Enhanced Background with Glass Effect */}
                  <div
                    className="h-[500px] sm:h-[600px] md:h-[700px] w-full bg-cover bg-center transition-all duration-700 group-hover:scale-105"
                    style={{ 
                      backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(79,70,229,0.4), rgba(219,39,119,0.3)), url(${Un})` 
                    }}
                  >
                    {/* Animated Particles Effect */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-1" style={{top: '10%', left: '20%'}}></div>
                      <div className="absolute w-1 h-1 bg-white/30 rounded-full animate-float-2" style={{top: '30%', right: '15%'}}></div>
                      <div className="absolute w-3 h-3 bg-white/10 rounded-full animate-float-3" style={{bottom: '40%', left: '10%'}}></div>
                      <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-float-1" style={{top: '70%', right: '25%'}}></div>
                    </div>

                    {/* Interactive Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <button className="relative p-8 bg-white/20 backdrop-blur-md rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-110 shadow-2xl">
                        <Play className="text-white text-4xl ml-2" />
                        <div className="absolute inset-0 rounded-full bg-white/10 animate-ping"></div>
                      </button>
                    </div>

                    {/* Main Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <div className="max-w-3xl">
                        
                        {/* Enhanced Badge Section */}
                        <div className="mb-6 flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 backdrop-blur-sm text-white rounded-full text-sm font-bold shadow-lg">
                            <Sparkles className="text-yellow-300 w-4 h-4" />
                            {currentEvent.category}
                          </span>
                          
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                            Live from CMS
                          </span>
                          
                          {currentEvent.originalType && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/80 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                              <Tag className="w-3 h-3" />
                              {currentEvent.originalType}
                            </span>
                          )}
                          
                          {currentEvent.status && (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 backdrop-blur-sm text-white rounded-full text-xs font-medium ${
                              currentEvent.status === 'published' ? 'bg-green-600/80' :
                              currentEvent.status === 'draft' ? 'bg-yellow-600/80' :
                              'bg-blue-600/80'
                            }`}>
                              {currentEvent.status}
                            </span>
                          )}
                        </div>

                        {/* Enhanced Title */}
                        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                          {currentEvent.title}
                        </h2>

                        {/* Enhanced Details Grid */}
                        <div className="grid sm:grid-cols-2 gap-6 mb-8">
                          <div className="flex items-center gap-4 text-white/95">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                              <Calendar className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm text-white/70 font-medium">Date</p>
                              <p className="font-bold text-lg">{formatDate(currentEvent.date)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-white/95">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                              <Clock className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm text-white/70 font-medium">Time</p>
                              <p className="font-bold text-lg">{currentEvent.time}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-white/95">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                              <MapPin className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm text-white/70 font-medium">Location</p>
                              <p className="font-bold text-lg">{currentEvent.location}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-white/95">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                              <Users className="text-xl" />
                            </div>
                            <div>
                              <p className="text-sm text-white/70 font-medium">Expected</p>
                              <p className="font-bold text-lg">{currentEvent.attendees} people</p>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Content */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
                          <p className="text-white/95 text-lg leading-relaxed">
                            {currentEvent.fullContent || currentEvent.description}
                          </p>
                        </div>

                        {/* Enhanced Metadata */}
                        <div className="flex items-center gap-6 mb-8 text-white/80 text-sm flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-white/20 rounded-lg">
                              <Eye className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{currentEvent.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-white/20 rounded-lg">
                              <ThumbsUp className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{currentEvent.likes} likes</span>
                          </div>
                          {currentEvent.author && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-white/20 rounded-lg">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="font-medium">By {currentEvent.author}</span>
                            </div>
                          )}
                          {currentEvent.updatedAt && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-white/20 rounded-lg">
                                <Clock className="w-4 h-4" />
                              </div>
                              <span className="font-medium">
                                Updated {new Date(currentEvent.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex flex-wrap gap-4">
                          <button className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl group">
                            <Calendar className="w-5 h-5 group-hover:animate-bounce" />
                            Register Now
                          </button>

                          <button 
                            onClick={handleRemindMe}
                            className="flex items-center gap-3 bg-white/20 backdrop-blur-md border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          >
                            <Bell className="w-5 h-5" />
                            Remind Me
                          </button>

                          <div className="flex gap-3">
                            <button 
                              onClick={handleLike}
                              className={`p-4 backdrop-blur-md border-2 border-white/30 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
                                isLiked ? 'bg-red-500 text-white border-red-400' : 'bg-white/20 text-white hover:bg-white/30'
                              }`}
                            >
                              <Heart className={`w-6 h-6 ${isLiked ? 'animate-pulse' : ''}`} />
                            </button>

                            <button className="p-4 bg-white/20 backdrop-blur-md border-2 border-white/30 text-white rounded-2xl hover:bg-white/30 transition-all duration-300 transform hover:scale-110 shadow-lg">
                              <Share className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                onClick={() => handleEventSelect(index)}
                className={`group relative p-8 rounded-3xl cursor-pointer transition-all duration-500 transform hover:scale-102 border-2 overflow-hidden ${
                  selectedEvent === index 
                    ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-300 shadow-xl scale-102' 
                    : 'bg-white/80 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-indigo-200 hover:shadow-lg'
                }`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200 to-green-200 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                <div className="relative z-10 grid lg:grid-cols-3 gap-8 items-center">
                  
                  {/* Event Info */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Header with Badges */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        {event.featured && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            <span>FEATURED</span>
                          </div>
                        )}
                        
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          selectedEvent === index 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                        } transition-all duration-300`}>
                          {event.category}
                        </div>

                        {event.originalType && (
                          <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {event.originalType}
                          </div>
                        )}

                        {event.status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            event.status === 'published' ? 'bg-green-100 text-green-700' :
                            event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {event.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-3xl md:text-4xl font-bold leading-tight transition-all duration-300 ${
                      selectedEvent === index ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-600'
                    }`}>
                      {event.title}
                    </h3>

                    {/* Content Preview */}
                    <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                      selectedEvent === index ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-700'
                    }`}>
                      {event.fullContent && event.fullContent.length > 300 
                        ? event.fullContent.substring(0, 300) + "..." 
                        : event.fullContent || event.description}
                    </p>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{event.author}</span>
                      </div>
                      
                      {event.views > 0 && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{event.views} views</span>
                        </div>
                      )}
                      
                      {event.likes > 0 && (
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{event.likes} likes</span>
                        </div>
                      )}
                      
                      {event.createdAt && (
                        <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Event Details Card */}
                  <div className="lg:col-span-1">
                    <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                      selectedEvent === index 
                        ? 'bg-white/90 border-indigo-200 shadow-xl' 
                        : 'bg-white/60 border-gray-200 group-hover:bg-white/80 group-hover:border-indigo-200'
                    }`}>
                      
                      {/* Quick Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Date</p>
                            <p className="font-bold text-gray-800">{formatDate(event.date)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Time</p>
                            <p className="font-bold text-gray-800">{event.time}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Location</p>
                            <p className="font-bold text-gray-800">{event.location}</p>
                          </div>
                        </div>

                        {event.attendees > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Users className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Expected</p>
                              <p className="font-bold text-gray-800">{event.attendees} people</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                          <Calendar className="w-5 h-5" />
                          View Details
                        </button>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemindMe();
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300"
                          >
                            <Bell className="w-4 h-4" />
                            Remind
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike();
                            }}
                            className={`p-2 border-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                              isLiked ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isLiked ? 'animate-pulse' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced CMS Status Footer */}
        {/* <div className="mt-12 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-indigo-200/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm font-bold text-gray-700">CMS Connected</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">
                Last synced: {new Date().toLocaleTimeString()}
              </span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600">
                Auto-refresh: 60s
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {events.some(e => e.originalType) && (
                <div className="text-sm text-gray-600">
                  Content types: <span className="font-semibold text-indigo-600">
                    {[...new Set(events.map(e => e.originalType).filter(Boolean))].join(', ')}
                  </span>
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm'
                }`}
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div> */}

        {/* Enhanced Success Notification */}
        {showNotification && (
          <div className="fixed top-8 right-8 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl border border-green-400">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-lg">Reminder Set!</div>
                  <div className="text-sm text-green-100">We'll notify you before the event starts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Filtered Results */}
        {filteredEvents.length === 0 && events.length > 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Events Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No events match your current search criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors duration-300"
            >
              <RotateCcw className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(10px, -10px) rotate(120deg); }
          66% { transform: translate(-5px, 5px) rotate(240deg); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-8px, -8px) rotate(90deg); }
          50% { transform: translate(8px, -4px) rotate(180deg); }
          75% { transform: translate(-4px, 8px) rotate(270deg); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(6px, -12px) scale(1.1); }
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .animate-float-1 {
          animation: float-1 8s ease-in-out infinite;
        }
        
        .animate-float-2 {
          animation: float-2 6s ease-in-out infinite;
        }
        
        .animate-float-3 {
          animation: float-3 10s ease-in-out infinite;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .scale-102 {
          transform: scale(1.02);
        }
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default Pro;