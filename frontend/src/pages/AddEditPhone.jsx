import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

function AddEditPhone() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    model_name: "",
    brand: "",
    condition: "",
    storage: "",
    color: "",
    base_price: "",
    stock_quantity: "",
    discontinued: false,
    tags: "",
  });

  const [loading, setLoading] = useState(isEdit);
  const [errors, setErrors] = useState({});

  const conditions = [
    "New",
    "Excellent",
    "Good",
    "Fair",
    "As New",
    "Usable",
    "Scrap",
  ];

  useEffect(() => {
    if (isEdit) {
      fetchPhone();
    }
  }, [id, isEdit]);

  const fetchPhone = async () => {
    try {
      const response = await axios.get(`/api/phones/${id}?admin=1`);
      const phone = response.data;
      setFormData({
        model_name: phone.model_name || "",
        brand: phone.brand || "",
        condition: phone.condition || "",
        storage: phone.storage || "",
        color: phone.color || "",
        base_price: phone.base_price || "",
        stock_quantity: phone.stock_quantity || "",
        discontinued: phone.discontinued || false,
        tags: Array.isArray(phone.tags)
          ? phone.tags.join(", ")
          : phone.tags || "",
      });
    } catch (error) {
      console.error("Error fetching phone:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.model_name.trim())
      newErrors.model_name = "Model name is required";
    if (!formData.brand.trim()) newErrors.brand = "Brand is required";
    if (!formData.condition) newErrors.condition = "Condition is required";
    if (
      !formData.base_price ||
      isNaN(formData.base_price) ||
      formData.base_price <= 0
    ) {
      newErrors.base_price = "Valid base price is required";
    }
    if (
      !formData.stock_quantity ||
      isNaN(formData.stock_quantity) ||
      formData.stock_quantity < 0
    ) {
      newErrors.stock_quantity = "Valid stock quantity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        stock_quantity: parseInt(formData.stock_quantity),
      };

      if (isEdit) {
        await axios.put(`/api/phones/${id}?admin=1`, submitData, {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await axios.post("/api/phones?admin=1", submitData, {
          headers: { "Content-Type": "application/json" },
        });
      }

      navigate("/admin?admin=1");
    } catch (error) {
      console.error("Error saving phone:", error);
      const errorMessage =
        error.response?.data?.error || "Error saving phone. Please try again.";
      alert(errorMessage);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold">
            {isEdit ? "Edit Phone" : "Add New Phone"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Model Name
              </label>
              <input
                type="text"
                name="model_name"
                value={formData.model_name}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.model_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.model_name && (
                <p className="text-red-500 text-sm mt-1">{errors.model_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.brand ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.brand && (
                <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.condition ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select condition</option>
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="text-red-500 text-sm mt-1">{errors.condition}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Storage</label>
              <input
                type="text"
                name="storage"
                value={formData.storage}
                onChange={handleChange}
                placeholder="e.g., 128GB"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., Black"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Base Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  className={`w-full border rounded px-8 py-2 ${
                    errors.base_price ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.base_price && (
                <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className={`w-full border rounded px-3 py-2 ${
                  errors.stock_quantity ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.stock_quantity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.stock_quantity}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., flagship, popular, discontinued"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="discontinued"
                checked={formData.discontinued}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium">Discontinued</span>
            </label>
          </div>

          <div className="flex justify-between">
            <Link
              to="/admin?admin=1"
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEdit ? "Update Phone" : "Add Phone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEditPhone;
