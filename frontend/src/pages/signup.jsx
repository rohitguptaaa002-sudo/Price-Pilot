import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/signup",
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
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text: err.response?.data?.message || "Something went wrong",
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
display:"flex",
flexDirection:"column",
gap:"16px"
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