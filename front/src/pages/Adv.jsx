import React from "react";
import "./Adv.css";

const advantages = [
  {
    icon: "💳",
    title: "Automated Payments",
    desc: "Upload fund hassle free to your account even through RTGS/NEFT/IMPS channels",
  },
  {
    icon: "📱",
    title: "Mobile Friendly",
    desc: "Do your business with ease on the go",
  },
  {
    icon: "🖥️",
    title: "API/XML",
    desc: "300+ Airlines 300,000+ Hotels with a single API integration",
  },
  {
    icon: "⚙️",
    title: "Post Booking Service Automation",
    desc: "Manage all your booking completely online",
  },
  {
    icon: "🌍",
    title: "Largest Network of global Airfares",
    desc: "Find fares from 40+ countries & book the best flight deals",
  },
  {
    icon: "🏨",
    title: "50+ Hotel Suppliers",
    desc: "Leverage the best technology to find the best worldwide hotel deals for your customers",
  },
];

const Adv = () => {
  return (
    <section className="advantages-section">
      <h2 className="advantages-title">LOGOIPSUM Advantages</h2>
      <div className="advantages-grid">
        {advantages.map((adv, index) => (
          <div className="advantage-card" key={index}>
            <div className="advantage-icon">{adv.icon}</div>
            <div className="advantage-text">
              <h3>{adv.title}</h3>
              <p>{adv.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Adv;
