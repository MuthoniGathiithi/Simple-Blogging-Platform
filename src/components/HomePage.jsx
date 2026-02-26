"use client"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import PhoneMockup from "./Staticphonemockup.jsx"
import DashboardMockup from "./Dashboardmockup.jsx"




export default function HomePage() {
  const navigate = useNavigate()

  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" })
  const contactEmail = "gathiithijoyce74@gmail.com"
  const whatsappNumber = "+254742278735"

  const handleContactSubmit = (e) => {
    e.preventDefault()
    const subject = `Funzo Hub Contact - ${contactForm.name || "Visitor"}`
    const body = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  const handleGetStartedClick = () => {
    navigate("/signup")
  }

  const handleSignInClick = () => {
    navigate("/signin")
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        margin: 0,
        padding: 0,
      }}
    >
      {/* Global responsive styles */}
      <style>{`
        @keyframes blobPulse {
          0% { transform: translate(-50%,-40%) scale(1); opacity:0.9 }
          50% { transform: translate(-50%,-40%) scale(1.05); opacity:0.95 }
          100% { transform: translate(-50%,-40%) scale(1); opacity:0.9 }
        }

        @media (max-width: 1024px) {
          .hero-section { padding: 100px 20px 60px; }
          .hero-title { font-size: 3rem; }
          .hero-subtitle { font-size: 1.15rem; }
          .hero-buttons { flex-direction: column; gap: 12px; }
          .mockup-grid { grid-template-columns: 1fr; padding: 20px; }
          .about-grid { grid-template-columns: 1fr; padding: 40px 20px; gap: 40px; }
          .how-it-works-grid { grid-template-columns: 1fr; gap: 40px; }
          .contact-grid { grid-template-columns: 1fr; gap: 28px; }
        }

        @media (max-width: 768px) {
          .hero-section { padding: 80px 16px 50px; }
          .hero-title { font-size: 2.5rem; line-height: 1.2; }
          .hero-subtitle { font-size: 1rem; margin-bottom: 32px !important; }
          .hero-buttons button { padding: 14px 32px; font-size: 0.95rem; width: 100%; }
          .mockup-grid { padding: 16px; gap: 16px; }
          .mockup-grid > div { padding: 16px; }
          .about-section { padding: 60px 16px !important; }
          .about-grid { 
            display: block !important;
            grid-template-columns: 1fr !important;
            padding: 44px 24px !important;
            gap: 32px !important;
            border-radius: 0 !important;
          }
          .about-grid h2 { font-size: 2rem; }
          .about-grid button { width: 100%; }
          .how-it-works-section { padding: 60px 16px !important; }
          .how-it-works-title { font-size: 2rem; }
          .steps-num { font-size: 2rem; min-width: 60px; }
          .step-item { gap: 16px; }
          .step-title { font-size: 1.15rem; }
          .step-desc { font-size: 0.95rem; }
          .mockup-visual { padding: 32px; }
          .contact-section { padding: 60px 16px !important; }
          .contact-grid { grid-template-columns: 1fr; padding: 32px 16px; gap: 24px; }
          .contact-title { font-size: 2rem !important; }
          .contact-form-row { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 640px) {
          .hero-section { padding: 60px 12px 40px; }
          .hero-title { font-size: 1.875rem; line-height: 1.2; letter-spacing: -1px; }
          .hero-subtitle { font-size: 0.95rem; margin-bottom: 24px !important; }
          .hero-buttons { flex-direction: column; gap: 10px; }
          .hero-buttons button { padding: 12px 24px; font-size: 0.9rem; width: 100%; }
          .badge { font-size: 0.8rem; padding: 6px 16px; }
          .mockup-grid { padding: 12px; gap: 12px; }
          .mockup-grid > div { padding: 12px; }
          .about-section { padding: 40px 12px !important; }
          .about-grid { padding: 20px 12px; gap: 24px; }
          .about-grid h2 { font-size: 1.5rem; margin-bottom: 16px !important; }
          .about-description { font-size: 0.95rem; margin-bottom: 20px !important; }
          .about-grid button { width: 100%; padding: 12px 24px; font-size: 0.9rem; }
          .how-it-works-section { padding: 40px 12px !important; }
          .how-it-works-title { font-size: 1.5rem; }
          .how-it-works-subtitle { font-size: 1rem; }
          .steps-num { font-size: 1.5rem; min-width: 50px; }
          .step-item { gap: 12px; margin-bottom: 32px; }
          .step-title { font-size: 1rem; }
          .step-desc { font-size: 0.9rem; line-height: 1.6; }
          .mockup-visual { padding: 24px; border-radius: 8px; min-height: 300px; }
          .about-visual { height: auto; min-height: 200px; padding: 24px; }
          .contact-section { padding: 48px 12px !important; }
          .contact-grid { padding: 20px 12px; gap: 18px; }
          .contact-card { padding: 18px !important; }
          .contact-title { font-size: 1.6rem !important; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 1.5rem; }
          .hero-subtitle { font-size: 0.9rem; }
          .badge { font-size: 0.75rem; padding: 5px 12px; }
          .mockup-grid > div { padding: 10px; }
          .about-grid h2 { font-size: 1.35rem; }
          .step-title { font-size: 0.95rem; }
          .step-num { font-size: 1.25rem; }
        }
      `}</style>

      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          padding: "140px 40px 100px",
          textAlign: "center",
          backgroundColor: "#FAFAFA",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.3,
            zIndex: 0,
          }}
        ></div>

        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            className="badge"
            style={{
              display: "inline-block",
              padding: "8px 20px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "24px",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#6B7280",
              marginBottom: "32px",
            }}
          >
            CBE aligned Lesson Plans
          </div>

          <div style={{ display: "inline-block", position: "relative" }}>
            {/* Blob animations */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -40%)",
                width: "920px",
                height: "360px",
                background:
                  "radial-gradient(ellipse at center, rgba(99,102,241,0.72) 0%, rgba(99,102,241,0.36) 30%, rgba(99,102,241,0.14) 55%, transparent 68%)",
                filter: "blur(18px)",
                borderRadius: "50%",
                zIndex: 0,
                pointerEvents: "none",
                mixBlendMode: "screen",
                animation: "blobPulse 5s ease-in-out infinite",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "54%",
                transform: "translate(-50%, -40%)",
                width: "820px",
                height: "420px",
                background:
                  "radial-gradient(ellipse at center, rgba(255,249,240,0.55) 0%, rgba(180, 165, 142, 0.3) 25%, rgba(255,249,240,0.06) 55%, transparent 70%)",
                filter: "blur(34px)",
                borderRadius: "50%",
                zIndex: 0,
                pointerEvents: "none",
                mixBlendMode: "screen",
                opacity: 0.9,
                animation: "blobPulse 7s ease-in-out infinite",
              }}
            />

            <h1
              className="hero-title"
              style={{
                position: "relative",
                zIndex: 1,
                fontSize: "4rem",
                fontWeight: 800,
                color: "#4F46E5",
                margin: "0 0 28px 0",
                lineHeight: "1.1",
                letterSpacing: "-2px",
              }}
            >
            identisacn ai 
            </h1>
          </div>

          <p
            className="hero-subtitle"
            style={{
              fontSize: "1.35rem",
              color: "#000",
              margin: "0 0 48px 0",
              fontWeight: 400,
              lineHeight: "1.6",
              maxWidth: "700px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Let Identiscan  handle the registering while you focus on inspiring students. identiscan 
          </p>

          <div
            className="hero-buttons"
            style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "80px" }}
          >
            <button
              onClick={handleGetStartedClick}
              style={{
                background: "#111827",
                color: "#FFFFFF",
                border: "none",
                padding: "16px 40px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#1F2937"
                e.target.style.transform = "translateY(-2px)"
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#111827"
                e.target.style.transform = "translateY(0)"
              }}
            >
              Get Started
            </button>

            <button
              onClick={handleSignInClick}
              style={{
                background: "#FFFFFF",
                color: "#000",
                border: "1px solid #E5E7EB",
                padding: "16px 40px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = "#D1D5DB"
                e.target.style.background = "#F9FAFB"
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = "#E5E7EB"
                e.target.style.background = "#FFFFFF"
              }}
            >
              Sign In
            </button>

            <button
              style={{
                background: "#FFFFFF",
                color: "#000",
                border: "1px solid #E5E7EB",
                padding: "16px 40px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = "#D1D5DB"
                e.target.style.background = "#F9FAFB"
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = "#E5E7EB"
                e.target.style.background = "#FFFFFF"
              }}
            >
              Watch Demo
            </button>
          </div>

          {/* Hero Mockup */}
          <div
            className="mockup-grid"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section
        className="about-section"
        id="about"
        style={{ padding: "100px 40px", backgroundColor: "#4F46E5" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            className="about-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "60px",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "60px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  backgroundColor: "#4F46E5",
                  color: "#FFFFFF",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "24px",
                }}
              >
                About Us
              </div>
              <h2
                style={{
                  fontSize: "2.75rem",
                  fontWeight: 700,
                  color: "#000",
                  margin: "0 0 24px 0",
                  letterSpacing: "-1px",
                  lineHeight: "1.2",
                }}
              >
                Helping Teachers Plan Faster and Teach Better
              </h2>
              <p
                className="about-description"
                style={{ fontSize: "1.05rem", color: "#6B7280", lineHeight: "1.8", margin: "0 0 32px 0" }}
              >
               identiscan aid in helping teachers plan faster and teach better by automating the registration process, allowing educators to focus more on teaching and less on administrative tasks. With identiscan, teachers can quickly register their classes and students, saving valuable time and reducing the hassle of paperwork. This streamlined process enables teachers to dedicate more energy to creating engaging lesson plans and providing personalized instruction, ultimately enhancing the learning experience for their students.  
              </p>
              <button
                style={{
                  padding: "14px 32px",
                  backgroundColor: "#4F46E5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#4338CA"
                  e.target.style.transform = "translateY(-2px)"
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#4F46E5"
                  e.target.style.transform = "translateY(0)"
                }}
              >
                Watch  Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="how-it-works-section"
        id="how-it-works"
        style={{ padding: "100px 40px", backgroundColor: "#FFFFFF" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2
              className="how-it-works-title"
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "#000",
                margin: "0 0 16px 0",
                letterSpacing: "-1px",
              }}
            >
              How It Works
            </h2>
            <p className="how-it-works-subtitle" style={{ fontSize: "1.1rem", color: "#6B7280", margin: 0 }}>
              Create a CBE-aligned lesson plan in minutes.
            </p>
          </div>

          <div
            className="how-it-works-grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}
          >
            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
              {[
                {
                  num: "01",
                  title: "Enter Your Administrative and Class Details",
                  desc: "Select grade, subject, strand, sub-strand,.",
                },
                {
                  num: "02",
                  title: "Generate Your Lesson Plan",
                  desc: " AI instantly creates a structured, CBE-aligned lesson plan, including learning outcomes, activities, and assessment.",
                },
                {
                  num: "03",
                  title: " Edit & Download",
                  desc: "Customize the lesson to suit your teaching style.",
                },
              ].map((step, i) => (
                <div key={i} className="step-item" style={{ display: "flex", gap: "24px" }}>
                  <div
                    className="steps-num"
                    style={{ fontSize: "2.5rem", fontWeight: 700, color: "#E5E7EB", minWidth: "80px" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3
                      className="step-title"
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 600,
                        color: "#111827",
                        margin: "0 0 12px 0",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="step-desc"
                      style={{ fontSize: "1rem", color: "#6B7280", margin: 0, lineHeight: "1.7" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual mockup */}
            
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        className="contact-section"
        id="contact"
        style={{ padding: "100px 40px", backgroundColor: "#4F46E5" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2
              className="contact-title"
              style={{ fontSize: "2.5rem", fontWeight: 800, color: "#111827", margin: "0 0 12px 0", letterSpacing: "-1px" }}
            >
              Contact
            </h2>
            <p style={{ margin: 0, color: "#6B7280", fontSize: "1.05rem", lineHeight: 1.7 }}>
              Reach us via WhatsApp, email, or send a message.
            </p>
          </div>

          <div
            className="contact-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              alignItems: "start",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
              padding: "40px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                className="contact-card"
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "22px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div style={{ fontWeight: 800, color: "#111827", marginBottom: "10px" }}>WhatsApp</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16A34A", marginBottom: "8px" }}>{whatsappNumber}</div>
                <div style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "14px" }}>Fast support for teachers.</div>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#16A34A",
                    color: "#FFFFFF",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div
                className="contact-card"
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "14px",
                  padding: "22px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <div style={{ fontWeight: 800, color: "#111827", marginBottom: "10px" }}>Email</div>
                <div style={{ color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "12px" }}>
                  For feedback, partnerships, or support:
                </div>
                <a
                  href={`mailto:${contactEmail}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    backgroundColor: "#F9FAFB",
                    color: "#111827",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    wordBreak: "break-word",
                  }}
                >
                  {contactEmail}
                </a>
              </div>
            </div>

            <div
              className="contact-card"
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "14px",
                padding: "22px",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div style={{ fontWeight: 800, color: "#111827", marginBottom: "12px" }}>Send a message</div>
              <form onSubmit={handleContactSubmit}>
                <div className="contact-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <input
                    value={contactForm.name}
                    onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    style={{ padding: "12px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "0.95rem" }}
                  />
                  <input
                    value={contactForm.email}
                    onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Your email"
                    type="email"
                    style={{ padding: "12px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "0.95rem" }}
                  />
                </div>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Message"
                  rows={5}
                  style={{ marginTop: "12px", width: "100%", padding: "12px 12px", borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "0.95rem", resize: "vertical" }}
                />
                <button
                  type="submit"
                  style={{
                    marginTop: "12px",
                    width: "100%",
                    backgroundColor: "#111827",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
