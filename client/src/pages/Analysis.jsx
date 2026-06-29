import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2, ArrowLeft, Calendar } from 'lucide-react';

function Analysis({ setActivePage, editRecord, setEditRecord }) {
  const { authFetch } = useAuth();
  
  const [sleep, setSleep] = useState('7');
  const [screen, setScreen] = useState('6');
  const [water, setWater] = useState('5');
  const [stress, setStress] = useState('5');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load record details if we are in edit mode
  useEffect(() => {
    if (editRecord) {
      setSleep(editRecord.sleep.toString());
      setScreen(editRecord.screenTime.toString());
      setWater(editRecord.waterIntake.toString());
      setStress(editRecord.stressLevel.toString());
      if (editRecord.date) {
        setDate(new Date(editRecord.date).toISOString().split('T')[0]);
      }
    }
  }, [editRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        sleep: Number(sleep),
        screenTime: Number(screen),
        waterIntake: Number(water),
        stressLevel: Number(stress),
        date: new Date(date).toISOString(),
      };

      const url = editRecord ? `/api/records/${editRecord._id}` : '/api/records';
      const method = editRecord ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save record');
      }

      setSuccess(editRecord ? 'Record updated successfully!' : 'Energy score calculated and saved!');
      setEditRecord(null); // Clear edit context
      
      setTimeout(() => {
        setActivePage('dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'An error occurred while saving metrics');
      setLoading(false);
    }
  };

  return (
    <section className="page active">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {editRecord ? 'Edit Daily Log' : 'Daily Energy Analysis'}
      </h2>

      <div className="card">
        {error && (
          <div className="auth-message error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-message success">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Date
              </span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sleep">Sleep Hours (recommended 7-9 hrs)</label>
            <input
              type="number"
              id="sleep"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="screen">Screen Time (hours)</label>
            <input
              type="number"
              id="screen"
              value={screen}
              onChange={(e) => setScreen(e.target.value)}
              min="0"
              max="24"
              step="0.5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="water">Water Intake (glasses)</label>
            <input
              type="number"
              id="water"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              min="0"
              max="50"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="stress">Stress Level (1–10)</label>
            <input
              type="number"
              id="stress"
              value={stress}
              onChange={(e) => setStress(e.target.value)}
              min="1"
              max="10"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="mini-spinner"></span> Computing...
              </>
            ) : editRecord ? (
              'Update Daily Metrics'
            ) : (
              'Calculate My Energy'
            )}
          </button>
          
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setEditRecord(null);
              setActivePage('home');
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </form>
      </div>
    </section>
  );
}

export default Analysis;
