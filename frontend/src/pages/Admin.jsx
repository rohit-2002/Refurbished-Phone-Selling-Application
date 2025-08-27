import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Admin() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});

  useEffect(() => {
    fetchPhones();
  }, []);

  const fetchPhones = async () => {
    try {
      const response = await axios.get("/api/phones");
      setPhones(response.data);
    } catch (error) {
      console.error("Error fetching phones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (phoneId) => {
    if (!confirm("Delete this phone?")) return;

    try {
      await axios.delete(`/api/phones/${phoneId}`, {
        headers: { "X-ADMIN": "1" },
      });
      setPhones(phones.filter((p) => p.id !== phoneId));
    } catch (error) {
      console.error("Error deleting phone:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Error deleting phone. Please try again.";
      alert(errorMessage);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("/api/bulk_upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-ADMIN": "1",
        },
      });

      if (response.data.success) {
        const successCount = response.data.success_count || "All";
        const errorCount = response.data.errors
          ? response.data.errors.length
          : 0;
        let message = `Bulk upload successful! ${successCount} phones processed.`;
        if (errorCount > 0) {
          message += ` ${errorCount} errors occurred (check console for details).`;
          console.log("Upload errors:", response.data.errors);
        }
        alert(message);
      } else {
        alert(
          `Upload completed with issues: ${
            response.data.message || "Unknown error"
          }`
        );
      }

      setShowBulkModal(false);
      setSelectedFile(null);
      fetchPhones(); // Refresh the list
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Error uploading file. Please try again.";
      alert(errorMessage);
    }
  };

  const handleListPhone = async (phoneId, platform) => {
    try {
      const overrideKey = `${phoneId}-${platform}`;
      const overridePrice = priceOverrides[overrideKey];

      const formData = new FormData();
      if (overridePrice) {
        formData.append("override_price", overridePrice);
      }

      const response = await axios.post(
        `/list/${phoneId}/${platform}`,
        formData,
        {
          headers: { "X-ADMIN": "1" },
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
      } else {
        alert(`❌ ${response.data.message}`);
      }

      fetchPhones(); // Refresh to update stock if needed
    } catch (error) {
      console.error("Error listing phone:", error);
      const errorMessage =
        error.response?.data?.message ||
        `Error listing phone on platform ${platform}. Please try again.`;
      alert(`❌ ${errorMessage}`);
    }
  };

  const handleUpdatePrices = async () => {
    if (
      !confirm(
        "This will recalculate all platform-specific prices based on current market data. Continue?"
      )
    ) {
      return;
    }

    try {
      const response = await axios.post(
        "/api/update-prices",
        {},
        {
          headers: { "X-ADMIN": "1" },
        }
      );

      if (response.data.success) {
        const updatedCount = response.data.updated_count || 0;
        alert(
          `✅ Price update successful! ${updatedCount} phones updated with new pricing.`
        );
        fetchPhones(); // Refresh the list to show updated prices
      } else {
        alert(
          `❌ Price update failed: ${response.data.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Error updating prices. Please try again.";
      alert(`❌ ${errorMessage}`);
    }
  };

  const getConditionBadgeColor = (condition) => {
    if (condition === "New") return "bg-green-100 text-green-800";
    if (["Good", "Excellent", "As New"].includes(condition))
      return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStockBadgeColor = (stock) => {
    return stock > 0
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <div className="flex space-x-2">
          <Link
            to="/phone/add?admin=1"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Phone
          </Link>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Bulk Upload
          </button>
          <button
            onClick={handleUpdatePrices}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Update Prices
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Base Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Platform Prices
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {phones.length > 0 ? (
              phones.map((phone) => (
                <tr key={phone.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {phone.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {phone.model_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {phone.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getConditionBadgeColor(
                        phone.condition
                      )}`}
                    >
                      {phone.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStockBadgeColor(
                        phone.stock_quantity
                      )}`}
                    >
                      {phone.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${phone.base_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {["X", "Y", "Z"].map((platform) => (
                        <div
                          key={platform}
                          className="flex items-center space-x-2"
                        >
                          <span className="text-xs w-4">{platform}:</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Override"
                            className="w-20 px-2 py-1 text-xs border rounded"
                            onChange={(e) =>
                              setPriceOverrides((prev) => ({
                                ...prev,
                                [`${phone.id}-${platform}`]: e.target.value,
                              }))
                            }
                          />
                          <button
                            disabled={phone.stock_quantity === 0}
                            onClick={() => handleListPhone(phone.id, platform)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                          >
                            List
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link
                        to={`/phone/${phone.id}/edit?admin=1`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(phone.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No phones in inventory
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Bulk Upload CSV</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleBulkUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <strong>Expected CSV columns:</strong>
                <br />
                model_name, brand, condition, storage, color, base_price,
                stock_quantity, tags
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
