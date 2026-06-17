import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customers } from "../data/customers";
import { colors, radius } from "../styles/theme";

export default function Diagnosis() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const customer = customers.find(c => c.id === customerId);

  if (!customer) return <div>Customer not found</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>{customer.name}</h1>
      <p>{customer.profileLabel}</p>

      <div style={card}>
        <h3>Risk Score</h3>
        <h2 style={{ color: colors.accentRed }}>
          {customer.riskScore}
        </h2>
      </div>

      <div style={card}>
        <h3>Signals Detected</h3>

        {customer.signals.map((signal, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <strong>{signal.label}</strong>
            <br />
            {signal.value}
          </div>
        ))}
      </div>

      <div style={card}>
        <h3>AI Diagnosis</h3>
        <p>{customer.reasoning}</p>
      </div>

      <button
        style={button}
        onClick={() => navigate(`/winback/${customer.id}`)}
      >
        Generate Recovery Plan →
      </button>
    </div>
  );
}

const card = {
  background: "#111827",
  padding: 24,
  marginBottom: 20,
  borderRadius: radius.lg,
};

const button = {
  padding: "12px 24px",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};