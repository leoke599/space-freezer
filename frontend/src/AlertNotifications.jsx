import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";

export default function AlertNotifications() {
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    const fetchAlerts = () => {
      axios.get(`${API_BASE_URL}/alerts`)
        .then((res) => {
          // Filter out alerts we've already dismissed in this session
          const newAlerts = res.data.filter(alert => 
            !alert.resolved_at && 
            !alert.is_acknowledged && 
            !dismissedAlerts.has(alert.id)
          );
          setAlerts(newAlerts);
        })
        .catch((err) => console.error("Error fetching alerts:", err));
    };

    fetchAlerts();
    // Check for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  const dismissAlert = (alertId) => {
    // Acknowledge the alert in the backend
    axios.post(`${API_BASE_URL}/alerts/${alertId}/acknowledge`)
      .then(() => {
        // Add to dismissed set
        setDismissedAlerts(prev => new Set([...prev, alertId]));
        // Remove from alerts list
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      })
      .catch((err) => console.error("Error dismissing alert:", err));
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-600";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500 dark:border-yellow-600";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600";
      default:
        return "bg-gray-50 dark:bg-gray-900/30 border-gray-500 dark:border-gray-600";
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "🔔";
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 rounded-lg shadow-lg p-4 animate-slide-in ${getSeverityColor(alert.severity)}`}
          style={{
            animation: "slideIn 0.3s ease-out"
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm uppercase tracking-wide mb-1">
                    {alert.type === "inventory" ? "Inventory Alert" : 
                     alert.type === "temperature" ? "Temperature Alert" : 
                     "System Alert"}
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <div className="text-xs text-muted mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="text-xl hover:bg-black/10 dark:hover:bg-white/10 rounded px-2 transition-colors"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
