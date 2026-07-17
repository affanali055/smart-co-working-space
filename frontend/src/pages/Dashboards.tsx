import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Booking {
  id: number;
  workspace_id: number;
  user_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at: string;
  workspace?: { name: string; location: string };
  user?: { full_name: string; email: string };
}

interface Inquiry {
  id: number;
  workspace_id: number;
  user_id: number;
  message: string;
  reply: string | null;
  status: 'pending' | 'replied';
  created_at: string;
  workspace?: { name: string };
  user?: { full_name: string; email: string };
}

export const Dashboards: React.FC = () => {
  const { user, showToast, fetchWithAuth } = useAuth();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Space owner form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceType, setSpaceType] = useState('shared_desk');
  const [spaceCapacity, setSpaceCapacity] = useState<number>(4);
  const [spaceArea, setSpaceArea] = useState<number>(150);
  const [spaceHourPrice, setSpaceHourPrice] = useState<number>(10);
  const [spaceDayPrice, setSpaceDayPrice] = useState<number>(60);
  const [spaceLocation, setSpaceLocation] = useState('');
  const [spaceAddress, setSpaceAddress] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceExpectations, setSpaceExpectations] = useState('quiet, collaborative');
  const [spaceAmenities, setSpaceAmenities] = useState<string[]>([]);

  // Owner inquiry reply state
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard metrics
      const metricsRes = await fetchWithAuth('/api/dashboard/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      // 2. Fetch user's bookings
      const bookingsRes = await fetchWithAuth('/api/bookings/my-bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }

      // 3. Fetch user's inquiries
      const inquiriesRes = await fetchWithAuth('/api/inquiries/my-inquiries');
      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        setInquiries(inquiriesData);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard statistics.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleBookingAction = async (bookingId: number, status: 'approved' | 'rejected' | 'cancelled') => {
    try {
      const res = await fetchWithAuth(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        showToast(`Booking successfully ${status}!`, 'success');
        fetchDashboardData(); // Refresh metrics
      } else {
        const data = await res.json();
        showToast(data.detail || 'Failed to update booking status.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'danger');
    }
  };

  const handleCreateSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/api/spaces/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: spaceName,
          type: spaceType,
          capacity: spaceCapacity,
          area_size: spaceArea,
          price_per_hour: spaceHourPrice,
          price_per_day: spaceDayPrice,
          location: spaceLocation,
          address: spaceAddress,
          description: spaceDesc,
          expectations: spaceExpectations,
          amenities: spaceAmenities,
        }),
      });

      if (res.ok) {
        showToast('New workspace listing uploaded successfully!', 'success');
        setShowAddForm(false);
        // Reset form
        setSpaceName('');
        setSpaceLocation('');
        setSpaceAddress('');
        setSpaceDesc('');
        setSpaceAmenities([]);
        fetchDashboardData();
      } else {
        showToast('Failed to create space listing.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to API.', 'danger');
    }
  };

  const handleInquiryReplySubmit = async (inquiryId: number) => {
    const text = replyText[inquiryId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetchWithAuth(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: text }),
      });

      if (res.ok) {
        showToast('Inquiry response sent successfully!', 'success');
        setReplyText(prev => ({ ...prev, [inquiryId]: '' }));
        fetchDashboardData();
      } else {
        showToast('Failed to submit response.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Error replying to inquiry.', 'danger');
    }
  };

  const handleFormAmenityChange = (name: string) => {
    setSpaceAmenities(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>sync</span>
        <p style={{ marginTop: '12px' }}>Aggregating system statistics...</p>
      </div>
    );
  }

  // ----------------------------------------
  // 1. CUSTOMER USER PANEL
  // ----------------------------------------
  const renderUserPanel = () => {
    return (
      <>
        {/* User Summary metrics */}
        <div className="dashboard-grid">
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="metric-value">{metrics?.total_bookings || 0}</div>
            <div className="metric-title">Total Bookings</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="metric-value">{metrics?.approved_bookings || 0}</div>
            <div className="metric-title">Approved Bookings</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-value">{metrics?.pending_bookings || 0}</div>
            <div className="metric-title">Pending Approvals</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="metric-value">${metrics?.total_spent || '0.00'}</div>
            <div className="metric-title">Total Spending</div>
          </div>
        </div>

        {/* User Booking History */}
        <div className="glass-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Your Booking Requests</h3>
          
          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>You haven't made any workspace bookings yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Workspace</th>
                    <th>Schedule Date</th>
                    <th>Time Interval</th>
                    <th>Charged Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.workspace?.name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.workspace?.location}</div>
                      </td>
                      <td>{b.booking_date}</td>
                      <td>{b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}</td>
                      <td>${b.total_price}</td>
                      <td>
                        <span className={`status-indicator ${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === 'pending' && (
                          <button 
                            className="nav-btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '12px', borderColor: 'var(--danger)', color: '#f87171' }}
                            onClick={() => handleBookingAction(b.id, 'cancelled')}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Inquiries List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Sent Inquiries & Expectations Alignment</h3>
          {inquiries.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>No direct inquiries sent.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {inquiries.map(inq => (
                <div key={inq.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{inq.workspace?.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(inq.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Your Message:</strong> "{inq.message}"
                  </p>
                  {inq.reply ? (
                    <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#c084fc' }}>
                        <strong>Manager Response:</strong> "{inq.reply}"
                      </p>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending owner reply...</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // ----------------------------------------
  // 2. SPACE OWNER PANEL
  // ----------------------------------------
  const renderOwnerPanel = () => {
    // Generate scale for custom bar graph
    const earnings = metrics?.monthly_earnings || [0, 0, 0, 0, 0, 0];
    const maxEarning = Math.max(...earnings, 100);
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

    return (
      <>
        {/* Owner Summary metrics */}
        <div className="dashboard-grid">
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="metric-value">{metrics?.total_workspaces || 0}</div>
            <div className="metric-title">Owned Workspaces</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-value">{metrics?.pending_approvals || 0}</div>
            <div className="metric-title">Pending Approvals</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="metric-value">${metrics?.total_revenue || '0.00'}</div>
            <div className="metric-title">Total Revenue</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="metric-value">{metrics?.occupancy_rate || 0}%</div>
            <div className="metric-title">Occupancy Rate</div>
          </div>
        </div>

        {/* Visual Charts & Upload Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Custom Earning Chart */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Platform Revenue Trend ($)</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Earning metrics over previous 6 calendar months</p>
            
            <div className="chart-container">
              {earnings.map((val: number, idx: number) => {
                const heightPercentage = (val / maxEarning) * 100;
                return (
                  <div key={idx} className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ height: `${Math.max(8, heightPercentage)}%` }}
                    >
                      <div className="chart-bar-tooltip">${val}</div>
                    </div>
                    <div className="chart-label">{months[idx]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upload workspace buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '24px' }}>
          <button className="nav-btn" onClick={() => setShowAddForm(!showAddForm)}>
            <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '6px', fontSize: '20px' }}>add</span>
            {showAddForm ? 'Close Space Editor' : 'Register New Workspace'}
          </button>
        </div>

        {/* Workspace Form (Slide Down Panel) */}
        {showAddForm && (
          <div className="glass-card" style={{ marginBottom: '32px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Workspace Properties Editor</h3>
            <form onSubmit={handleCreateSpaceSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="filter-group">
                  <label className="filter-label">Workspace Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Nexus Hive Desk" 
                    className="input-field" 
                    value={spaceName} 
                    onChange={e => setSpaceName(e.target.value)} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Workspace Type</label>
                  <select 
                    className="input-field" 
                    value={spaceType} 
                    onChange={e => setSpaceType(e.target.value)}
                  >
                    <option value="shared_desk">Shared Desk</option>
                    <option value="private_cabin">Private Suite</option>
                    <option value="meeting_room">Meeting Room</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="filter-group">
                  <label className="filter-label">Capacity (Pax)</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="input-field" 
                    value={spaceCapacity} 
                    onChange={e => setSpaceCapacity(parseInt(e.target.value))} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Area (Sq.Ft.)</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={spaceArea} 
                    onChange={e => setSpaceArea(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Price/Hour ($)</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={spaceHourPrice} 
                    onChange={e => setSpaceHourPrice(parseFloat(e.target.value))} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Price/Day ($)</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={spaceDayPrice} 
                    onChange={e => setSpaceDayPrice(parseFloat(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="filter-group">
                  <label className="filter-label">City Location</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. San Francisco" 
                    className="input-field" 
                    value={spaceLocation} 
                    onChange={e => setSpaceLocation(e.target.value)} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Full Address</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 101 Tech St, CA" 
                    className="input-field" 
                    value={spaceAddress} 
                    onChange={e => setSpaceAddress(e.target.value)} 
                  />
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Culture Tags / Expectations (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. quiet, creative, focused, networking" 
                  className="input-field" 
                  value={spaceExpectations} 
                  onChange={e => setSpaceExpectations(e.target.value)} 
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Description</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  placeholder="Tell clients about the design, target audiences, and equipment..."
                  value={spaceDesc}
                  onChange={e => setSpaceDesc(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Select Workspace Amenities</label>
                <div className="checkbox-grid">
                  {availableAmenitiesList.map(am => (
                    <label key={am} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={spaceAmenities.includes(am)} 
                        onChange={() => handleFormAmenityChange(am)} 
                      />
                      <span>{am}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="nav-btn" style={{ padding: '12px 24px', fontSize: '15px' }}>
                Upload Listing to Platform
              </button>
            </form>
          </div>
        )}

        {/* Booking Requests Inbox */}
        <div className="glass-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Reservation Request Inbox</h3>
          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>No bookings have been requested for your properties.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Workspace</th>
                    <th>Schedule</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Commands</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.user?.full_name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.user?.email}</div>
                      </td>
                      <td>{b.workspace?.name}</td>
                      <td>{b.booking_date} ({b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)})</td>
                      <td>${b.total_price}</td>
                      <td>
                        <span className={`status-indicator ${b.status}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        {b.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="nav-btn" 
                              style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--success)', boxShadow: 'none' }}
                              onClick={() => handleBookingAction(b.id, 'approved')}
                            >
                              Approve
                            </button>
                            <button 
                              className="nav-btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--danger)', color: '#f87171' }}
                              onClick={() => handleBookingAction(b.id, 'rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inquiries Messages Inbox */}
        <div className="glass-card">
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Direct Inquiries & Messaging Inbox</h3>
          {inquiries.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>No user inquiries received.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {inquiries.map(inq => (
                <div key={inq.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <strong>From: {inq.user?.full_name}</strong> ({inq.user?.email})
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Property: <strong>{inq.workspace?.name}</strong>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(inq.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Message:</strong> "{inq.message}"
                  </p>

                  {inq.reply ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ fontSize: '13px', color: '#34d399' }}>
                        <strong>Your Reply:</strong> "{inq.reply}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Type reply message..." 
                        value={replyText[inq.id] || ''}
                        onChange={e => setReplyText({ ...replyText, [inq.id]: e.target.value })}
                      />
                      <button 
                        className="nav-btn" 
                        style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}
                        onClick={() => handleInquiryReplySubmit(inq.id)}
                      >
                        Send Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };

  // ----------------------------------------
  // 3. ADMIN PANEL
  // ----------------------------------------
  const renderAdminPanel = () => {
    return (
      <>
        {/* Admin Summary metrics */}
        <div className="dashboard-grid">
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="metric-value">{metrics?.total_users || 0}</div>
            <div className="metric-title">Platform Customers</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <div className="metric-value">{metrics?.total_owners || 0}</div>
            <div className="metric-title">Space Owners</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="metric-value">{metrics?.total_workspaces || 0}</div>
            <div className="metric-title">Listed Workspaces</div>
          </div>
          <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="metric-value">${metrics?.total_revenue || '0.00'}</div>
            <div className="metric-title">Platform Revenue</div>
          </div>
        </div>

        {/* System telemetry logs / tables */}
        <div className="glass-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Platform-Wide Reservations</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Average Match Conversion Accuracy Score: <strong style={{ color: '#c084fc' }}>{metrics?.booking_conversion_rate || 0}%</strong>
          </p>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Client</th>
                  <th>Workspace</th>
                  <th>Schedule Info</th>
                  <th>Price Charged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>#BK-{b.id}</td>
                    <td>{b.user?.full_name}</td>
                    <td>{b.workspace?.name}</td>
                    <td>{b.booking_date} ({b.start_time.substring(0, 5)})</td>
                    <td>${b.total_price}</td>
                    <td>
                      <span className={`status-indicator ${b.status}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="main-content">
      <div className="glow-blob purple"></div>
      
      <div className="page-header">
        <h1 className="page-title">{user.role.toUpperCase()} DASHBOARD</h1>
        <p className="page-subtitle">Welcome back, {user.full_name}. Monitor transactions, status queues, and expectation matrices.</p>
      </div>

      {user.role === 'admin' && renderAdminPanel()}
      {user.role === 'owner' && renderOwnerPanel()}
      {user.role === 'user' && renderUserPanel()}
    </div>
  );
};
export default Dashboards;
