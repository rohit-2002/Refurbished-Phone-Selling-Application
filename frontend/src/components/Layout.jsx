import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function Layout({ children }) {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = "info") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    }, 5000);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const alertColors = {
    success: "bg-green-100 border-green-400 text-green-700",
    danger: "bg-red-100 border-red-400 text-red-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
    info: "bg-blue-100 border-blue-400 text-blue-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold">
              Phone Inventory
            </Link>
            <div className="flex space-x-4">
              <Link to="/" className="hover:text-gray-300">
                Catalog
              </Link>
              <Link to="/admin?admin=1" className="hover:text-gray-300">
                Admin
              </Link>
              <Link to="/logs?admin=1" className="hover:text-gray-300">
                Logs
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border px-4 py-3 rounded mb-4 ${
              alertColors[alert.type]
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{alert.message}</span>
              <button
                onClick={() => removeAlert(alert.id)}
                className="ml-4 text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

export default Layout;
