import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/authStore";
import AbonnementBanner from "../components/AbonnementBanner";
import MessagerieWidget from "../components/MessagerieWidget";

const BASE_MENU = [
  { to: "/dashboard", label: "Tableau de bord", icon: "", end: true },
  { to: "/dashboard/formations", label: "Formations", icon: "" },
  { to: "/dashboard/projets", label: "Mes projets", icon: "" },
  { to: "/dashboard/communaute", label: "Communauté", icon: "" },
  { to: "/dashboard/certificats", label: "Certificats", icon: "" },
  { to: "/dashboard/abonnement", label: "Abonnement", icon: "" },
  { to: "/dashboard/marketplace", label: "Marketplace", icon: "" },
  { to: "/dashboard/mentorat", label: "Mentorat", icon: "" },
  { to: "/actualites", label: "Actualités", icon: "" },
  { to: "/dashboard/profil", label: "Mon profil", icon: "" },
];

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user?.nom
    ? user.nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  const menuItems = [
    ...BASE_MENU,
    ...(user?.role === "admin" ? [{ to: "/admin", label: "Administration", icon: "⚙️" }] : []),
  ];

  return (
    <div className={`dash-shell${collapsed ? " is-collapsed" : ""}`}>
      <aside className="dash-sidebar">
        <div className="dash-sidebar-head">
          <button className="dash-logo" type="button" onClick={() => navigate("/dashboard")}>
            {collapsed ? <span>ST</span> : <><span>She</span>Tech</>}
          </button>
          <button
            className="dash-toggle"
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
            title={collapsed ? "Déplier le menu" : "Replier le menu"}
          >
            ‹
          </button>
        </div>

        <nav className="dash-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-user">
          <div>{initials}</div>
          <section>
            <strong>{user?.nom}</strong>
            <span>Niveau {user?.niveau || 1}</span>
          </section>
        </div>
      </aside>

      <main className="dash-main">
        <AbonnementBanner />
        <Outlet />
      </main>

      <MessagerieWidget />
    </div>
  );
}
