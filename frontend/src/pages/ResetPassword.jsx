import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [form, setForm] = useState({
    otp: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:3000/api/auth/reset-password",
        {
          email,
          otp: form.otp,
          password: form.password,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Password Reset Successful",
      });

      navigate("/login");

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: err.response?.data?.message || "Something went wrong",
      });
    }
  };

  return (
  <div className="login-page">
    <div className="login-card">

      <h1 className="logo">
        <span className="logo-text">⚡PricePilot</span>
      </h1>

      <p className="subtitle">
        Enter your OTP and create a new password.
      </p>

      <form
        onSubmit={handleReset}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >

        <input
          className="custom-input"
          name="otp"
          placeholder="Enter OTP"
          value={form.otp}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          className="custom-input"
          name="password"
          placeholder="New Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" className="login-btn">
          Reset Password
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

export default ResetPassword;