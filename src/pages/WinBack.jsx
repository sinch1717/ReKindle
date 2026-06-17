import React from "react";
import { useParams } from "react-router-dom";
import { customers } from "../data/customers";
import { radius } from "../styles/theme";

export default function WinBack() {
  const { customerId } = useParams();

  const customer = customers.find(c => c.id === customerId);

  if (!customer) return <div>Not found</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>Recovery Strategy</h1>

      <h2>{customer.name}</h2>

      {customer.winBackSequence.map((step) => (
        <div key={step.step} style={card}>
          <h3>
            Step {step.step} • {step.timing}
          </h3>

          <p>
            <strong>Subject:</strong> {step.subject}
          </p>

          <p>
            <strong>Tone:</strong> {step.tone}
          </p>

          <p>
            <strong>CTA:</strong> {step.cta}
          </p>

          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: "#0A0F1E",
              borderRadius: 10,
              whiteSpace: "pre-wrap",
            }}
          >
            {step.body}
          </div>
        </div>
      ))}
    </div>
  );
}

const card = {
  background: "#111827",
  padding: 24,
  borderRadius: radius.lg,
  marginBottom: 20,
};