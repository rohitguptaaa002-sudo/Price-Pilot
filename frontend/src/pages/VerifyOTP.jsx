import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      await axios.post("http://localhost:3000/api/auth/verify-otp", {
        email,
        otp,
      });

      Swal.fire({
        icon: "success",
        title: "Email Verified",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await axios.post("http://localhost:3000/api/auth/resend-otp", {
        email,
      });

      Swal.fire({
        icon: "success",
        title: "OTP Resent",
        text: "Check your email",
      });

      setTimer(60);

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Something went wrong",
      });
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2 className="text-center mb-4">Verify OTP</h2>

      <form onSubmit={handleVerify}>
        <input
          className="form-control mb-3"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button
          className="btn btn-success w-100"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <div className="text-center mt-3">
        {timer > 0 ? (
          <p className="text-muted">
            Resend OTP in {timer}s
          </p>
        ) : (
          <button
            className="btn btn-link"
            onClick={handleResendOTP}
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}

export default VerifyOTP;