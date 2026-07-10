import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      await axios.post(
        "http://localhost:3000/api/auth/forgot-password",
        { email }
      );

      Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "Check your email",
      });

      navigate("/reset-password", {
        state: { email },
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="login-page">
    <div className="login-card">

      <h1 className="logo">
        <span className="logo-text">⚡PricePilot</span>
      </h1>

      <p className="subtitle">
        Enter your email to receive a password reset OTP.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >

        <input
          type="email"
          className="custom-input"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="login-btn"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <div className="text-center mt-3">
          <span
            style={{
              color: "#4fd1ff",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => navigate("/login")}
          >
            ← Back to Login
          </span>
        </div>

      </form>

    </div>
  </div>
);

}

export default ForgotPassword;