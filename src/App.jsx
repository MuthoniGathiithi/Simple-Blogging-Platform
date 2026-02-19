import React from 'react';
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useLocation } from "react-router-dom";
import HomePage from "./components/HomePage";
import SignIn from "./Signin";
import SignUp from "./Signup";
import Dashboard from "./Dashboard";

import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'



function App() {
  const location = useLocation();

  return (
    <>
      {/* Hide header/footer on dashboard route */}
      {location.pathname !== '/dashboard' && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
      {location.pathname !== '/dashboard' && <Footer />}
    </>
  );
}

export default App;
