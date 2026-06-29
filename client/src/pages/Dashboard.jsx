import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Chart from 'chart.js/auto';
import { ArrowLeft, BrainCircuit, RefreshCw } from 'lucide-react';

function Dashboard({ setActivePage }) {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [latestRecord, setLatestRecord] = useState(null);
  const [aiInsight, setAiInsight] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [insightLoading, setInsightLoading] = useState(false);
  
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get latest record
      const recordsRes = await authFetch('/api/records?limit=1');
      if (recordsRes.ok) {
        const records = await recordsRes.json();
        if (records && records.length > 0) {
          setLatestRecord(records[0]);
        } else {
          setLatestRecord(null);
        }
      }
      
      // 2. Get AI Insight
      await fetchAIInsight();

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsight = async () => {
    setInsightLoading(true);
    try {
      const insightRes = await authFetch('/api/records/data/ai-insight');
      if (insightRes.ok) {
        const data = await insightRes.json();
        setAiInsight(data.insight);
        setAiProvider(data.provider || '');
      }
    } catch (err) {
      console.error('Error fetching AI insight:', err);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Animate the score when latestRecord changes
  useEffect(() => {
    if (!latestRecord) return;
    
    setAnimatedScore(0);
    const target = latestRecord.energyScore;
    if (target === 0) return;

    let current = 0;
    const intervalTime = Math.max(10, Math.floor(1000 / target)); // Max animation time 1 second
    
    const timer = setInterval(() => {
      current += 1;
      setAnimatedScore(current);
      if (current >= target) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [latestRecord]);

  // Render chart when latestRecord changes
  useEffect(() => {
    if (!latestRecord || !canvasRef.current) return;

    // Destroy existing chart instance if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sleep (hrs)', 'Screen (hrs)', 'Water (gl)', 'Stress (1-10)'],
        datasets: [{
          label: 'Daily Metrics',
          data: [
            latestRecord.sleep,
            latestRecord.screenTime,
            latestRecord.waterIntake,
            latestRecord.stressLevel
          ],
          backgroundColor: ['#22f7ff', '#ff4d4d', '#4dff88', '#ffcc33'],
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#888'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#888'
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [latestRecord]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading dashboard details...</p>
      </div>
    );
  }

  return (
    <section className="page active">
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Your Energy Dashboard</h2>
      
      {!latestRecord ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>
            No energy records found. Complete your first analysis to unlock the dashboard metrics.
          </p>
          <button onClick={() => setActivePage('analysis')}>
            Start Daily Analysis
          </button>
        </div>
      ) : (
        <div className="dashboard">
          <div className="energy-box">
            <span>{animatedScore}</span>
            <p>Energy Score</p>
          </div>

          <div className="chart-container">
            <canvas ref={canvasRef} id="energyChart"></canvas>
          </div>

          <div className="card" style={{ maxWidth: '600px', width: '100%', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#22f7ff' }}>
                <BrainCircuit size={20} /> AI Health Insight
              </h3>
              <button 
                type="button" 
                onClick={fetchAIInsight} 
                disabled={insightLoading}
                className="ghost"
                style={{ width: 'auto', marginTop: 0, padding: '5px 10px', fontSize: '12px' }}
              >
                <RefreshCw size={12} className={insightLoading ? 'spinner' : ''} /> Refresh
              </button>
            </div>
            
            {insightLoading ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Analyzing metrics and retrieving recommendations...</p>
            ) : (
              <>
                <p style={{ lineHeight: '1.6', fontSize: '15px', color: '#eee', textAlign: 'left', margin: '0 0 10px 0', whiteSpace: 'pre-line' }}>
                  {aiInsight}
                </p>
                {aiProvider && (
                  <span style={{ fontSize: '10px', color: '#555', display: 'block', textAlign: 'right' }}>
                    Powered by {aiProvider}
                  </span>
                )}
              </>
            )}

            <button className="ghost" onClick={() => setActivePage('home')}>
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
