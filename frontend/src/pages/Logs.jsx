import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get("/api/logs?admin=1");
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      // For demo purposes, set empty array
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // Since backend now sends pre-formatted IST string, just return it as-is
    return dateString || "N/A";
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Listing Logs</h2>
        <Link
          to="/admin?admin=1"
          className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
        >
          Back to Admin
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Platform
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Message
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.phone ? (
                      <div>
                        {log.phone.brand} {log.phone.model_name}
                        <div className="text-xs text-gray-500">
                          ID: {log.phone_id}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        Phone ID: {log.phone_id}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {log.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        log.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.attempted_price
                      ? `$${log.attempted_price.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.fee ? `$${log.fee.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{log.message || ""}</div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Logs;
