import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/login",
        form
      );

      localStorage.setItem("token", res.data.token);

    Swal.fire({
  html: `
    <div style="padding:15px 5px;">
      <div style="font-size:65px;">😊</div>

      <h2 style="
        margin:12px 0 6px;
        font-size:30px;
        font-weight:800;
        background:linear-gradient(90deg,#3b82f6,#8b5cf6);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
      ">
        Welcome Back
      </h2>

      <p style="
        font-size:17px;
        color:#cbd5e1;
        margin-top:10px;
        letter-spacing:.3px;
      ">
        Happy to see you again 💜
      </p>
    </div>
  `,
  background: "#0f172a",
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: true,
  backdrop: "rgba(0,0,0,.65)"
});

      navigate("/");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
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
          Never Miss a Price Drop Again
        </p>

        <form onSubmit={handleLogin}>

          <div className="mb-3">
            <input
              type="email"
              name="email"
              className="form-control custom-input"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              name="password"
              className="form-control custom-input"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn login-btn w-100" type="submit">
            Login
          </button>

          <div className="text-center mt-3">
            <span
              className="link-blue"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          <div className="text-center mt-3">
            <span style={{ color: "#cbd5e1" }}>
              Don't have an account?
            </span>

            <span
              className="link-green"
              onClick={() => navigate("/signup")}
            >
              {" "}Create Account
            </span>
          </div>

        </form>

      </div>
    </div>
  );
}

export default Login;