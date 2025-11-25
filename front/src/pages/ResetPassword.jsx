import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { FaKey } from 'react-icons/fa'; // Using a consistent icon
  // Using normal CSS

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Added for better UX
  const [message, setMessage] = useState({ text: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setMessage({ text: "Invalid or missing reset token. Please request a new link.", isError: true });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setMessage({ text: "Please enter a new password.", isError: true });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", isError: true });
      return;
    }
    if (!token) {
      setMessage({ text: "Invalid reset link. Please request a new password reset.", isError: true });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", isError: false });

    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage({ 
        text: "Password reset successful! Redirecting to login...", 
        isError: false 
      });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage({ 
        text: err.response?.data?.message || "Error resetting password. Link may be expired.", 
        isError: true 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>


<style>{`
        /* ===== Base & Page Layout ===== */
        .reset-password-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          background-color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .reset-password-card {
          width: 100%;
          max-width: 450px;
          background-color: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 2.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.05);
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .subtitle {
          font-size: 0.95rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 2rem;
        }

        /* ===== Form Styles ===== */
        .reset-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        /* ===== Submit Button ===== */
        .submit-button {
          width: 100%;
          padding: 0.8rem;
          margin-top: 0.5rem;
          background-color: #3b82f6; /* Blue */
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .submit-button:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
          opacity: 0.8;
        }

        /* ===== Message Box for Success/Error ===== */
        .message-box {
          padding: 1rem;
          border-radius: 0.5rem;
          text-align: center;
        }

        .message-box.error {
          background-color: #fee2e2;
          color: #991b1b;
        }

        .message-box.success {
          background-color: #dcfce7;
          color: #166534;
        }

        .message-box p {
          margin: 0;
          font-weight: 500;
        }
      `}</style>

    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2 className="page-title">
          <FaKey /> Reset Your Password
        </h2>
        <p className="subtitle">Enter your new password below to regain access to your account.</p>
        
        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="submit-button"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
          
          {message.text && (
            <div className={`message-box ${message.isError ? 'error' : 'success'}`}>
              <p>{message.text}</p>
            </div>
          )}
        </form>
      </div>
    </div>
    </>
  );
}
