import React, { useState, useEffect } from 'react';
import {
  fetchCareerEventsApi,
  registerForCareerEventApi,
  cancelCareerEventRegistrationApi,
  createCareerEventApi,
  updateCareerEventApi,
  fetchEventRegistrationsApi,
} from '../../services/api';
import {
  CareerEventData,
  CareerEventType,
  EventRegistrationData,
} from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building,
  Sparkles,
  Award,
  Layers,
  X,
  UserCheck,
} from 'lucide-react';

interface CareerEventsViewProps {
  token: string | null;
  userRole?: string;
  userId?: string;
}

const EVENT_CATEGORIES: Array<{ label: string; value: string }> = [
  { label: 'All Categories', value: 'ALL' },
  { label: 'Workshops', value: 'WORKSHOP' },
  { label: 'Webinars', value: 'WEBINAR' },
  { label: 'Hackathons', value: 'HACKATHON' },
  { label: 'Career Fairs', value: 'CAREER_FAIR' },
  { label: 'Interview Drives', value: 'INTERVIEW_DRIVE' },
  { label: 'Training Sessions', value: 'TRAINING_SESSION' },
];

export const CareerEventsView: React.FC<CareerEventsViewProps> = ({
  token,
  userRole,
  userId,
}) => {
  const [events, setEvents] = useState<CareerEventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_REGISTRATIONS' | 'MANAGE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [attendeeEvent, setAttendeeEvent] = useState<CareerEventData | null>(null);
  const [attendees, setAttendees] = useState<EventRegistrationData[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState<boolean>(false);

  // Action states
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'WORKSHOP' as CareerEventType,
    startAt: '',
    endAt: '',
    location: 'Virtual / Google Meet',
    meetingUrl: '',
    registrationDeadline: '',
    capacity: 100,
    status: 'PUBLISHED' as any,
    tags: '',
  });

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, activeTab]);

  const loadEvents = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchCareerEventsApi(
        {
          eventType: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          search: search.trim() || undefined,
        },
        token
      );
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to load career events');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    setProcessingEventId(eventId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await registerForCareerEventApi(eventId, token);
      if (res.success) {
        setSuccessMessage('Registration confirmed! A confirmation notification has been sent.');
        // Update local state
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isRegistered: true, registeredCount: e.registeredCount + 1 }
              : e
          )
        );
      } else {
        setErrorMessage(res.error?.message || 'Failed to register for event');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during registration');
    } finally {
      setProcessingEventId(null);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to cancel your event registration?')) return;
    setProcessingEventId(eventId);
    setErrorMessage(null);
    try {
      const res = await cancelCareerEventRegistrationApi(eventId, token);
      if (res.success) {
        setSuccessMessage('Event registration cancelled.');
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isRegistered: false, registeredCount: Math.max(0, e.registeredCount - 1) }
              : e
          )
        );
      } else {
        setErrorMessage(res.error?.message || 'Failed to cancel registration');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error cancelling registration');
    } finally {
      setProcessingEventId(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const payload: Partial<CareerEventData> = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        location: formData.location,
        meetingUrl: formData.meetingUrl || undefined,
        registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
        capacity: Number(formData.capacity) || 0,
        status: formData.status,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await createCareerEventApi(payload, token);
      if (res.success && res.data) {
        setSuccessMessage('Career event created successfully!');
        setShowCreateModal(false);
        setEvents((prev) => [res.data!, ...prev]);
        setFormData({
          title: '',
          description: '',
          eventType: 'WORKSHOP',
          startAt: '',
          endAt: '',
          location: 'Virtual / Google Meet',
          meetingUrl: '',
          registrationDeadline: '',
          capacity: 100,
          status: 'PUBLISHED',
          tags: '',
        });
      } else {
        setErrorMessage(res.error?.message || 'Failed to create event');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting event form');
    }
  };

  const handleViewAttendees = async (event: CareerEventData) => {
    setAttendeeEvent(event);
    setLoadingAttendees(true);
    try {
      const res = await fetchEventRegistrationsApi(event.id, token);
      if (res.success && res.data) {
        setAttendees(res.data);
      }
    } catch {
      //
    } finally {
      setLoadingAttendees(false);
    }
  };

  const isOrganizer = userRole === 'COLLEGE' || userRole === 'EMPLOYER' || userRole === 'ADMIN';

  // Filter events based on active tab
  const displayedEvents = events.filter((ev) => {
    if (activeTab === 'MY_REGISTRATIONS') {
      return ev.isRegistered;
    }
    if (activeTab === 'MANAGE') {
      return ev.organizerId === userId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
              Campus & Off-Campus Hiring Events
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live & Interactive
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Career Events & Workshops</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Attend hiring webinars, technical workshops, hackathons, and mock interview drives organized by colleges, recruiters, and industry mentors.
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Host Career Event
          </button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs & Category Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Events ({events.length})
            </button>
            {userRole === 'STUDENT' && (
              <button
                onClick={() => setActiveTab('MY_REGISTRATIONS')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'MY_REGISTRATIONS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                My Registrations ({events.filter((e) => e.isRegistered).length})
              </button>
            )}
            {isOrganizer && (
              <button
                onClick={() => setActiveTab('MANAGE')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'MANAGE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                My Hosted Events
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
                placeholder="Search events..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading career events...</div>
        ) : displayedEvents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No career events found</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              There are no events matching your current filter criteria. Check back soon or host a session.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedEvents.map((event) => {
              const isDeadlinePassed = new Date(event.registrationDeadline).getTime() < Date.now();
              const isFull = event.capacity > 0 && event.registeredCount >= event.capacity;
              const isMyEvent = event.organizerId === userId;

              return (
                <div
                  key={event.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between p-5 shadow-lg group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                        {event.eventType}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          event.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {event.title}
                    </h3>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      Hosted by {event.organizerName || 'College Placement Desk'}
                    </p>

                    <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata block */}
                    <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {new Date(event.startAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {event.capacity > 0
                            ? `${event.registeredCount} / ${event.capacity} seats filled`
                            : `${event.registeredCount} registered (Unlimited)`}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {isMyEvent ? (
                      <button
                        type="button"
                        onClick={() => handleViewAttendees(event)}
                        className="w-full text-center py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> View Attendees ({event.registeredCount})
                      </button>
                    ) : event.isRegistered ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Registered
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancelRegistration(event.id)}
                          disabled={processingEventId === event.id}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isDeadlinePassed ? (
                      <span className="text-xs text-slate-500 italic">Registration Closed</span>
                    ) : isFull ? (
                      <span className="text-xs text-amber-500 font-medium">Event Full</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(event.id)}
                        disabled={processingEventId === event.id}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-md"
                      >
                        {processingEventId === event.id ? 'Registering...' : 'Register for Event'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> Host Career Event
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Masterclass: Cracking Product Company Interviews"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Type *</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value as CareerEventType })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WORKSHOP">Workshop</option>
                    <option value="WEBINAR">Webinar</option>
                    <option value="HACKATHON">Hackathon</option>
                    <option value="CAREER_FAIR">Career Fair</option>
                    <option value="INTERVIEW_DRIVE">Interview Drive</option>
                    <option value="TRAINING_SESSION">Training Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity (0 = unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide comprehensive details about the curriculum, expectations, and benefits..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location or Platform *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Virtual / Google Meet"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Meeting Link (optional)</label>
                <input
                  type="url"
                  value={formData.meetingUrl}
                  onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                  placeholder="https://meet.google.com/xyz-1234-abc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="React, Interviews, DSA, Cloud"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Attendees Modal */}
      {attendeeEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Registered Attendees</h3>
                <p className="text-xs text-slate-400">{attendeeEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setAttendeeEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {loadingAttendees ? (
                <div className="py-8 text-center text-slate-500 text-xs">Loading attendee list...</div>
              ) : attendees.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No students have registered for this event yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Student Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Course / College</th>
                      <th className="p-2.5 rounded-r-lg">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {attendees.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-white">
                          {att.studentSnapshot?.fullName || 'Student'}
                        </td>
                        <td className="p-2.5 text-slate-400">{att.studentSnapshot?.email || '-'}</td>
                        <td className="p-2.5">
                          {att.studentSnapshot?.course || att.studentSnapshot?.collegeName || '-'}
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(att.registeredAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
