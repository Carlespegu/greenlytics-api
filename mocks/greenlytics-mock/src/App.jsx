import { useMemo, useState } from "react";

export default function GreenLyticsPlantCreateMock() {
  const modes = [
    { id: "manual", label: "Alta manual", description: "Introdueix manualment el Code i el Nom." },
    { id: "ai", label: "Alta amb IA", description: "Puja 3 fotos i deixa que la IA proposi els camps." },
  ];

  const photoCards = [
    { key: "leaf", title: "1. Fulles i flors", hint: "Primer pla de fulles i, si n’hi ha, de la flor." },
    { key: "stem", title: "2. Tija", hint: "Foto de la tija o base per ajudar a la identificació." },
    { key: "general", title: "3. General", hint: "Vista completa de la planta i del seu port." },
  ];

  const months = ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"];
  const seasons = [
    { id: "winter", label: "Hivern" },
    { id: "spring", label: "Primavera" },
    { id: "summer", label: "Estiu" },
    { id: "autumn", label: "Tardor" },
  ];

  const installations = ["Hivernacle Nord", "Terrassa Oficina", "Zona Recepció", "Exterior Sud"];

  const initialForm = {
    code: "",
    name: "",
    installation: "",
    scientificName: "",
    commonName: "",
    notes: "",
    soilType: "",
    fertilizer: "",
    soilMoistureMin: "",
    soilMoistureMax: "",
    airHumidityMin: "",
    airHumidityMax: "",
    temperatureMin: "",
    temperatureMax: "",
    lightMin: "",
    lightMax: "",
  };

  const [mode, setMode] = useState("ai");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState({ leaf: null, stem: null, general: null });
  const [floweringMonths, setFloweringMonths] = useState([3, 4, 5, 6]);
  const [fertSeasons, setFertSeasons] = useState(["spring", "summer"]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiState, setAiState] = useState("idle");
  const [aiLog, setAiLog] = useState([]);
  const [proposal, setProposal] = useState({
    confidence: null,
    code: null,
    name: null,
    scientificName: null,
    commonName: null,
    notes: null,
  });
  const [saved, setSaved] = useState(false);

  const uploadedCount = Object.values(photos).filter(Boolean).length;
  const canRunAi = mode === "ai" && uploadedCount === 3 && !loadingAi;
  const manualComplete = form.code.trim() && form.name.trim();

  const currentStepConfig = useMemo(() => {
    if (mode === "manual") {
      return [
        { id: 1, label: "Dades obligatòries" },
        { id: 2, label: "Fitxa botànica" },
        { id: 3, label: "Paràmetres i validació" },
      ];
    }
    return [
      { id: 1, label: "Fotos i IA" },
      { id: 2, label: "Revisió proposta" },
      { id: 3, label: "Paràmetres i validació" },
    ];
  }, [mode]);

  const maxStep = currentStepConfig.length;

  function updateField(key, value) {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSelectMode(nextMode) {
    setMode(nextMode);
    setStep(1);
    setSaved(false);
  }

  function simulateAiCall() {
    if (!canRunAi) return;

    setLoadingAi(true);
    setAiState("sending");
    setSaved(false);
    setAiLog([
      "Preparant payload amb 3 imatges...",
      "Enviant request a OpenAI...",
    ]);

    window.setTimeout(() => {
      setAiState("analyzing");
      setAiLog((prev) => [...prev, "Analitzant fulles, tija i vista general...", "Generant proposta de Code i Nom..."]);
    }, 900);

    window.setTimeout(() => {
      const generated = {
        confidence: 0.91,
        code: "PLT-SPAT-001",
        name: "Espatifil",
        scientificName: "Spathiphyllum",
        commonName: "Llíri de la pau",
        notes: "Fulles una mica pàl·lides amb petites marques visibles. Es recomana revisar el reg i la llum indirecta.",
      };

      setProposal(generated);
      setForm((prev) => ({
        ...prev,
        code: prev.code || generated.code,
        name: prev.name || generated.name,
        scientificName: prev.scientificName || generated.scientificName,
        commonName: prev.commonName || generated.commonName,
        notes: prev.notes || generated.notes,
        soilMoistureMin: prev.soilMoistureMin || "40",
        soilMoistureMax: prev.soilMoistureMax || "65",
        airHumidityMin: prev.airHumidityMin || "50",
        airHumidityMax: prev.airHumidityMax || "75",
        temperatureMin: prev.temperatureMin || "16",
        temperatureMax: prev.temperatureMax || "28",
        lightMin: prev.lightMin || "2500",
        lightMax: prev.lightMax || "9000",
        soilType: prev.soilType || "Orgànic, drenat i lleugerament àcid",
        fertilizer: prev.fertilizer || "Fertilitzant líquid equilibrat",
      }));
      setFloweringMonths([3, 4, 5, 6]);
      setFertSeasons(["spring", "summer"]);
      setAiState("done");
      setAiLog((prev) => [...prev, "Resposta rebuda i camps preomplerts."]);
      setLoadingAi(false);
      setStep(2);
    }, 2200);
  }

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, maxStep));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  function toggleMonth(index) {
    setSaved(false);
    setFloweringMonths((prev) =>
      prev.includes(index) ? prev.filter((m) => m !== index) : [...prev, index].sort((a, b) => a - b)
    );
  }

  function toggleSeason(id) {
    setSaved(false);
    setFertSeasons((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleSave() {
    setSaved(true);
    setStep(maxStep);
  }

  const saveReady =
    form.code.trim() &&
    form.name.trim() &&
    form.installation.trim() &&
    form.scientificName.trim() &&
    form.commonName.trim();

  return (
    <div className="min-h-screen bg-[#06111d] text-white p-6 md:p-10">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-emerald-500/20 bg-[linear-gradient(180deg,_#071526_0%,_#04101b_100%)] shadow-2xl overflow-hidden">
        <div className="border-b border-white/10 px-8 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Alta de planta</h1>
              <p className="text-sm text-slate-400 mt-1">
                Flux interactiu per validar l’alta manual o amb IA, simulant el comportament normal de la pantalla final.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {mode === "manual" ? "Mode manual actiu" : "Mode IA actiu"}
            </div>
          </div>
        </div>

        <div className="px-8 pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {modes.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMode(item.id)}
                  className={`rounded-3xl border p-5 text-left transition ${
                    active
                      ? "border-emerald-400/40 bg-emerald-500/10 shadow-lg shadow-emerald-950/20"
                      : "border-white/10 bg-[#0b1b30] hover:border-emerald-400/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold">{item.label}</div>
                    <div className={`h-4 w-4 rounded-full border ${active ? "border-emerald-300 bg-emerald-400" : "border-slate-500"}`} />
                  </div>
                  <div className="text-sm text-slate-400 mt-2">{item.description}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {currentStepConfig.map((item) => {
              const active = step === item.id;
              const done = step > item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    active
                      ? "border-emerald-400/35 bg-emerald-500/10"
                      : done
                      ? "border-sky-400/25 bg-sky-500/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Pas {item.id}</div>
                  <div className="mt-1 font-medium">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-[1.35fr_0.9fr] gap-6 px-8 py-8">
          <div className="space-y-6">
            {mode === "manual" && step === 1 ? (
              <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
                <h2 className="text-lg font-semibold">Alta manual</h2>
                <p className="mt-1 text-sm text-slate-400">En aquest mode només cal començar per Code i Nom.</p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <InputField label="Code (obligatori)" value={form.code} onChange={(v) => updateField("code", v)} placeholder="PLANT-001" />
                  <InputField label="Nom (obligatori)" value={form.name} onChange={(v) => updateField("name", v)} placeholder="Nom de la planta" />
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={!manualComplete}
                    onClick={nextStep}
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${manualComplete ? "bg-emerald-500 text-black" : "bg-white/10 text-slate-500"}`}
                  >
                    Continuar
                  </button>
                </div>
              </section>
            ) : null}

            {mode === "ai" && step === 1 ? (
              <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Alta amb IA</h2>
                    <p className="text-sm text-slate-400 mt-1">Puja 3 fotos i simula la crida a OpenAI per preomplir la fitxa.</p>
                  </div>
                  <div className="rounded-xl bg-[#142742] px-3 py-2 text-xs text-slate-300">{uploadedCount}/3 fotos</div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {photoCards.map((card) => (
                    <div key={card.key} className="border border-dashed border-emerald-400/30 rounded-2xl p-4">
                      <div className="text-sm font-semibold">{card.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{card.hint}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setSaved(false);
                          setPhotos((prev) => ({ ...prev, [card.key]: `${card.title}.jpg` }));
                        }}
                        className="mt-3 w-full rounded-xl bg-[#142742] px-3 py-2 text-xs text-center hover:bg-[#18314f]"
                      >
                        {photos[card.key] ? photos[card.key] : "Simular upload"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-400">La simulació farà la proposta de Code, Nom, noms botànics i notes.</div>
                  <button
                    type="button"
                    onClick={simulateAiCall}
                    disabled={!canRunAi}
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${canRunAi ? "bg-emerald-500 text-black" : "bg-white/10 text-slate-500"}`}
                  >
                    {loadingAi ? "Analitzant..." : "Analitzar amb IA"}
                  </button>
                </div>
              </section>
            ) : null}

            {((mode === "manual" && step >= 2) || (mode === "ai" && step >= 2)) ? (
              <>
                <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
                  <h2 className="text-lg font-semibold">Dades comunes</h2>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <SelectField
                      label="Instal·lació"
                      value={form.installation}
                      onChange={(v) => updateField("installation", v)}
                      options={installations}
                      placeholder="Seleccionar instal·lació"
                    />
                    <InputField label="Nom científic" value={form.scientificName} onChange={(v) => updateField("scientificName", v)} placeholder="Ex. Spathiphyllum" />
                    <InputField label="Nom popular" value={form.commonName} onChange={(v) => updateField("commonName", v)} placeholder="Ex. Llíri de la pau" />
                    <InputField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="PLANT-001" />
                    <InputField label="Nom" value={form.name} onChange={(v) => updateField("name", v)} placeholder="Nom de la planta" />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm text-slate-300">Notes estat planta</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      className="w-full mt-1 bg-[#142742] rounded-xl p-3 text-sm min-h-[120px] outline-none"
                      placeholder="Observacions visibles, estat general, incidències..."
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
                  <h2 className="text-lg font-semibold">Necessitats i paràmetres</h2>
                  <p className="mt-1 text-sm text-slate-400">Aquests rangs serviran després per comparar les lectures dels dispositius.</p>

                  <div className="mt-5 space-y-5">
                    <RangeField
                      label="Humitat sòl"
                      minValue={form.soilMoistureMin}
                      maxValue={form.soilMoistureMax}
                      onMinChange={(v) => updateField("soilMoistureMin", v)}
                      onMaxChange={(v) => updateField("soilMoistureMax", v)}
                      minPlaceholder="Mín %"
                      maxPlaceholder="Màx %"
                    />
                    <RangeField
                      label="Humitat aire"
                      minValue={form.airHumidityMin}
                      maxValue={form.airHumidityMax}
                      onMinChange={(v) => updateField("airHumidityMin", v)}
                      onMaxChange={(v) => updateField("airHumidityMax", v)}
                      minPlaceholder="Mín %"
                      maxPlaceholder="Màx %"
                    />
                    <RangeField
                      label="Temperatura"
                      minValue={form.temperatureMin}
                      maxValue={form.temperatureMax}
                      onMinChange={(v) => updateField("temperatureMin", v)}
                      onMaxChange={(v) => updateField("temperatureMax", v)}
                      minPlaceholder="Mín °C"
                      maxPlaceholder="Màx °C"
                    />
                    <RangeField
                      label="Llum"
                      minValue={form.lightMin}
                      maxValue={form.lightMax}
                      onMinChange={(v) => updateField("lightMin", v)}
                      onMaxChange={(v) => updateField("lightMax", v)}
                      minPlaceholder="Mín lux"
                      maxPlaceholder="Màx lux"
                    />
                  </div>

                  <div className="mt-5 grid md:grid-cols-2 gap-4">
                    <InputField label="Tipus sòl" value={form.soilType} onChange={(v) => updateField("soilType", v)} placeholder="Orgànic, drenat, àcid..." />
                    <InputField label="Fertilitzant" value={form.fertilizer} onChange={(v) => updateField("fertilizer", v)} placeholder="NPK, orgànic, líquid..." />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#12233b] p-4">
                      <div className="text-sm font-medium text-slate-200">Floració</div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                        {months.map((month, index) => {
                          const active = floweringMonths.includes(index);
                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => toggleMonth(index)}
                              className={`rounded-xl border px-2 py-2 text-center transition ${
                                active
                                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                                  : "border-white/8 bg-white/[0.03] text-slate-400"
                              }`}
                            >
                              {month}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#12233b] p-4">
                      <div className="text-sm font-medium text-slate-200">Època fertilització</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {seasons.map((season) => {
                          const active = fertSeasons.includes(season.id);
                          return (
                            <button
                              key={season.id}
                              type="button"
                              onClick={() => toggleSeason(season.id)}
                              className={`rounded-xl border px-2 py-3 text-center transition ${
                                active
                                  ? "border-amber-300/30 bg-amber-400/15 text-amber-100"
                                  : "border-white/8 bg-white/[0.03] text-slate-400"
                              }`}
                            >
                              {season.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
              <h2 className="text-lg font-semibold">Proposta IA</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Info label="Confidence" value={proposal.confidence ?? "-"} />
                <Info label="Code" value={proposal.code ?? "Pendents de simulació"} />
                <Info label="Nom" value={proposal.name ?? "Pendents de simulació"} />
                <Info label="Nom científic" value={proposal.scientificName ?? "Pendents de simulació"} />
                <Info label="Nom popular" value={proposal.commonName ?? "Pendents de simulació"} />
              </div>
              <div className="mt-4 text-xs text-slate-400">Editable abans de guardar.</div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
              <h2 className="text-lg font-semibold">Simulació de crida</h2>
              <div className="mt-3 rounded-xl bg-[#142742] p-3 text-xs text-slate-300 min-h-[140px] space-y-2">
                <div>Estat: {aiState === "idle" ? "Sense executar" : aiState === "sending" ? "Enviant request" : aiState === "analyzing" ? "Analitzant resposta" : "Completat"}</div>
                {aiLog.length === 0 ? <div className="text-slate-500">Encara no s’ha simulat cap request.</div> : null}
                {aiLog.map((line, index) => (
                  <div key={`${line}-${index}`}>• {line}</div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
              <h2 className="text-lg font-semibold">Resum validació</h2>
              <div className="mt-4 space-y-3 text-sm">
                <StatusRow label="Code" ok={!!form.code.trim()} />
                <StatusRow label="Nom" ok={!!form.name.trim()} />
                <StatusRow label="Instal·lació" ok={!!form.installation.trim()} />
                <StatusRow label="Nom científic" ok={!!form.scientificName.trim()} />
                <StatusRow label="Nom popular" ok={!!form.commonName.trim()} />
                <StatusRow label="Fotos IA completes" ok={uploadedCount === 3} optional={mode !== "ai"} />
              </div>
            </section>

            {saved ? (
              <section className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
                <h2 className="text-lg font-semibold text-sky-100">Alta simulada correctament</h2>
                <p className="mt-2 text-sm text-sky-50/90">La planta ha quedat preparada per associar lectures de dispositius i futures alertes.</p>
              </section>
            ) : null}
          </aside>
        </div>

        <div className="border-t border-white/10 px-8 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-400">Mock funcional per validar UX, flux i integració posterior amb backend real.</div>
          <div className="flex gap-3">
            <button type="button" onClick={prevStep} disabled={step === 1} className={`px-4 py-2 rounded-xl ${step === 1 ? "bg-white/5 text-slate-600" : "bg-white/10"}`}>
              Enrere
            </button>
            {step < maxStep ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={mode === "manual" ? (step === 1 && !manualComplete) : (step === 1 || false)}
                className={`px-4 py-2 rounded-xl ${
                  mode === "manual"
                    ? step === 1 && !manualComplete
                      ? "bg-white/10 text-slate-500"
                      : "bg-emerald-500 text-black"
                    : step === 1
                    ? "bg-white/10 text-slate-500"
                    : "bg-emerald-500 text-black"
                }`}
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveReady}
                className={`px-4 py-2 rounded-xl ${saveReady ? "bg-emerald-500 text-black" : "bg-white/10 text-slate-500"}`}
              >
                Guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-[#142742] rounded-xl p-2.5 text-sm outline-none border border-transparent focus:border-emerald-400/40"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-[#142742] rounded-xl p-2.5 text-sm outline-none border border-transparent focus:border-emerald-400/40"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeField({ label, minValue, maxValue, onMinChange, onMaxChange, minPlaceholder, maxPlaceholder }) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <input
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={minPlaceholder}
          className="w-full bg-[#142742] rounded-xl p-2.5 text-sm outline-none border border-transparent focus:border-emerald-400/40"
        />
        <input
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={maxPlaceholder}
          className="w-full bg-[#142742] rounded-xl p-2.5 text-sm outline-none border border-transparent focus:border-emerald-400/40"
        />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 bg-[#142742] p-2.5 rounded-xl">
      <span className="text-slate-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function StatusRow({ label, ok, optional = false }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#142742] p-2.5">
      <span className="text-slate-300">{label}</span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-300" : optional ? "text-slate-500" : "text-amber-300"}`}>
        {ok ? "OK" : optional ? "Opcional" : "Pendent"}
      </span>
    </div>
  );
}
