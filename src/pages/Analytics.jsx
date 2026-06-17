import React from "react";
import { analyticsData } from "../data/customers";

export default function Analytics() {
  return (
    <div style={{ padding: 32 }}>
      <h1>Recovery Analytics</h1>

      <div style={grid}>
        <Card
          title="Campaigns Sent"
          value={analyticsData.sentThisMonth}
        />

        <Card
          title="Recovered"
          value={analyticsData.recovered}
        />

        <Card
          title="Recovery Rate"
          value={`${analyticsData.recoveryRate}%`}
        />

        <Card
          title="Revenue Recovered"
          value={analyticsData.revenueRecovered}
        />
      </div>

      <h2 style={{ marginTop: 40 }}>
        Recovery by Segment
      </h2>

      {analyticsData.byProfile.map(profile => (
        <div key={profile.profile} style={card}>
          <h3>{profile.profile}</h3>

          <p>
            Recovered:
            {" "}
            {profile.recovered}
          </p>

          <p>
            Recovery Rate:
            {" "}
            {profile.rate}%
          </p>
        </div>
      ))}

      <h2 style={{ marginTop: 40 }}>
        Recent Wins
      </h2>

      {analyticsData.recentWins.map(win => (
        <div key={win.name} style={card}>
          <strong>{win.name}</strong>

          <p>
            Revenue:
            {" "}
            {win.amount}
          </p>
        </div>
      ))}
    </div>
  );
}

function Card({ title, value }) {
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
  flexWrap: "wrap",
};

const card = {
  background: "#111827",
  padding: 24,
  borderRadius: 12,
  marginBottom: 16,
};