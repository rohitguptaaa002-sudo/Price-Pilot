import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = "http://localhost:3000";

function Pincodes() {
  const [pincode, setPincode] = useState("");
  const [pincodes, setPincodes] = useState([]);

  const getPincodes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/pincodes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPincodes(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPincodes();
  }, []);

  const addPincode = async () => {
    if (!pincode) return;

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_URL}/pincodes`,
        { pincode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire("Success", res.data.message, "success");

      setPincode("");
      getPincodes();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  const deletePincode = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${API_URL}/pincodes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      getPincodes();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container mt-5">
      {/* 📍 FUTURISTIC PINCODE CONSOLE */}
      <div className="pilot-form-container p-4 mb-4">
        <h3 className="form-heading mb-4">📍 Sector Delivery Pincodes</h3>
        
        {/* Input and Add Button Grid */}
        <div className="pincode-input-group mb-4">
          <input
            className="pilot-input"
            type="text"
            placeholder="Enter 6-digit region pincode..."
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
          />
          <button className="pilot-submit-btn" onClick={addPincode}>
            ➕ Add Region
          </button>
        </div>

        {/* Pincodes Stream List */}
        <div className="pincode-stream-list">
          {pincodes.map((pin) => (
            <div key={pin._id} className="pincode-row-card d-flex justify-content-between align-items-center p-3 mb-2">
              <span className="pincode-code-text">
                📡 SECTOR // <span className="highlight-code">{pin.pincode}</span>
              </span>
              <button 
                className="radar-btn btn-terminate py-2 px-3" 
                onClick={() => deletePincode(pin._id)}
              >
                🗑️ Terminate
              </button>
            </div>
          ))}
          
          {pincodes.length === 0 && (
            <div className="alert alert-warning text-center m-0">
              No tracking regions active.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pincodes;