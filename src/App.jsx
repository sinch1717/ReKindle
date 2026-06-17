import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import SignalFeed from './pages/SignalFeed.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Diagnosis from './pages/Diagnosis.jsx';
import WinBack from './pages/WinBack.jsx';
import Analytics from './pages/Analytics.jsx';
import ExtensionSimulator from "./pages/ExtensionSimulator";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/signals" replace />} />
          <Route path="signals" element={<SignalFeed />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="diagnosis/:customerId" element={<Diagnosis />} />
          <Route path="winback/:customerId" element={<WinBack />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="simulator" element={<ExtensionSimulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}