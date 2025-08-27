import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

function PlatformPrice({ phoneId, platform, basePrice }) {
  const [priceData, setPriceData] = useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get(
          `/api/phones/${phoneId}/price/${platform}`
        );
        setPriceData(response.data);
      } catch (error) {
        console.error(`Error fetching price for platform ${platform}:`, error);
      }
    };
    fetchPrice();
  }, [phoneId, platform]);

  if (!priceData) return <span className="text-gray-400">Loading...</span>;

  return (
    <span
      className={
        priceData.override ? "text-green-600 font-medium" : "text-gray-600"
      }
    >
      ${priceData.price.toFixed(2)}
      {priceData.override && " (override)"}
    </span>
  );
}

function Catalog() {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("q") || "";
  const condition = searchParams.get("condition") || "";
  const platform = searchParams.get("platform") || "";

  const conditions = [
    "New",
    "Excellent",
    "Good",
    "Fair",
    "As New",
    "Usable",
    "Scrap",
  ];
  const platforms = ["X", "Y", "Z"];

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

  const filteredPhones = phones.filter((phone) => {
    const matchesQuery =
      !query ||
      phone.model_name.toLowerCase().includes(query.toLowerCase()) ||
      phone.brand.toLowerCase().includes(query.toLowerCase());

    const matchesCondition = !condition || phone.condition === condition;

    return matchesQuery && matchesCondition;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newParams = new URLSearchParams();

    const q = formData.get("q");
    const cond = formData.get("condition");
    const plat = formData.get("platform");

    if (q) newParams.set("q", q);
    if (cond) newParams.set("condition", cond);
    if (plat) newParams.set("platform", plat);

    setSearchParams(newParams);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Catalog</h2>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6"
      >
        <input
          name="q"
          className="border rounded px-3 py-2"
          placeholder="Search model or brand"
          defaultValue={query}
        />

        <select
          name="condition"
          className="border rounded px-3 py-2"
          defaultValue={condition}
        >
          <option value="">All conditions</option>
          {conditions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          name="platform"
          className="border rounded px-3 py-2"
          defaultValue={platform}
        >
          <option value="">All platforms</option>
          {platforms.map((p) => (
            <option key={p} value={p}>
              Platform {p}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Brand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Base Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Platforms
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPhones.length > 0 ? (
              filteredPhones.map((phone) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {phone.condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {phone.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${phone.base_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {platforms.map((p) => (
                        <div key={p} className="text-xs">
                          <span className="font-medium">{p}:</span>
                          <PlatformPrice
                            phoneId={phone.id}
                            platform={p}
                            basePrice={phone.base_price}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No phones found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Catalog;
