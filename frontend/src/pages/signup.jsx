import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
const API_URL = import.meta.env.VITE_API_URL ;

console.log(API_URL);
console.log(`${API_URL}/api/auth/signup`);

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    const getErrorMessage = (err) => {
      const resp = err?.response?.data;
      if (!err) return "Something went wrong";
      if (resp) {
        if (typeof resp === "string") return resp;
        if (resp.message) return resp.message;
        if (resp.error) return resp.error;
        if (Array.isArray(resp.errors)) return resp.errors.map((x) => x.msg || x.message || x).join(" \n");
        // fallback to stringified object
        try {
          return JSON.stringify(resp);
        } catch (e) {
          return String(resp);
        }
      }
      return err.message || "Something went wrong";
    };

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/signup`,
        form
      );

      await Swal.fire({
        icon: "success",
        title: "OTP Sent",
        text: "Please verify your email",
      });

      navigate("/verify-otp", {
        state: {
          email: res.data.email,
        },
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: msg,
      });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1 className="logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "0 0 12px 0" }}>
          <span style={{ fontSize: "2.2rem" }}>⚡</span>
          <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "2.2rem" }}>Price Pilot</span>
        </h1>
        <p className="subtitle">
          Create your account and start tracking prices.
        </p>

        <form
          onSubmit={handleSignup}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >

          <input
            type="text"
            name="name"
            className="custom-input"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            className="custom-input"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            className="custom-input"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="login-btn">
            Create Account
          </button>

          {error && (
            <div style={{ color: "#f87171", marginTop: "8px", whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}

          <div className="text-center mt-3">
            <span style={{ color: "#d1d5db" }}>
              Already have an account?      </span>

            <span
              style={{
                color: "#4fd1ff",
                cursor: "pointer",
                fontWeight: "600",
              }}
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </div>

        </form>

      </div>
    </div>
  );
}

export default Signup;