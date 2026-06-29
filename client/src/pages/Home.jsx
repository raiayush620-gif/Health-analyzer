import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Brain, BarChart3, ShieldCheck } from 'lucide-react';

function Home({ setActivePage }) {
  const { user } = useAuth();

  return (
    <section className="page active">
      <div className="home-container">
        <h1>WHY ARE YOU TIRED?</h1>
        <p className="home-subtitle">
          An intelligent health tracking companion designed to analyze your sleep patterns, stress loads, hydration levels, and screen habits to calculate your daily energy scores and deliver scientific AI insights.
        </p>

        <div className="home-grid">
          <div className="home-feature-card">
            <Activity size={32} />
            <h3>Habit Scoring</h3>
            <p>Input your daily metrics to instantly calculate an energy metric from 0 to 100 based on health formulas.</p>
          </div>

          <div className="home-feature-card">
            <Brain size={32} />
            <h3>AI Recommendations</h3>
            <p>Get personalized health coaching tips powered by Gemini AI and heuristic models customized to your daily parameters.</p>
          </div>

          <div className="home-feature-card">
            <BarChart3 size={32} />
            <h3>Analytics Dashboard</h3>
            <p>Visualize weekly and monthly habits with interactive Chart.js graphs and track your average wellness stats.</p>
          </div>

          <div className="home-feature-card">
            <ShieldCheck size={32} />
            <h3>Secure Syncing</h3>
            <p>Save all logs to a remote MongoDB Atlas database, enabling profile syncing and CSV/PDF report extraction.</p>
          </div>
        </div>

        <div className="home-actions">
          {user ? (
            <button onClick={() => setActivePage('analysis')}>
              Analyze My Energy ➡
            </button>
          ) : (
            <>
              <button onClick={() => setActivePage('auth')}>
                Get Started ➡
              </button>
              <button className="ghost" onClick={() => setActivePage('auth')}>
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Home;
