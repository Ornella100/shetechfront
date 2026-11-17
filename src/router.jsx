/* eslint-disable react-refresh/only-export-components -- un composant de configuration de routes est exporté, pas une page. */
import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const HomePage = lazy(() => import("./HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const FormationsPage = lazy(() => import("./pages/FormationsPage"));
const FormationDetailPage = lazy(() => import("./pages/FormationDetailPage"));
const Projets = lazy(() => import("./Projets"));
const Community = lazy(() => import("./Community"));
const Certificats = lazy(() => import("./Certificats"));
const CoursDetail = lazy(() => import("./pages/CoursDetail"));
const QuizFormationPage = lazy(() => import("./pages/QuizFinalPage").then((module) => ({ default: module.QuizFormationPage })));
const QuizParcoursPage = lazy(() => import("./pages/QuizFinalPage").then((module) => ({ default: module.QuizParcoursPage })));
const CertificatFormationPage = lazy(() => import("./pages/CertificatPage").then((module) => ({ default: module.CertificatFormationPage })));
const CertificatParcoursPage = lazy(() => import("./pages/CertificatPage").then((module) => ({ default: module.CertificatParcoursPage })));
const AbonnementPage = lazy(() => import("./pages/AbonnementPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));
const MentoratPage = lazy(() => import("./pages/MentoratPage"));
const ActualitesPage = lazy(() => import("./pages/ActualitesPage"));
const AdminDashboard = lazy(() => import("./AdminDashboard"));

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
