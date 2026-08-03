import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div style={{ padding: "30px", background: "#0f172a", color: "#f1f5f9", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#38bdf8" }}>⚡ Price Pilot Dashboard</h1>
      <p style={{ color: "#94a3b8" }}>Aapke tracked products aur unka live stock / pickup status:</p>

      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={{ marginTop: "20px" }}>Koi product nahi mila. Neeche se naya product add karein!</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginTop: "30px" }}>
          {products.map((product) => (
            <div key={product._id} style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>{product.name}</h3>
              <p style={{ margin: "5px 0", color: "#94a3b8" }}><b>Store:</b> {product.store || "General"}</p>
              <p style={{ margin: "5px 0", fontSize: "18px", color: "#4ade80" }}><b>Price:</b> ₹{product.price}</p>
              
              {/* Stock Status Badge */}
              <div style={{ margin: "15px 0" }}>
                {product.inStock ? (
                  <span style={{ background: "#22c55e", color: "#000", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px" }}>
                    🟢 In Stock / Pickup Available
                  </span>
                ) : (
                  <span style={{ background: "#ef4444", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", fontSize: "12px" }}>
                    🔴 Out of Stock
                  </span>
                )}
              </div>

              {/* Available Pincodes if any */}
              {product.availablePincodes && product.availablePincodes.length > 0 && (
                <p style={{ fontSize: "13px", color: "#38bdf8", background: "#0f172a", padding: "8px", borderRadius: "6px" }}>
                  <b>Available Pincodes:</b> {product.availablePincodes.join(", ")}
                </p>
              )}

              <div style={{ marginTop: "15px" }}>
                <a 
                  href={product.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ background: "#2563eb", color: "white", padding: "8px 16px", textDecoration: "none", borderRadius: "6px", fontWeight: "bold", display: "inline-block", fontSize: "14px" }}
                >
                  🛒 Check Store / Order
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;