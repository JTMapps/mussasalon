import { useState } from "react";

const ForgotPass = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    console.log("Password reset link sent to:", email);
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Enter your email to receive a password reset link.</p>
      <input 
        type="email" 
        placeholder="Enter email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default ForgotPass;
