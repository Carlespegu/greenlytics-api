import { CheckCircle2, Clock3 } from 'lucide-react';

import type { AiSimulationPhase, CreateMode, PlantAiProposal, PlantDraft, PhotoSlotKey, PlantPhotoDraft } from '@/modules/plants/types/plant.types';

interface PlantCreateSidebarProps {
  step: number;
  mode: CreateMode;
  proposal: PlantAiProposal;
  aiPhase: AiSimulationPhase;
  aiLog: string[];
  draft: PlantDraft;
  photosBySlot: Record<PhotoSlotKey, PlantPhotoDraft | null>;
  floweringMonths: number[];
  fertilizationSeasons: string[];
  canSave: boolean;
}

const phaseLabels: Record<AiSimulationPhase, string> = {
  idle: 'Sense executar',
  preparing: 'Preparant payload',
  sending: 'Enviant request',
  analyzing: 'Analitzant resposta',
  completed: 'Completat',
};

export function PlantCreateSidebar({
  step,
  mode,
  proposal,
  aiPhase,
  aiLog,
  draft,
  photosBySlot,
  floweringMonths,
  fertilizationSeasons,
  canSave,
}: PlantCreateSidebarProps) {
  const uploadedCount = Object.values(photosBySlot).filter(Boolean).length;
  const showProposal = mode === 'ai' && step === 2;
  const showSimulation = mode === 'ai' && step === 2;
  const showValidation = step === 3;

  return (
    <aside className="plant-create-v2__sidebar">
      {showProposal ? (
        <section className="plant-create-v2__sidebar-card plant-create-v2__sidebar-card--accent">
          <h4>Proposta IA</h4>
          <div className="plant-create-v2__info-list">
            <Info label="Confidence" value={proposal.confidence !== null ? `${Math.round(proposal.confidence * 100)}%` : 'Pendent'} />
            <Info label="Code" value={proposal.code ?? 'Pendents de simulacio'} />
            <Info label="Nom" value={proposal.name ?? 'Pendents de simulacio'} />
            <Info label="Nom cientific" value={proposal.scientificName ?? 'Pendents de simulacio'} />
            <Info label="Nom popular" value={proposal.commonName ?? 'Pendents de simulacio'} />
          </div>
          <small>Editable abans de guardar.</small>
        </section>
      ) : null}

      {showSimulation ? (
        <section className="plant-create-v2__sidebar-card">
          <h4>Estat de la crida</h4>
          <div className="plant-create-v2__log-box plant-create-v2__log-box--compact">
            <div className="plant-create-v2__request-state">
              <Clock3 size={16} />
              <span>{phaseLabels[aiPhase]}</span>
            </div>
            {aiLog.length === 0 ? <div className="plant-create-v2__muted">Encara no s&apos;ha simulat cap request.</div> : null}
            {aiLog.map((line, index) => <div key={`${line}-${index}`}>- {line}</div>)}
          </div>
        </section>
      ) : null}

      {showValidation ? (
        <section className="plant-create-v2__sidebar-card">
          <h4>Resum validacio</h4>
          <div className="plant-create-v2__validation-list">
            <StatusRow label="Code" ok={Boolean(draft.code.trim())} />
            <StatusRow label="Nom" ok={Boolean(draft.name.trim())} />
            <StatusRow label="Installacio" ok={Boolean(draft.installationId.trim())} />
            <StatusRow label="Nom cientific" ok={Boolean(draft.scientificName.trim())} />
            <StatusRow label="Nom popular" ok={Boolean(draft.commonName.trim())} />
            <StatusRow label="Fotos IA completes" ok={uploadedCount === 3} optional={mode !== 'ai'} />
            <StatusRow label="Floracio" ok={floweringMonths.length > 0} optional />
            <StatusRow label="Fertilitzacio" ok={fertilizationSeasons.length > 0} optional />
            <StatusRow label="Llest per guardar" ok={canSave} />
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="plant-create-v2__info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusRow({ label, ok, optional = false }: { label: string; ok: boolean; optional?: boolean }) {
  return (
    <div className="plant-create-v2__status-row">
      <span>{label}</span>
      <strong className={ok ? 'is-ok' : optional ? 'is-optional' : 'is-pending'}>
        {ok ? (
          <>
            <CheckCircle2 size={14} />
            <span>OK</span>
          </>
        ) : optional ? 'Opcional' : 'Pendent'}
      </strong>
    </div>
  );
}
