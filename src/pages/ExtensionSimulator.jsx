import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SIGNALS = {
  sizeChart: {
    label: "Repeated Size Chart Visits",
    score: 18,
  },

  rageClick: {
    label: "Rage Clicking Detected",
    score: 22,
  },

  checkoutExit: {
    label: "Checkout Abandonment",
    score: 25,
  },

  refundHover: {
    label: "Refund Policy Hover > 60s",
    score: 15,
  },
};

export default function ExtensionSimulator() {
  const navigate = useNavigate();

  const [risk, setRisk] = useState(15);
  const [events, setEvents] = useState([]);

  const addSignal = (signal) => {
    setRisk((prev) => Math.min(prev + signal.score, 100));

    setEvents((prev) => [
      {
        id: Date.now(),
        label: signal.label,
      },
      ...prev,
    ]);
  };

  const flagged = risk >= 70;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
      }}
    >
      {/* WEBSITE */}

      <div
        style={{
          flex: 1,
          padding: 30,
          background: "#ffffff",
          color: "#111",
        }}
      >
        <h1>FashionHub</h1>

        <div
          style={{
            marginTop: 30,
            border: "1px solid #ddd",
            padding: 20,
            borderRadius: 12,
          }}
        >
          <h2>Premium Hoodie</h2>

          <p>$89</p>

          <button
            onClick={() =>
              addSignal(SIGNALS.sizeChart)
            }
          >
            View Size Chart
          </button>

          <button
            style={{
              marginLeft: 10,
            }}
            onClick={() =>
              addSignal(SIGNALS.rageClick)
            }
          >
            Disabled Checkout
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
          }}
        >
          <button
            onClick={() =>
              addSignal(SIGNALS.checkoutExit)
            }
          >
            Exit Checkout
          </button>

          <button
            style={{
              marginLeft: 10,
            }}
            onClick={() =>
              addSignal(SIGNALS.refundHover)
            }
          >
            Read Refund Policy
          </button>
        </div>
      </div>

      {/* EXTENSION */}

      <div
        style={{
          width: 420,
          background: "#0A0F1E",
          color: "white",
          borderLeft: "1px solid #1E2A3A",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: 24,
            borderBottom:
              "1px solid #1E2A3A",
          }}
        >
          <h2>ReKindle Extension</h2>

          <p>
            Live frustration detection
          </p>
        </div>

        <div
          style={{
            padding: 24,
          }}
        >
          <h3>
            Risk Score: {risk}
          </h3>

          <div
            style={{
              height: 8,
              background: "#1E2A3A",
              borderRadius: 10,
              overflow: "hidden",
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: `${risk}%`,
                height: "100%",
                background:
                  risk >= 70
                    ? "#FF4D6D"
                    : "#00E5BF",
              }}
            />
          </div>

          {flagged && (
            <div
              style={{
                marginTop: 20,
                color: "#FF4D6D",
                fontWeight: 700,
              }}
            >
              CUSTOMER FLAGGED
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
          }}
        >
          <h3>Detected Signals</h3>

          {events.map((event) => (
            <div
              key={event.id}
              style={{
                padding: 12,
                background: "#111827",
                marginBottom: 10,
                borderRadius: 10,
              }}
            >
              {event.label}
            </div>
          ))}
        </div>

        {flagged && (
          <div
            style={{
              padding: 24,
            }}
          >
            <button
              onClick={() =>
                navigate("/diagnosis/c1")
              }
              style={{
                width: "100%",
                padding: 14,
                background: "#FF4D6D",
                border: "none",
                borderRadius: 10,
                color: "white",
                cursor: "pointer",
              }}
            >
              Investigate Customer →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}