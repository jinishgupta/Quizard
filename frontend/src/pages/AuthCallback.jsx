import { useEffect, useState } from 'react';
import { useBedrockPassport } from "@bedrock_org/passport";

function AuthCallback() {
  const { loginCallback } = useBedrockPassport();
  const [error, setError] = useState(null);

  useEffect(() => {
    const login = async (token, refreshToken) => {
      try {
        const success = await loginCallback(token, refreshToken);
        if (success) {
          // Redirect to the main page after successful login
          window.location.href = "/";
        } else {
          setError("Login failed. Please try again.");
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Authentication error. Please try again.");
      }
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token && refreshToken) {
      login(token, refreshToken);
    } else {
      setError("Missing authentication tokens. Please try logging in again.");
    }
  }, [loginCallback]);

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <a href="/" className="text-blue-500 underline">Return to login</a>
      </div>
    );
  }

  return <div className="flex justify-center items-center min-h-screen">Signing in...</div>;
}

export default AuthCallback;
