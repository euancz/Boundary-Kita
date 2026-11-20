import Brand from "./Brand";
import { MapPin } from "lucide-react";
import jeepneyIllustration from "../assets/mabalacat-jeepney-profile.webp";
import "../styles/login.css";

export default function LoginLayout({ children }) {
  return (
    <main className="login-screen">
      <div className="login-frame">
        <section className="login-panel">
          <header className="login-brand"><Brand /></header>
          <div className="login-content">{children}</div>
        </section>
        <figure className="login-artwork">
          <img src={jeepneyIllustration} alt="Side-profile illustration of a traditional Filipino jeepney" width="1440" height="480" />
          <figcaption><MapPin size={15} aria-hidden="true" /> Mabalacat, Pampanga</figcaption>
        </figure>
      </div>
    </main>
  );
}
