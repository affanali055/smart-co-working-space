import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Workspace {
  id: number;
  name: string;
  type: string;
  capacity: number;
  area_size: number;
  price_per_hour: number;
  price_per_day: number;
  location: string;
  address: string;
  description: string;
  image_url: string;
  rating: number;
  expectations: string;
  amenities: Array<{ id: number; name: string; icon: string }>;
}

export const Home: React.FC = () => {
  const { showToast } = useAuth();
  const [spaces, setSpaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchCapacity, setSearchCapacity] = useState<number | ''>('');
  const [searchArea, setSearchArea] = useState<number | ''>('');
  const [searchPrice, setSearchPrice] = useState<number | ''>('');
  const [searchType, setSearchType] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Smart Matching state
  const [isSmartMatching, setIsSmartMatching] = useState(false);
  const [matchFocus, setMatchFocus] = useState(5);       // quiet, focused
  const [matchCollab, setMatchCollab] = useState(5);     // collaborative, creative
  const [matchSocial, setMatchSocial] = useState(5);     // social, community

  const availableAmenitiesList = [
    "High-speed Wi-Fi",
    "Free Parking",
    "Cafeteria / Coffee",
    "24/7 Power Backup",
    "Meeting Rooms",
    "CCTV & Security",
    "Air Conditioning",
    "Printing Services"
  ];

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      
      if (searchLocation) params.append('location', searchLocation);
      if (searchCapacity) params.append('capacity', searchCapacity.toString());
      if (searchArea) params.append('min_area', searchArea.toString());
      if (searchPrice) params.append('max_price', searchPrice.toString());
      if (searchType) params.append('workspace_type', searchType);
      
      selectedAmenities.forEach(am => {
        params.append('amenities', am);
      });

      // If smart matching is active, pass matching parameters
      if (isSmartMatching) {
        if (searchLocation) params.append('match_location', searchLocation);
        if (searchCapacity) params.append('match_capacity', searchCapacity.toString());
        if (searchPrice) params.append('match_price', searchPrice.toString());
        
        selectedAmenities.forEach(am => {
          params.append('match_amenities', am);
        });

        // Translate slider values into text tags
        const expectationTags: string[] = [];
        if (matchFocus >= 6) expectationTags.push('quiet', 'focused');
        if (matchCollab >= 6) expectationTags.push('collaborative', 'creative');
        if (matchSocial >= 6) expectationTags.push('social', 'community');
        if (matchFocus <= 4) expectationTags.push('social', 'vibrant'); // opposite
        
        if (expectationTags.length > 0) {
          params.append('match_expectations', expectationTags.join(','));
        }
      }

      const res = await fetch(`/api/spaces/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      } else {
        showToast('Failed to load workspaces.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [searchLocation, searchCapacity, searchArea, searchPrice, searchType, selectedAmenities, isSmartMatching, matchFocus, matchCollab, matchSocial]);

  const handleAmenityChange = (name: string) => {
    setSelectedAmenities(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const resetFilters = () => {
    setSearchLocation('');
    setSearchCapacity('');
    setSearchArea('');
    setSearchPrice('');
    setSearchType('');
    setSelectedAmenities([]);
    setIsSmartMatching(false);
    setMatchFocus(5);
    setMatchCollab(5);
    setMatchSocial(5);
  };

  const getWorkspaceTypeLabel = (type: string) => {
    switch (type) {
      case 'private_cabin': return 'Private Suite';
      case 'shared_desk': return 'Shared Desk';
      case 'meeting_room': return 'Meeting Room';
      default: return type;
    }
  };

  return (
    <div className="main-content">
      {/* Background blobs for premium glow design */}
      <div className="glow-blob blue"></div>
      <div className="glow-blob purple"></div>

      <div className="hero-section">
        <h1 className="hero-title">Discover Your Perfect Shared Workspace</h1>
        <p className="hero-desc">
          Smart matching technology tailored to fit your team size, budget, work style, and dynamic expectations.
        </p>
      </div>

      <div className="search-matching-container">
        {/* Left Side: Interactive Search & Filters */}
        <aside className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Search Filters</h2>
            <button 
              onClick={resetFilters} 
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
            >
              Reset All
            </button>
          </div>

          <div className="filter-group">
            <label className="filter-label">City / Location</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. San Francisco" 
              value={searchLocation} 
              onChange={e => setSearchLocation(e.target.value)} 
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Workspace Type</label>
            <select 
              className="input-field" 
              value={searchType} 
              onChange={e => setSearchType(e.target.value)}
            >
              <option value="">All Spaces</option>
              <option value="private_cabin">Private Suites</option>
              <option value="shared_desk">Shared Desks</option>
              <option value="meeting_room">Meeting Rooms</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Team Size (Persons)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Minimum Capacity" 
              value={searchCapacity} 
              onChange={e => setSearchCapacity(e.target.value === '' ? '' : parseInt(e.target.value))} 
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Min Area (Sq.Ft.)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="e.g. 100" 
              value={searchArea} 
              onChange={e => setSearchArea(e.target.value === '' ? '' : parseFloat(e.target.value))} 
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Max Price per Hour ($)</label>
            <input 
              type="number" 
              className="input-field" 
              placeholder="Hourly limit" 
              value={searchPrice} 
              onChange={e => setSearchPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} 
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Key Amenities</label>
            <div className="checkbox-grid">
              {availableAmenitiesList.map(am => (
                <label key={am} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={selectedAmenities.includes(am)} 
                    onChange={() => handleAmenityChange(am)} 
                  />
                  <span style={{ fontSize: '12px' }}>{am.split(' ')[0]}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Side: Smart Match Control Panel & Listings */}
        <div>
          {/* Smart Matching Engine Panel */}
          <div className="glass-card matching-engine" style={{ marginBottom: '24px' }}>
            <div className="matching-engine-header">
              <span className="material-symbols-outlined">psychology</span>
              <h3>Expectations Smart Matching Engine</h3>
              <div style={{ marginLeft: 'auto' }}>
                <label className="checkbox-label" style={{ fontWeight: '600', color: '#c084fc' }}>
                  <input 
                    type="checkbox" 
                    checked={isSmartMatching} 
                    onChange={e => setIsSmartMatching(e.target.checked)} 
                  />
                  Enable Smart Match
                </label>
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Set your workstyle alignment expectations. NexSpace will calculate compatibility scores (0-100%) and sort spaces accordingly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', opacity: isSmartMatching ? 1 : 0.4, transition: 'var(--transition)' }}>
              <div className="slider-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Quiet Focus</span>
                  <span style={{ color: '#c084fc', fontWeight: '600' }}>{matchFocus}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  className="range-slider" 
                  disabled={!isSmartMatching}
                  value={matchFocus} 
                  onChange={e => setMatchFocus(parseInt(e.target.value))} 
                />
                <div className="slider-labels">
                  <span>Energetic</span>
                  <span>Silent Zone</span>
                </div>
              </div>

              <div className="slider-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Team Collaboration</span>
                  <span style={{ color: '#c084fc', fontWeight: '600' }}>{matchCollab}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  className="range-slider" 
                  disabled={!isSmartMatching}
                  value={matchCollab} 
                  onChange={e => setMatchCollab(parseInt(e.target.value))} 
                />
                <div className="slider-labels">
                  <span>Solo Work</span>
                  <span>Workshop Mode</span>
                </div>
              </div>

              <div className="slider-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Social Connection</span>
                  <span style={{ color: '#c084fc', fontWeight: '600' }}>{matchSocial}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  className="range-slider" 
                  disabled={!isSmartMatching}
                  value={matchSocial} 
                  onChange={e => setMatchSocial(parseInt(e.target.value))} 
                />
                <div className="slider-labels">
                  <span>Highly Private</span>
                  <span>Networking Hall</span>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>
              {loading ? 'Searching Spaces...' : `Matched Workspaces (${spaces.length})`}
            </h3>
            {isSmartMatching && <span style={{ fontSize: '13px', color: '#c084fc', fontStyle: 'italic' }}>Sorted by Match Accuracy</span>}
          </div>

          {/* Grid Layout */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>sync</span>
              <p style={{ marginTop: '12px' }}>Finding matched properties...</p>
            </div>
          ) : spaces.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>search_off</span>
              <h4 style={{ marginTop: '16px', fontSize: '18px', color: 'var(--text-primary)' }}>No Matching Workspaces Found</h4>
              <p style={{ marginTop: '6px' }}>Try loosening your budget, location, or expectations criteria.</p>
            </div>
          ) : (
            <div className="workspaces-grid">
              {spaces.map(space => (
                <div key={space.id} className="glass-card space-card">
                  <div className="space-img-container">
                    <img 
                      src={space.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'} 
                      alt={space.name} 
                      className="space-img" 
                    />
                    {isSmartMatching ? (
                      <div className="match-badge">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>psychology</span>
                        {space.rating}% Match
                      </div>
                    ) : (
                      <div className="match-badge" style={{ background: 'rgba(10, 14, 23, 0.7)', color: '#fbbf24', boxShadow: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', fill: '#fbbf24' }}>star</span>
                        {space.rating || 4.5}
                      </div>
                    )}
                  </div>

                  <div className="space-type">{getWorkspaceTypeLabel(space.type)}</div>
                  <h4 className="space-name">{space.name}</h4>
                  
                  <div className="space-loc">
                    <span className="material-symbols-outlined">location_on</span>
                    {space.location}
                  </div>

                  <div className="space-specs">
                    <div className="spec-item">
                      <span className="material-symbols-outlined">groups</span>
                      Up to {space.capacity} pax
                    </div>
                    <div className="spec-item">
                      <span className="material-symbols-outlined">square_foot</span>
                      {space.area_size} sqft
                    </div>
                  </div>

                  <div className="space-footer">
                    <div className="space-price">
                      ${space.price_per_hour}<span>/hr</span>
                    </div>
                    <Link to={`/space/${space.id}`}>
                      <button className="nav-btn" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Home;
