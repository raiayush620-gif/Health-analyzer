import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import { Search, Filter, X, Edit2, Trash2, FileText, ArrowLeft, Calendar } from 'lucide-react';

function History({ setActivePage, setEditRecord }) {
  const { authFetch, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (minScore) params.append('minScore', minScore);
      if (maxScore) params.append('maxScore', maxScore);
      params.append('sortBy', sortBy);

      const res = await authFetch(`/api/records?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [sortBy]); // Refetch automatically when sort changes, use manual submit button for the others or refetch

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setMinScore('');
    setMaxScore('');
    setSortBy('newest');
    // We can fetch directly with default values
    setTimeout(() => {
      fetchRecords();
    }, 0);
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this wellness record?')) return;
    try {
      const res = await authFetch(`/api/records/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRecords(records.filter(r => r._id !== id));
      } else {
        alert('Failed to delete the record');
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  const handleEditRecord = (record) => {
    setEditRecord(record);
    setActivePage('analysis');
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  const exportPDF = () => {
    if (records.length === 0) return;

    const doc = new jsPDF();
    const primaryColor = [34, 247, 255]; // Cyan
    const darkBg = [11, 15, 31];

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("Energy History Report", 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated for: ${user?.username} (${user?.email})`, 14, 27);
    doc.text(`Date of Report: ${new Date().toLocaleString()}`, 14, 32);

    // Table Header
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(14, 40, 182, 8, "F");
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    
    doc.text("Date Logged", 17, 45);
    doc.text("Sleep (h)", 55, 45);
    doc.text("Screen (h)", 85, 45);
    doc.text("Water (gl)", 115, 45);
    doc.text("Stress (1-10)", 145, 45);
    doc.text("Energy Score", 172, 45);

    // Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50); // Dark grey text for readability in print
    
    let y = 54;
    records.forEach((r, idx) => {
      // Draw grid line
      doc.setDrawColor(230, 230, 230);
      doc.line(14, y + 2, 196, y + 2);

      const dateStr = new Date(r.date).toLocaleDateString();
      doc.text(dateStr, 17, y);
      doc.text(`${r.sleep} hrs`, 55, y);
      doc.text(`${r.screenTime} hrs`, 85, y);
      doc.text(`${r.waterIntake} glasses`, 115, y);
      doc.text(`${r.stressLevel}/10`, 145, y);
      
      // Print score bold
      doc.setFont('helvetica', 'bold');
      doc.text(`${r.energyScore}/100`, 172, y);
      doc.setFont('helvetica', 'normal');

      y += 10;
      // Add a page if table grows too long
      if (y > 275 && idx < records.length - 1) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`energy-report-${user?.username}.pdf`);
  };

  return (
    <section className="page active">
      <div className="history-container">
        <div className="history-header">
          <h2>Energy History Logs</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              onClick={exportPDF} 
              disabled={records.length === 0}
              className="success"
              style={{ width: 'auto', marginTop: 0 }}
            >
              <FileText size={16} /> Export PDF Report
            </button>
            <button 
              className="ghost" 
              onClick={() => setActivePage('home')}
              style={{ width: 'auto', marginTop: 0 }}
            >
              <ArrowLeft size={16} /> Home
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <form onSubmit={handleApplyFilters} className="filter-card">
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#22f7ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} /> Search & Filter Parameters
          </h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>Min Energy Score</label>
              <input type="number" min="0" max="100" placeholder="e.g. 50" value={minScore} onChange={e => setMinScore(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>Max Energy Score</label>
              <input type="number" min="0" max="100" placeholder="e.g. 90" value={maxScore} onChange={e => setMaxScore(e.target.value)} />
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highestScore">Highest Score</option>
                <option value="lowestScore">Lowest Score</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="button" className="ghost" onClick={handleClearFilters}>
              <X size={14} /> Clear
            </button>
            <button type="submit">
              <Search size={14} /> Apply Filters
            </button>
          </div>
        </form>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Retrieving wellness logs...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-history">
            <p style={{ margin: 0 }}>No wellness entries found matching the filter parameters.</p>
            <button 
              type="button" 
              onClick={() => setActivePage('analysis')} 
              style={{ width: 'auto', margin: '15px auto 0 auto' }}
            >
              Log Daily Energy
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sleep (h)</th>
                  <th>Screen (h)</th>
                  <th>Water (gl)</th>
                  <th>Stress (1-10)</th>
                  <th>Energy Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>{record.sleep}</td>
                    <td>{record.screenTime}</td>
                    <td>{record.waterIntake}</td>
                    <td>{record.stressLevel}</td>
                    <td>
                      <span className={`score-badge ${getScoreClass(record.energyScore)}`}>
                        {record.energyScore}/100
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => handleEditRecord(record)}
                          title="Edit Log"
                          style={{ padding: '6px' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeleteRecord(record._id)}
                          title="Delete Log"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default History;
