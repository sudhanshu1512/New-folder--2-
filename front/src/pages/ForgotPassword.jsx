import { useState } from "react";
import api from "../lib/api";
import { FaEnvelope } from 'react-icons/fa'; // Using a consistent icon

export default function ForgotPassword() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState({ text: "", isError: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", isError: false });
    setIsLoading(true);
  
    try {
      const response = await api.post("/auth/forgot-password", { 
        // The field is named userId, but can accept email or mobile based on your backend logic
        userId, 
        resetUrl: `${import.meta.env.VITE_FRONTEND_URL}/reset-password`
      });
      setMessage({ text: response.data.message, isError: false });
    } catch (error) {
      setMessage({ 
          text: error.response?.data?.message || "An error occurred. Please try again.", 
          isError: true 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <>
        {/* The <style> block contains all the CSS needed for this component */}
        <style>{`
            .forgot-password-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
              background-color: #f8fafc;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            .forgot-password-card {
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

            .forgot-form {
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
      
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <h2 className="page-title">
                    <FaEnvelope /> Forgot Your Password?
                </h2>
                <p className="subtitle">No worries! Enter your registered email or mobile number below and we'll send you a reset link.</p>
                
                <form className="forgot-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="userId">Enter Registered Mobile Number</label>
                        <input
                            id="userId"
                            name="userId"
                            type="text"
                            placeholder="Enter your registered identifier"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="submit-button"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
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
