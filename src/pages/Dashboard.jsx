import React from "react";
import { customers } from "../data/customers";

export default function Dashboard() {

  const flagged = customers.filter(
    c => c.riskScore >= 70
  );

  return (
    <div style={{ padding: 32 }}>
      <h1>Customer Recovery Dashboard</h1>

      <div style={grid}>
        <Stat
          title="Customers Monitored"
          value={customers.length}
        />

        <Stat
          title="High Risk"
          value={flagged.length}
        />

        <Stat
          title="Avg Risk"
          value={
            Math.round(
              customers.reduce(
                (a, b) => a + b.riskScore,
                0
              ) / customers.length
            )
          }
        />
      </div>

      <h2 style={{ marginTop: 40 }}>
        Flagged Customers
      </h2>

      {flagged.map(customer => (
        <div key={customer.id} style={card}>
          <h3>{customer.name}</h3>

          <p>{customer.profileLabel}</p>

          <p>
            Risk Score: {customer.riskScore}
          </p>

          <p>
            Last Purchase:
            {" "}
            {customer.daysSincePurchase}
            {" "}
            days ago
          </p>
        </div>
      ))}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div style={card}>
      <h2>{value}</h2>
      <p>{title}</p>
    </div>
  );
}

const grid = {
  display: "flex",
  gap: 20,
};

const card = {
  background: "#111827",
  padding: 24,
  borderRadius: 12,
  marginBottom: 16,
};