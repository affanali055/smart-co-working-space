import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

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
  amenities: Amenity[];
}

export const SpaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, showToast, fetchWithAuth } = useAuth();
  
  const [space, setSpace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking states
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Inquiry states
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`/api/spaces/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSpace(data);
        } else {
          showToast('Workspace not found.', 'danger');
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        showToast('Error loading workspace.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [id, navigate]);

  // Check slot availability reactively
  useEffect(() => {
    if (!id || !bookingDate || !startTime || !endTime) {
      setIsAvailable(null);
      return;
    }

    const checkSlot = async () => {
      setCheckingAvailability(true);
      try {
        const res = await fetch(
          `/api/bookings/check-availability?workspace_id=${id}&booking_date=${bookingDate}&start_time=${startTime}:00&end_time=${endTime}:00`
        );
        if (res.ok) {
          const data = await res.json();
          setIsAvailable(data.available);
        }
      } catch (err) {
        console.error("Availability error:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Simple debounce/timeout to avoid spamming calls
    const delay = setTimeout(checkSlot, 300);
    return () => clearTimeout(delay);
  }, [id, bookingDate, startTime, endTime]);

  // Calculate dynamic price
  const calculateTotalCost = () => {
    if (!space || !startTime || !endTime) return 0;
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const durationHours = (endH + endM / 60) - (startH + startM / 60);
    if (durationHours <= 0) return 0;

    const rawCost = durationHours * space.price_per_hour;
    // Capping at daily rate if booking is long (6+ hours)
    const cost = durationHours >= 6 ? Math.min(rawCost, space.price_per_day) : rawCost;
    return Math.round(cost * 100) / 100;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in or register to schedule a workspace.', 'warning');
      navigate('/login');
      return;
    }

    if (isAvailable === false) {
      showToast('The selected time slot is already booked.', 'warning');
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await fetchWithAuth('/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: space?.id,
          booking_date: bookingDate,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
        }),
      });

      if (res.ok) {
        showToast('Booking request submitted! Waiting for owner approval.', 'success');
        setShowSuccessModal(true);
      } else {
        const errData = await res.json();
        showToast(errData.detail || 'Failed to request booking.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'danger');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (!space) return;
    const whatsappNumber = '9380747558';
    const formattedPhone = whatsappNumber.startsWith('91') ? whatsappNumber : `91${whatsappNumber}`;
    const price = calculateTotalCost();
    const customerName = user?.full_name || 'Customer';
    const customerEmail = user?.email || 'N/A';
    
    const message = `Hello! I have requested a workspace booking on Smart Co-working Space:\n\n` +
      `🏢 *Workspace:* ${space.name}\n` +
      `📅 *Date:* ${bookingDate}\n` +
      `⏰ *Time:* ${startTime} - ${endTime}\n` +
      `💰 *Total Price:* $${price}\n` +
      `👤 *Customer:* ${customerName} (${customerEmail})\n\n` +
      `Please review and approve my booking. Thank you!`;
      
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Close the modal and navigate to the dashboard
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to contact the space manager.', 'warning');
      navigate('/login');
      return;
    }

    if (!inquiryMsg.trim()) return;

    setSubmittingInquiry(true);
    try {
      const res = await fetchWithAuth('/api/inquiries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: space?.id,
          message: inquiryMsg,
        }),
      });

      if (res.ok) {
        showToast('Inquiry sent! The space manager will reply soon.', 'success');
        setInquiryMsg('');
        navigate('/dashboard');
      } else {
        showToast('Failed to send inquiry.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.', 'danger');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', animation: 'spin 2s linear infinite' }}>sync</span>
        <p style={{ marginTop: '12px' }}>Loading workspace details...</p>
      </div>
    );
  }

  if (!space) return null;

  const totalCost = calculateTotalCost();

  return (
    <div className="main-content">
      <div className="glow-blob blue" style={{ top: '20%' }}></div>
      
      {/* Breadcrumbs */}
      <div style={{ marginBottom: '24px' }}>
        <Link to="/" style={{ color: '#60a5fa', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Back to Explorations
        </Link>
      </div>

      <div className="detail-container">
        {/* Left Side: Space Information */}
        <div>
          <img 
            src={space.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'} 
            alt={space.name} 
            className="detail-img" 
          />
          
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>{space.name}</h1>
          
          <div className="space-loc" style={{ fontSize: '15px', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>location_on</span>
            {space.address}, {space.location}
          </div>

          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>info</span>
              About the Workspace
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              {space.description}
            </p>

            <div className="space-specs" style={{ marginTop: '24px', borderBottom: 'none', paddingBottom: '0' }}>
              <div className="spec-item" style={{ fontSize: '15px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>groups</span>
                <strong>Capacity:</strong> Up to {space.capacity} Persons
              </div>
              <div className="spec-item" style={{ fontSize: '15px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>square_foot</span>
                <strong>Area Size:</strong> {space.area_size} Sq.Ft.
              </div>
              <div className="spec-item" style={{ fontSize: '15px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>style</span>
                <strong>Workspace Type:</strong> {space.type.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>room_service</span>
              Provided Amenities
            </h3>
            <div className="amenities-list">
              {space.amenities.map(am => (
                <div key={am.id} className="amenity-chip">
                  <span className="material-symbols-outlined">{am.icon || 'star'}</span>
                  {am.name}
                </div>
              ))}
            </div>
          </div>

          {/* Expectations/Workstyle Tags */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>psychology</span>
              Space Expectations & Culture
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              This workspace cultivates a environment best matching the following work styles:
            </p>
            <div className="style-tags">
              {space.expectations.split(',').filter(x => x.trim()).map(tag => (
                <span key={tag} className="style-tag">#{tag.trim()}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Reservation & Inquiries Forms */}
        <aside>
          {/* Booking Scheduler Widget */}
          <div className="glass-card" style={{ marginBottom: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Reserve Space</h3>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="filter-group">
                <label className="filter-label">Select Date</label>
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field" 
                  value={bookingDate} 
                  onChange={e => setBookingDate(e.target.value)} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="filter-group">
                  <label className="filter-label">From</label>
                  <input 
                    type="time" 
                    required 
                    className="input-field" 
                    value={startTime} 
                    onChange={e => setStartTime(e.target.value)} 
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">To</label>
                  <input 
                    type="time" 
                    required 
                    className="input-field" 
                    value={endTime} 
                    onChange={e => setEndTime(e.target.value)} 
                  />
                </div>
              </div>

              {/* Slot availability status bar */}
              {bookingDate && (
                <div style={{ marginBottom: '20px', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {checkingAvailability ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 2s linear infinite' }}>sync</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Checking scheduler status...</span>
                    </>
                  ) : isAvailable === true ? (
                    <>
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: '20px' }}>check_circle</span>
                      <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '600' }}>Slot is Available</span>
                    </>
                  ) : isAvailable === false ? (
                    <>
                      <span className="material-symbols-outlined" style={{ color: 'var(--danger)', fontSize: '20px' }}>cancel</span>
                      <span style={{ fontSize: '13px', color: '#f87171', fontWeight: '600' }}>Slot already Booked</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enter valid times to verify</span>
                  )}
                </div>
              )}

              {/* Pricing breakdown */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '14px' }}>
                  <span>Price Rate</span>
                  <span>${space.price_per_hour}/hr</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px' }}>
                  <span>Capped Daily Max</span>
                  <span>${space.price_per_day}/day</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                  <span>Estimated Total</span>
                  <span style={{ color: '#60a5fa' }}>${totalCost > 0 ? totalCost : '0.00'}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="nav-btn" 
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
                disabled={submittingBooking || isAvailable === false || checkingAvailability || !bookingDate}
              >
                {submittingBooking ? 'Submitting Reservation...' : 'Request Workspace Booking'}
              </button>
            </form>
          </div>

          {/* expectation matching inquiry card */}
          <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Send Direct Inquiry</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Have custom expectations, catering needs, or scheduling questions? Message the space provider directly.
            </p>
            
            <form onSubmit={handleInquirySubmit}>
              <div className="filter-group">
                <textarea 
                  className="input-field" 
                  rows={4} 
                  required
                  placeholder="Enter details about your team workstyle or booking questions..."
                  value={inquiryMsg}
                  onChange={e => setInquiryMsg(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="nav-btn-secondary" 
                style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                disabled={submittingInquiry || !inquiryMsg.trim()}
              >
                {submittingInquiry ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </aside>
      </div>
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>check_circle</span>
            </div>
            <h2 className="modal-title">Booking Requested!</h2>
            <p className="modal-text">
              Your reservation for <strong>{space.name}</strong> on <strong>{bookingDate}</strong> ({startTime} - {endTime}) has been submitted.
              <br /><br />
              Please click below to notify the manager on WhatsApp to finalize your booking.
            </p>
            <div className="modal-actions">
              <button onClick={handleWhatsAppRedirect} className="whatsapp-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.473 1.332 4.986L2 22l5.162-1.355c1.47.801 3.125 1.222 4.838 1.222 5.506 0 9.988-4.482 9.988-9.988a9.92 9.92 0 0 0-2.924-7.064A9.92 9.92 0 0 0 12.012 2zm5.726 14.123c-.237.668-1.378 1.282-1.92 1.338-.521.055-1.018.257-3.322-.693-2.946-1.214-4.836-4.209-4.984-4.407-.147-.197-1.196-1.593-1.196-3.04s.762-2.155 1.033-2.437c.271-.282.592-.352.79-.352.197 0 .395.003.564.011.178.008.417-.068.654.502.243.587.824 2.008.892 2.149.068.14.113.305.02.492-.092.187-.138.305-.274.464-.135.158-.285.352-.407.473-.135.135-.276.282-.12.548.156.265.694 1.139 1.488 1.846.993.882 1.826 1.157 2.083 1.264.257.107.406.09.559-.085.152-.175.654-.762.829-1.021.175-.259.35-.214.592-.124.243.09 1.541.727 1.806.86.265.133.44.203.508.319.068.116.068.67-.169 1.338z"/>
                </svg>
                Send WhatsApp Alert
              </button>
              <button 
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/dashboard');
                }} 
                className="nav-btn-secondary"
                style={{ padding: '12px' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SpaceDetail;
