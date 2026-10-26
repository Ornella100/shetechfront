import { useState, useEffect } from "react";
import CertificatForm from "./CertificatForm";
import homeHero from "./assets/home-hero.png";
import api from "./lib/api";
const ACCENT = "#C45C7A";

/* ─────────────────────────────────────────────
   PAGE QUIZ
───────────────────────────────────────────── */
function QuizRunner({ title, subtitle, questionsUrl, submitUrl, backLabel = "â Retour", onBack, onReussi }) {
  const [questions, setQuestions] = useState([]);
  const [reponses, setReponses] = useState({});
  const [resultat, setResultat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api
      .get(questionsUrl)
      .then((res) => { setQuestions(res.data); setLoading(false); })
      .catch(() => { setErreur("Impossible de charger le quiz."); setLoading(false); });
  }, [questionsUrl]);

  const handleReponse = (questionId, option) => {
    if (resultat) return;
    setReponses((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSoumettre = async () => {
    if (Object.keys(reponses).length < questions.length) {
      alert("Veuillez répondre à toutes les questions avant de soumettre.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post(submitUrl, { reponses });
      setResultat(res.data);
      if (res.data.reussi) onReussi?.();
    } catch {
      setErreur("Erreur lors de la soumission du quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReessayer = () => {
    setReponses({});
    setResultat(null);
    setErreur("");
  };

  if (loading) return (
    <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
      Chargement du quiz...
    </div>
  );

  if (erreur) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <p style={{ color: "#ef4444", marginBottom: 16 }}>{erreur}</p>
      <button onClick={onBack} style={btnSecondaire}>â Retour</button>
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>Aucune question disponible pour ce quiz.</p>
      <button onClick={onBack} style={btnSecondaire}>â Retour</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <button onClick={onBack} style={btnSecondaire}>â Retour au module</button>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "16px 0 6px" }}>
          {title}
        </h2>
        <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
          {subtitle || `${questions.length} question${questions.length > 1 ? "s" : ""} - Score minimum requis : 70%`}
        </p>
      </div>

      {resultat && (
        <div style={{
          background: resultat.reussi ? "#f0fdf4" : "#fef2f2",
          border: `1.5px solid ${resultat.reussi ? "#86efac" : "#fca5a5"}`,
          borderRadius: 10, padding: "24px", marginBottom: 28, textAlign: "center",
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: resultat.reussi ? "#15803d" : "#dc2626", margin: "0 0 6px" }}>
            {resultat.reussi ? "Felicitations !" : "Essai insuffisant"}
          </h3>
          <p style={{ color: resultat.reussi ? "#166534" : "#991b1b", fontSize: 14, margin: "0 0 16px" }}>
            Score : {resultat.score}/100 - {resultat.correct}/{resultat.total} bonnes reponses
          </p>
          <p style={{ color: "#4b5563", fontSize: 13, margin: "0 0 20px" }}>{resultat.message}</p>
          {!resultat.reussi && (
            <button onClick={handleReessayer} style={btnPrimaire}>Reessayer le quiz</button>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q, idx) => {
          const repUser = reponses[q.id];
          const detail = resultat?.details?.find((d) => d.id === q.id);
          const options = [
            { key: "a", label: q.option_a },
            { key: "b", label: q.option_b },
            { key: "c", label: q.option_c },
            { key: "d", label: q.option_d },
          ].filter((o) => o.label);

          return (
            <div key={q.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", padding: "22px 24px" }}>
              <p style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 16, lineHeight: 1.5 }}>
                <span style={{ color: ACCENT, marginRight: 8 }}>Q{idx + 1}.</span>
                {q.question}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {options.map((opt) => {
                  let bg = "#f9fafb", border = "1px solid #e5e7eb", color = "#374151";
                  if (resultat && detail) {
                    if (opt.key === detail.reponse_correcte) { bg = "#f0fdf4"; border = "1.5px solid #86efac"; color = "#15803d"; }
                    else if (opt.key === detail.reponse_user && !detail.correct) { bg = "#fef2f2"; border = "1.5px solid #fca5a5"; color = "#dc2626"; }
                  } else if (repUser === opt.key) {
                    bg = "#fff5f7"; border = `1.5px solid ${ACCENT}`; color = ACCENT;
                  }
                  return (
                    <button key={opt.key} onClick={() => handleReponse(q.id, opt.key)} disabled={!!resultat}
                      style={{ background: bg, border, borderRadius: 7, padding: "11px 16px", textAlign: "left",
                        cursor: resultat ? "default" : "pointer", fontSize: 14, color,
                        fontWeight: repUser === opt.key || (resultat && opt.key === detail?.reponse_correcte) ? 600 : 400,
                        fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%",
                        background: repUser === opt.key ? ACCENT : "#e5e7eb",
                        color: repUser === opt.key ? "#fff" : "#9ca3af",
                        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center",
                        justifyContent: "center", flexShrink: 0 }}>
                        {opt.key.toUpperCase()}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {resultat && detail?.explication && (
                <div style={{ marginTop: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 6, borderLeft: `3px solid ${ACCENT}` }}>
                  <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>
                    <strong>Explication :</strong> {detail.explication}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!resultat && (
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 14 }}>
            {Object.keys(reponses).length}/{questions.length} réponse{Object.keys(reponses).length > 1 ? "s" : ""} donnée{Object.keys(reponses).length > 1 ? "s" : ""}
          </p>
          <button onClick={handleSoumettre}
            disabled={submitting || Object.keys(reponses).length < questions.length}
            style={{ ...btnPrimaire,
              opacity: Object.keys(reponses).length < questions.length ? 0.5 : 1,
              cursor: Object.keys(reponses).length < questions.length ? "not-allowed" : "pointer" }}>
            {submitting ? "Soumission en cours..." : "Soumettre mes reponses"}
          </button>
        </div>
      )}
    </div>
  );
}

const btnPrimaire = {
  padding: "11px 28px", background: ACCENT, color: "#fff",
  border: "none", borderRadius: 7, fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.18s",
};

const btnSecondaire = {
  padding: "8px 16px", background: "transparent", color: "#6b7280",
  border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13,
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};

/* ─────────────────────────────────────────────
   FORMATION DETAIL
───────────────────────────────────────────── */
export default function FormationDetail({ formation, domaine, onBack }) {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLecon, setSelectedLecon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);
  const [quizStatus, setQuizStatus] = useState({});
  const [quizExiste, setQuizExiste] = useState({});
  const [vueQuiz, setVueQuiz] = useState(false);
  const [vueQuizFinal, setVueQuizFinal] = useState(false);
  const [quizFinal, setQuizFinal] = useState({ existe: false, reussi: false, score: null });
  const [showCertificatForm, setShowCertificatForm] = useState(false);
  const [progressionFormation, setProgressionFormation] = useState(0);


  useEffect(() => {
    if (!formation) return;
    setModules([]);
    setSelectedModule(null);
    setExpandedModule(null);
    setSelectedLecon(null);
    setLoading(true);
    setVueQuiz(false);
    setVueQuizFinal(false);

    api.get(`/formations/${formation.id}/quiz-final/status`)
      .then((r) => setQuizFinal({ existe: r.data.existe, reussi: r.data.reussi, score: r.data.score }))
      .catch(() => setQuizFinal({ existe: false, reussi: false, score: null }));

    api.get(`/formations/${formation.id}`)
      .then((res) => {
        const mods = res.data.modules || [];
        setModules(mods);

        if (mods.length > 0) {
          const premierModule = mods[0];
          setSelectedModule(premierModule.id);
          setExpandedModule(premierModule.id);

          const premieresLecons = premierModule.lecons || [];
          if (premieresLecons.length > 0) {
            setSelectedLecon(premieresLecons[0].id);
          }
        }

        mods.forEach((mod) => {
          api.get(`/modules/${mod.id}/quiz`)
            .then((r) => setQuizExiste((prev) => ({ ...prev, [mod.id]: r.data.length > 0 })))
            .catch(() => {});

          api.get(`/modules/${mod.id}/quiz-status`)
            .then((r) => setQuizStatus((prev) => ({ ...prev, [mod.id]: r.data.valide })))
            .catch(() => {});
        });

        api.get(`/formations/${formation.id}/progression-calculee`)
          .then((r) => setProgressionFormation(r.data.pourcentage || 0))
          .catch(() => {});
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [formation?.id]);

  useEffect(() => {
    if (!formation?.id || !selectedLecon) return;

    api.post(`/lecons/${selectedLecon}/terminer`, {})
      .then(() => api.get(`/formations/${formation.id}/progression-calculee`))
      .then((res) => setProgressionFormation(res.data.pourcentage || 0))
      .catch(() => {});
  }, [formation?.id, selectedLecon]);

  const handleSelectModule = (moduleId) => {
    if (moduleId === selectedModule) return;
    setSelectedModule(moduleId);
    setExpandedModule(moduleId);
    setVueQuiz(false);

    const mod = modules.find((m) => m.id === moduleId);
    const leconsMod = mod?.lecons || [];
    setSelectedLecon(leconsMod.length > 0 ? leconsMod[0].id : null);
  };

  const handleSelectLecon = (leconId) => {
    setSelectedLecon(leconId);
    setVueQuiz(false);
  };

  const isModuleDebloque = (index) => {
    if (index === 0) return true;
    const modulePrecedent = modules[index - 1];
    if (!modulePrecedent) return false;
    if (!quizExiste[modulePrecedent.id]) return true;
    return quizStatus[modulePrecedent.id] === true;
  };

  const getYoutubeId = (url) => {
    if (!url) return "";
    try {
      if (url.includes("youtube.com/watch?v=")) {
        const id = url.split("v=")[1];
        return id ? id.split("&")[0] : "";
      }
      if (url.includes("youtu.be/")) {
        return url.split("youtu.be/")[1].split("?")[0];
      }
    } catch {}
    return "";
  };

  const currentModule = modules.find((m) => m.id === selectedModule);
  const currentModuleIndex = modules.findIndex((m) => m.id === selectedModule);
  const leconsDuModule = currentModule?.lecons || [];
  const currentLecon = leconsDuModule.find((l) => l.id === selectedLecon);

  // ✅ CORRECTION : combiner video_url de la leçon + table videos
  const videos = [
    ...(currentLecon?.video_url
      ? [{ id: "main", titre: currentLecon.titre, url: currentLecon.video_url, description: currentLecon.contenu_texte }]
      : []),
    ...(currentLecon?.videos || []),
  ];

  const moduleDebloque = isModuleDebloque(currentModuleIndex);
  const quizInfosChargees = modules.length > 0 && modules.every((module) =>
    Object.prototype.hasOwnProperty.call(quizExiste, module.id)
  );
  const formationTerminee = quizInfosChargees && modules.every((module) => {
    if (!quizExiste[module.id]) return true;
    return quizStatus[module.id] === true;
  });
  const formationPourCertificat = {
    ...formation,
    domaine: domaine?.titre || formation.domaine || formation.domaine_id,
  };

  if (!formation) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#6b7280", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      Chargement...
    </div>
  );

  if (vueQuizFinal) {
    return (
      <div className="st-soft-page" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "#1A0F14", borderBottom: `3px solid ${ACCENT}`, padding: "20px 40px" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>{formation.titre}</h1>
        </div>
        <QuizRunner
          title={`Quiz final — ${formation.titre}`}
          questionsUrl={`/formations/${formation.id}/quiz-final`}
          submitUrl={`/formations/${formation.id}/quiz-final/soumettre`}
          onBack={() => setVueQuizFinal(false)}
          onReussi={() => {
            setQuizFinal((prev) => ({ ...prev, reussi: true }));
            setVueQuizFinal(false);
          }}
        />
      </div>
    );
  }

  if (vueQuiz && currentModule) {
    return (
      <div className="st-soft-page" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "#1A0F14", borderBottom: `3px solid ${ACCENT}`, padding: "20px 40px" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>{formation.titre}</h1>
        </div>
        <QuizRunner
          title={`Quiz — ${currentModule.titre}`}
          questionsUrl={`/modules/${currentModule.id}/quiz`}
          submitUrl={`/modules/${currentModule.id}/quiz/soumettre`}
          onBack={() => setVueQuiz(false)}
          onReussi={() => {
            setQuizStatus((prev) => ({ ...prev, [currentModule.id]: true }));
            api.get(`/formations/${formation.id}/progression-calculee`)
              .then((res) => setProgressionFormation(res.data.pourcentage || 0))
              .catch(() => {});
            setVueQuiz(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="st-soft-page" style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div
        className="st-learning-hero"
        style={{
          background: `linear-gradient(115deg, rgba(26,15,20,0.94) 0%, rgba(74,25,66,0.78) 58%, rgba(26,15,20,0.55) 100%), url(${homeHero}) center/cover`,
          borderBottom: `3px solid ${ACCENT}`,
          padding: "24px 40px 28px",
        }}
      >
        <button onClick={onBack} style={{ background: "transparent", color: "rgba(255,255,255,0.5)",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
          padding: 0, marginBottom: 18, fontFamily: "inherit" }}>
          â Retour
        </button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.3px" }}>
          {formation.titre}
        </h1>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.6 }}>
          {formation.description}
        </p>
        <div style={{ marginTop: 18, maxWidth: 420, background: "rgba(255,255,255,0.10)", borderRadius: 999, height: 8, overflow: "hidden" }}>
          <div style={{
            width: `${progressionFormation}%`,
            height: "100%",
            background: ACCENT,
            transition: "width 0.4s ease",
          }} />
        </div>
        <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.62)", fontSize: 12 }}>
          Progression : {progressionFormation}%
        </p>
        {formationTerminee && quizFinal.existe && !quizFinal.reussi && (
          <button
            type="button"
            onClick={() => setVueQuizFinal(true)}
            style={{
              marginTop: 18,
              background: ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Passer le quiz final
          </button>
        )}
        {formationTerminee && (!quizFinal.existe || quizFinal.reussi) && (
          <button
            type="button"
            onClick={() => setShowCertificatForm(true)}
            style={{
              marginTop: 18,
              background: ACCENT,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Obtenir mon certificat
          </button>
        )}
      </div>

      {/* Layout */}
      <div className="st-learning-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Sidebar */}
        <div className="st-learning-sidebar" style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "20px", height: "fit-content" }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: "#111827", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Programme
          </h3>

          {loading ? (
            <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>Chargement...</p>
          ) : modules.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>Aucun module disponible.</p>
          ) : (
            modules.map((module, index) => {
              const debloque = isModuleDebloque(index);
              const quizOk = quizStatus[module.id];
              const aQuiz = quizExiste[module.id];
              const leconsMod = module.lecons || [];

              return (
                <div key={module.id} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => { if (!debloque) return; handleSelectModule(module.id); }}
                    style={{
                      width: "100%", padding: "11px 14px",
                      background: !debloque ? "#f3f4f6" : selectedModule === module.id && !vueQuiz ? "#1A0F14" : "#f9fafb",
                      color: !debloque ? "#9ca3af" : selectedModule === module.id && !vueQuiz ? "#fff" : "#374151",
                      border: selectedModule === module.id && !vueQuiz ? "none" : "1px solid #e5e7eb",
                      borderRadius: 6, cursor: debloque ? "pointer" : "not-allowed",
                      fontSize: 13, fontWeight: 600, textAlign: "left",
                      transition: "all 0.18s", fontFamily: "inherit",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
                    }}>
                    <span style={{ flex: 1 }}>{module.titre}</span>
                    {!debloque && <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>Verrouille</span>}
                    {debloque && aQuiz && quizOk && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Quiz valide</span>}
                  </button>

                  {expandedModule === module.id && debloque && (
                    <div style={{ marginTop: 4, paddingLeft: 8 }}>
                      {leconsMod.map((lecon) => (
                        <button key={lecon.id}
                          onClick={() => handleSelectLecon(lecon.id)}
                          style={{
                            width: "100%", padding: "9px 12px",
                            background: selectedLecon === lecon.id && !vueQuiz ? "#fff5f7" : "transparent",
                            color: selectedLecon === lecon.id && !vueQuiz ? ACCENT : "#6b7280",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontSize: 13, textAlign: "left", marginBottom: 2,
                            transition: "all 0.18s",
                            borderLeft: selectedLecon === lecon.id && !vueQuiz ? `3px solid ${ACCENT}` : "3px solid transparent",
                            fontFamily: "inherit",
                            fontWeight: selectedLecon === lecon.id && !vueQuiz ? 600 : 400,
                          }}>
                          {lecon.titre}
                        </button>
                      ))}

                      {aQuiz && (
                        <button
                          onClick={() => { setSelectedModule(module.id); setVueQuiz(true); }}
                          style={{
                            width: "100%", padding: "9px 12px",
                            background: vueQuiz && selectedModule === module.id ? (quizOk ? "#f0fdf4" : "#fff5f7") : "transparent",
                            color: quizOk ? "#16a34a" : ACCENT,
                            border: "none", borderRadius: 6, cursor: "pointer",
                            fontSize: 13, textAlign: "left", marginBottom: 2,
                            transition: "all 0.18s",
                            borderLeft: `3px solid ${quizOk ? "#86efac" : ACCENT}`,
                            fontFamily: "inherit", fontWeight: 600,
                          }}>
                          {quizOk ? "Quiz valide" : "Quiz du module"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contenu principal */}
        <div className="st-learning-content" style={{ background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", padding: "32px" }}>

          {!moduleDebloque ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <h3 style={{ color: "#111827", fontWeight: 700, marginBottom: 8 }}>Module verrouille</h3>
              <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 360, margin: "0 auto" }}>
                Reussissez le quiz du module precedent avec un score d'au moins 70% pour debloquer ce module.
              </p>
            </div>
          ) : currentLecon ? (
            <div>
              {/* En-tête leçon */}
              <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                  {currentModule?.titre}
                </p>
                <h2 style={{ margin: 0, color: "#111827", fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
                  {currentLecon.titre}
                </h2>
              </div>

              {/* Vidéos */}
              {videos.length > 0 ? (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ color: "#111827", marginBottom: 16, fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Vidéos
                  </h3>
                  {videos.map((video) => {
                    const videoId = getYoutubeId(video.url);
                    return (
                      <div key={video.id} style={{ marginBottom: 24 }}>
                        <div style={{ background: "#000", borderRadius: 8, overflow: "hidden", marginBottom: 14, aspectRatio: "16 / 9" }}>
                          {videoId ? (
                            <iframe
                              width="100%" height="100%"
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={video.titre} frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen style={{ display: "block" }}
                            />
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#fff", fontSize: 13 }}>
                              URL vidéo invalide
                            </div>
                          )}
                        </div>
                        <h4 style={{ margin: "0 0 8px 0", color: "#111827", fontSize: 15, fontWeight: 600 }}>{video.titre}</h4>
                        {video.description && <p style={{ color: "#4b5563", fontSize: 13, lineHeight: 1.65, margin: "0 0 8px" }}>{video.description}</p>}
                        {video.duree && <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>Durée : {video.duree}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "#f9fafb", padding: "24px", borderRadius: 8, textAlign: "center", border: "1px solid #e5e7eb", marginBottom: 24 }}>
                  <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Aucune vidéo disponible pour cette leçon.</p>
                </div>
              )}

              {/* Contenu texte */}
              {currentLecon.contenu_texte && (
                <div style={{ paddingTop: 24, borderTop: "1px solid #f3f4f6" }}>
                  <h3 style={{ color: "#111827", marginBottom: 16, fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Contenu
                  </h3>
                  <div style={{ color: "#374151", lineHeight: 1.8, fontSize: 14 }}>
                    {currentLecon.contenu_texte}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "80px 20px" }}>
              <p style={{ fontSize: 14 }}>Sélectionnez une leçon pour commencer</p>
            </div>
          )}
        </div>
      </div>
      {showCertificatForm && (
        <CertificatForm
          formation={formationPourCertificat}
          onClose={() => setShowCertificatForm(false)}
        />
      )}
    </div>
  );
}

