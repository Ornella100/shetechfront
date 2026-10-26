import { createBrowserRouter, Navigate } from "react-router-dom";
import HomePage from "./HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import ProfilPage from "./pages/ProfilPage";
import FormationsPage from "./pages/FormationsPage";
import FormationDetailPage from "./pages/FormationDetailPage";
import Projets from "./Projets";
import Community from "./Community";
import Certificats from "./Certificats";
import CoursDetail from "./pages/CoursDetail";
import { QuizFormationPage, QuizParcoursPage } from "./pages/QuizFinalPage";
import { CertificatFormationPage, CertificatParcoursPage } from "./pages/CertificatPage";
import AbonnementPage from "./pages/AbonnementPage";
import MarketplacePage from "./pages/MarketplacePage";
import MentoratPage from "./pages/MentoratPage";
import ActualitesPage from "./pages/ActualitesPage";
import AdminDashboard from "./AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/actualites", element: <ActualitesPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: "formations", element: <FormationsPage /> },
      { path: "formations/:formationId", element: <FormationDetailPage /> },
      { path: "formations/:formationId/quiz-final", element: <QuizFormationPage /> },
      { path: "formations/:formationId/certificat", element: <CertificatFormationPage /> },
      { path: "parcours/:parcoursId/quiz-final", element: <QuizParcoursPage /> },
      { path: "parcours/:parcoursId/certificat", element: <CertificatParcoursPage /> },
      { path: "abonnement", element: <AbonnementPage /> },
      { path: "marketplace", element: <MarketplacePage /> },
      { path: "mentorat", element: <MentoratPage /> },
      { path: "formations/:formationId/modules/:moduleId/cours/:coursId/lecons/:leconId", element: <CoursDetail /> },
      { path: "projets", element: <Projets /> },
      { path: "communaute", element: <Community /> },
      { path: "certificats", element: <Certificats /> },
      { path: "profil", element: <ProfilPage /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute><AdminDashboard /></AdminRoute>,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default router;
