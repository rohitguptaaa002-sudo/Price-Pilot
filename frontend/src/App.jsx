import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./App.css";


const API_URL = "http://localhost:3000";
function App(){
  const [name, setName] = useState("");
  const [store, setStore] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const totalProducts = products.length;

  const inStockProducts = products.filter(
  (product) => product.inStock
  ).length;

   const averagePrice =
   products.length > 0
    ? Math.round(
        products.reduce((sum, product) => sum + product.price, 0) /
          products.length
      )
    : 0;
   /* ==========================================================================
   FUTURE PILOT NOTIFICATIONS (SWAL UPGRADE)
   ========================================================================== */

const showSuccess = (message) => {
  Swal.fire({
    html: `
      <div style="padding: 10px;">
        <!-- Glowing Check Emoji -->
        <div style="font-size: 55px; filter: drop-shadow(0 0 12px rgba(52, 211, 153, 0.6)); margin-bottom: 12px;">✅</div>
        
        <!-- Cyber Green Gradient Heading -->
        <h2 style="
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(90deg, #34d399, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: 0.5px;
        ">
          Action Successful
        </h2>
        
        <!-- Muted Silver Message -->
        <p style="color: #cbd5e1; font-size: 15px; margin-top: 10px; font-weight: 500;">
          ${message}
        </p>
      </div>
    `,
    background: "#0b1329", /* Dark space blue background */
    timer: 1800,
    showConfirmButton: false,
    backdrop: "rgba(0,0,0,0.75)" /* Smooth dark blur effect behind popup */
  });
};

const showError = (message) => {
  Swal.fire({
    html: `
      <div style="padding: 10px;">
        <!-- Glowing Alert Emoji -->
        <div style="font-size: 55px; filter: drop-shadow(0 0 12px rgba(251, 113, 133, 0.6)); margin-bottom: 12px;">🚨</div>
        
        <!-- Cyber Rose/Red Gradient Heading -->
        <h2 style="
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(90deg, #fb7185, #e11d48);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: 0.5px;
        ">
          System Alert
        </h2>
        
        <p style="color: #cbd5e1; font-size: 15px; margin-top: 10px; font-weight: 500;">
          ${message}
        </p>
      </div>
    `,
    background: "#0b1329",
    timer: 2200,
    showConfirmButton: false,
    backdrop: "rgba(0,0,0,0.75)"
  });
};
const logout = async () => {
  const result = await Swal.fire({
  html: `
    <div style="padding:10px;">
      <div style="font-size:70px;">🥺</div>

      <h2 style="
        margin-top:12px;
        font-size:30px;
        font-weight:800;
        background:linear-gradient(90deg,#60a5fa,#a855f7);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
      ">
        See You Soon!
      </h2>

      <p style="
        color:#cbd5e1;
        font-size:17px;
        margin-top:10px;
      ">
        Your tracked deals will be waiting for you 💜
      </p>
    </div>
  `,
  background: "#0f172a",
  showCancelButton: true,
  confirmButtonText: "👋 Logout",
  cancelButtonText: "🛍 Continue Tracking",
  confirmButtonColor: "#ef4444",
  cancelButtonColor: "#3b82f6",
  reverseButtons: true,
  backdrop: "rgba(0,0,0,.65)"
});
if (!result.isConfirmed) {
  Swal.fire({
    html: `
      <div style="padding:10px;">
        <div style="font-size:60px;">😎</div>

        <h2 style="
          font-size:28px;
          font-weight:800;
          background:linear-gradient(90deg,#22c55e,#06b6d4);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        ">
          Awesome Choice!
        </h2>

        <p style="color:#cbd5e1;font-size:16px;">
          Let's hunt the best deals together! 🔥
        </p>
      </div>
    `,
    background:"#0f172a",
    timer:1700,
    showConfirmButton:false
  });

  return;
}


  if (!result.isConfirmed) return;

  localStorage.removeItem("token");

Swal.fire({
  html: `
    <div style="padding:10px;">
      <div style="font-size:65px;">🌙</div>

      <h2 style="
        margin:12px 0 8px;
        font-size:30px;
        font-weight:800;
        background:linear-gradient(90deg,#60a5fa,#a855f7);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
      ">
        See You Soon!
      </h2>

      <p style="color:#cbd5e1;font-size:17px;">
        Your price alerts will be waiting for you 💜
      </p>
  `,
  background:"#0f172a",
  showConfirmButton:false,
  timer:2000,
  timerProgressBar:true
}).then(() => {
  localStorage.removeItem("token");   // extra safe
  window.location.replace("/login");
});

};
  const getProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      

const res = await axios.get(`${API_URL}/products`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      setProducts(res.data);
    } catch (error) {
  console.log("GET PRODUCTS ERROR");
  console.log(error.response?.status);
  console.log(error.response?.data);
  console.log(error);
  showError("Error loading products");
}
  };

  useEffect(() => {
  getProducts();

  const interval = setInterval(() => {
    getProducts();
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
  const addProduct = async () => {
       if (!name || !store || !price)
     {
       showError("Please fill all fields");
       return;
     }

    if (Number(price) <= 0)
    {
     showError("Price must be greater than 0");
     return;
    }

    try {
      setLoading(true);

     const token = localStorage.getItem("token");

const res = await axios.post(
  `${API_URL}/products`,
  {
    name,
    store,
    price: Number(price),
    url,
    inStock: false,
    notify: true,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
      showSuccess(res.data.message);

      setName("");
      setStore("");
      setPrice("");
      setUrl("");

      getProducts();
    } 
    catch (error) {
  console.log(error);
  showError(
    error.response?.data?.message || "Error adding product"
  );
}
    finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
  const result = await Swal.fire({
    html: `
      <div style="padding:10px;">
        <!-- Glowing Trash Icon -->
        <div style="font-size:70px; filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.6)); margin-bottom: 12px;">🗑️</div>

        <!-- Cyber Red Gradient Heading -->
        <h2 style="
          font-size:28px;
          font-weight:800;
          background:linear-gradient(90deg,#ef4444,#dc2626);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          margin: 0;
          letter-spacing: 0.5px;
        ">
          Purge Target?
        </h2>

        <!-- Muted Silver Message -->
        <p style="color:#cbd5e1; font-size:16px; margin-top:15px; font-weight: 500;">
          The target will be permanently erased from the data stream. <br/>This action is irreversible.
        </p>
      </div>
    `,
    background: "#1e293b", // Yeh naya color hai (thoda lighter aur clear)
    showCancelButton: true,
    confirmButtonText: "💀 Terminate",
    cancelButtonText: "🛡️ Keep Target",
    confirmButtonColor: "#ef4444", 
    cancelButtonColor: "#334155", 
    reverseButtons: true,
    backdrop: "rgba(0,0,0,0.85)", 
    customClass: {
      confirmButton: 'pilot-submit-btn', 
      cancelButton: 'nav-console-btn'
    }
  });

  if (!result.isConfirmed) return;

  try {
    const token = localStorage.getItem("token");

    const res = await axios.delete(
      `${API_URL}/products/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    showSuccess(res.data.message);
    getProducts();
  } catch (error) {
    console.log(error);
    showError("Error purging target");
  }
};
  const editProduct = (product) => {
  setName(product.name);
  setStore(product.store);
  setPrice(product.price);
  setUrl(product.url || "");

  setEditId(product._id);
  setIsEditing(true);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
 const updateProduct = async () => {
  if (!name.trim() || !store.trim() || !price) {
    alert("Please fill all required fields");
    return;
  }

  try {
    setLoading(true);

    const token = localStorage.getItem("token");

const res = await axios.put(
  `${API_URL}/products/${editId}`,
  {
    name,
    store,
    price: Number(price),
    url,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

    showSuccess(res.data.message);

    setName("");
    setStore("");
    setPrice("");
    setUrl("");

    setEditId(null);
    setIsEditing(false);

    getProducts();
  } catch (error) {
    console.log(error);
    alert("Error updating product");
  } finally {
    setLoading(false);
  }
};

const filteredProducts = products
  .filter((product) => {
    const matchesSearch = (product.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all"
        ? true
        : filter === "instock"
        ? product.inStock
        : !product.inStock;

    return matchesSearch && matchesFilter;
  })
  .sort((a, b) => {
    if (sort === "low") return a.price - b.price;
    if (sort === "high") return b.price - a.price;
    return 0;
  });

const indexOfLastProduct = currentPage * productsPerPage;
const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

const currentProducts = filteredProducts.slice(
  indexOfFirstProduct,
  indexOfLastProduct
);
const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  return (
    <div className="container mt-5">
    <div className="top-buttons">
  <button
    className="pin-btn"
    onClick={() => (window.location.href = "/pincodes")}
  >
    📍 Delivery Pincodes
  </button>
  <h1 className="brand-logo">
    ⚡ Price Pilot
  </h1>
  <button
    className="logout-btn"
    onClick={logout}
  >
    👋 Sign Out
  </button>
</div>
      
    {/* 📦 IN TEENO CARDS KO APNE APP.JSX MEIN REPLACE KAREIN */}
<div className="row mb-4">

  {/* Card 1: Total Products */}
  <div className="col-md-4 mb-3">
    <div className={`pilot-card total-card ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
      <div className="pilot-card-body">
        <div className="card-icon">📡</div>
        <h5 className="card-title">Total Radar</h5>
        <h2 className="card-value">{totalProducts}</h2>
      </div>
    </div>
  </div>

  {/* Card 2: In Stock */}
  <div className="col-md-4 mb-3">
    <div className={`pilot-card instock-card ${filter === "instock" ? "active" : ""}`} onClick={() => setFilter("instock")}>
      <div className="pilot-card-body">
        <div className="card-icon">⚡</div>
        <h5 className="card-title">Ready to Hunt</h5>
        <h2 className="card-value">{inStockProducts}</h2>
      </div>
    </div>
  </div>

  {/* Card 3: Out of Stock */}
  <div className="col-md-4 mb-3">
    <div className={`pilot-card outstock-card ${filter === "outofstock" ? "active" : ""}`} onClick={() => setFilter("outofstock")}>
      <div className="pilot-card-body">
        <div className="card-icon">🚨</div>
        <h5 className="card-title">Out of Range</h5>
        <h2 className="card-value">{products.length - inStockProducts}</h2>
      </div>
    </div>
  </div>

</div>

      
      <p className="text-center fw-bold text-secondary">
           Showing {filteredProducts.length} of {products.length} Products 
      </p>

      {/* 🎛️ ADD PRODUCT FORM KO ISSE REPLACE KAREIN */}
<div className="pilot-form-container p-4 mb-5">
  <h3 className="form-heading mb-4">
    {isEditing ? "🛠️ Modify Target" : "🎯 Lock New Target"}
  </h3>

  <input
    className="pilot-input mb-3"
    type="text"
    placeholder="Enter Product Name..."
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

  <input
    className="pilot-input mb-3"
    type="text"
    placeholder="Store/Platform (e.g. Amazon, Flipkart)"
    value={store}
    onChange={(e) => setStore(e.target.value)}
  />

  <input
    className="pilot-input mb-3"
    type="number"
    placeholder=" Price (₹)"
    value={price}
    onChange={(e) => setPrice(e.target.value)}
  />

  <input
    className="pilot-input mb-3"
    type="text"
    placeholder="Product URL "
    value={url}
    onChange={(e) => setUrl(e.target.value)}
  />
  
  <button
    className={`pilot-submit-btn ${isEditing ? "editing" : ""}`}
    onClick={isEditing ? updateProduct : addProduct}
    disabled={loading}
  > 
    {loading
     ? "Encrypting Data..."
      : isEditing
     ? "💾 Update Target"
      : "➕ Launch Tracker"}
  </button>
</div>

      <h2 className="mb-3 view-heading">
  {filter === "all" && "📡 Total Radar Targets"}
  {filter === "instock" && "⚡ Ready to Hunt Signals"}
  {filter === "outofstock" && "🚨 Out of Range Alerts"}
</h2>

      {/* 🔍 FILTER & SEARCH PANEL REPLACEMENT */}
<div className="pilot-filter-bar mb-4">
  <input
    className="pilot-filter-input"
    type="text"
    placeholder="🔍 Scan for specific targets..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    className="pilot-dropdown"
    value={sort}
    onChange={(e) => setSort(e.target.value)}
  >
     <option value="">📊 Sort Matrix</option>
     <option value="low">Price: Low ➔ High</option>
     <option value="high">Price: High ➔ Low</option>
  </select>

  <select
     className="pilot-dropdown"
     value={filter}
     onChange={(e) => setFilter(e.target.value)}
  >
     <option value="all">🌐 All Sectors</option>
     <option value="instock">🟢 Ready to Hunt</option>
     <option value="outofstock">🚨 Out of Range</option>
  </select>
</div>


        {/* 📦 ULTRA-SLEEK PRODUCT CARD REPLACEMENT */}
{filteredProducts.map((product) => (
  <div key={product._id} className="product-radar-card p-4 mb-3">
    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div>
        {/* Store Badge */}
        <span className="radar-store-tag">{product.store}</span>
        {/* Product Title */}
        <h4 className="radar-product-title mt-1">{product.name}</h4>
        {/* Status Tracker */}
        <div className="mt-2">
          <span className={`radar-status-badge ${product.inStock ? "in-stock" : "out-of-stock"}`}>
            {product.inStock ? "🟢 Ready to Hunt" : "🚨 Out of Range"}
          </span>
        </div>
      </div>

      {/* Futuristic Price Tag */}
      <div className="radar-price-container">
        <span className="price-label">CURRENT TARGET</span>
        <div className="price-value">₹{Number(product.price).toLocaleString('en-IN')}</div>
      </div>
    </div>

    {/* Thin Cyber Divider */}
    <div className="radar-divider my-3"></div>

    {/* Sleek Control Buttons */}
    <div className="d-flex gap-2 flex-wrap justify-content-start align-items-center">
      {product.url && (
        <a 
          href={product.url} 
          target="_blank" 
          rel="noreferrer" 
          className="radar-btn btn-launch"
        >
          🌐 Open Target
        </a>
      )}
      
      <button className="radar-btn btn-modify" onClick={() => editProduct(product)}>
        🛠️ Modify
      </button>
      
      <button 
        className={`radar-btn ${product.inStock ? "btn-toggle-out" : "btn-toggle-in"}`}
        onClick={() => toggleStock(product)}
      >
        {product.inStock ? "📡 Lost Signal" : "⚡ Signal Found"}
      </button>
      
      <button className="radar-btn btn-terminate" onClick={() => deleteProduct(product._id)}>
        🗑️ Terminate
      </button>
    </div>
  </div>
))}
    {/* 🎛️ ULTRA-SLEEK NAVIGATION CONSOLE (PAGINATION) */}
<div className="pilot-pagination-container mt-5">
  <button
    className="nav-console-btn btn-prev"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    🛸 Prev Sector
  </button>

  <div className="nav-sector-badge">
    <span className="sector-label">DATA STREAM</span>
    <span className="sector-value">
      {currentPage} <span className="sector-divider">//</span> {totalPages}
    </span>
  </div>

  <button
    className="nav-console-btn btn-next"
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next Sector 🚀
  </button>
</div>
    </div>
  );
}
export default App;