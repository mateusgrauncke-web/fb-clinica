"use client";
import SairButton from "@/app/components/SairButton";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays, ChartNoAxesColumn, Wallet, Users, UserRound,
  Settings, Search, Plus, Pencil, X, UserCircle2,
  RefreshCw, AlertCircle, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Patient = {
  id: string;
  nome: string;
  data_nascimento: string | null;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  sexo: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  contato_emergencia: string | null;
  telefone_emergencia: string | null;
  observacoes: string | null;
  ativo: boolean;
};

type PatientForm = { [K in keyof Omit<Patient, "id">]: NonNullable<Omit<Patient, "id">[K]> };
const emptyForm: PatientForm = {
  nome: "", data_nascimento: "", cpf: "", telefone: "", whatsapp: "", email: "",
  sexo: "", endereco: "", cidade: "", estado: "", contato_emergencia: "",
  telefone_emergencia: "", observacoes: "", ativo: true,
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("pacientes")
        .select("id,nome,data_nascimento,cpf,telefone,whatsapp,email,sexo,endereco,cidade,estado,contato_emergencia,telefone_emergencia,observacoes,ativo")
        .order("nome", { ascending: true });
      if (queryError) throw queryError;
      setPatients((data ?? []) as Patient[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar os pacientes.";
      setError(message.includes("Configure as variáveis")
        ? message
        : `Não foi possível consultar pacientes. Verifique as permissões RLS da tabela pacientes no Supabase. Detalhe: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPatients(); }, [loadPatients]);

  const filtered = useMemo(() => patients.filter((patient) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const matches = !term || [patient.nome, patient.cpf, patient.telefone, patient.whatsapp, patient.email]
      .some((value) => (value ?? "").toLocaleLowerCase("pt-BR").includes(term));
    return matches && (showInactive || patient.ativo);
  }), [patients, search, showInactive]);

  function openNew() {
    setEditing(null); setForm(emptyForm); setError(""); setSuccess(""); setModalOpen(true);
  }
  function openEdit(patient: Patient) {
    setEditing(patient.id);
    setForm({ ...patient, data_nascimento: patient.data_nascimento ?? "", cpf: patient.cpf ?? "", telefone: patient.telefone ?? "", whatsapp: patient.whatsapp ?? "", email: patient.email ?? "", sexo: patient.sexo ?? "", endereco: patient.endereco ?? "", cidade: patient.cidade ?? "", estado: patient.estado ?? "", contato_emergencia: patient.contato_emergencia ?? "", telefone_emergencia: patient.telefone_emergencia ?? "", observacoes: patient.observacoes ?? "" });
    setError(""); setSuccess(""); setModalOpen(true);
  }
  function updateField<K extends keyof PatientForm>(key: K, value: PatientForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function savePatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.nome.trim()) { setError("Informe o nome do paciente."); return; }
    setSaving(true); setError(""); setSuccess("");
    const payload = {
      ...form,
      nome: form.nome.trim(),
      data_nascimento: form.data_nascimento || null,
      cpf: form.cpf || null, telefone: form.telefone || null, whatsapp: form.whatsapp || null,
      email: form.email || null, sexo: form.sexo || null, endereco: form.endereco || null,
      cidade: form.cidade || null, estado: form.estado || null,
      contato_emergencia: form.contato_emergencia || null,
      telefone_emergencia: form.telefone_emergencia || null,
      observacoes: form.observacoes || null,
    };
    try {
      const supabase = createClient();
      const result = editing
        ? await supabase.from("pacientes").update(payload).eq("id", editing)
        : await supabase.from("pacientes").insert(payload);
      if (result.error) throw result.error;
      setModalOpen(false);
      setSuccess(editing ? "Cadastro atualizado com sucesso." : "Paciente cadastrado com sucesso.");
      await loadPatients();
    } catch (err) {
      setError(err instanceof Error ? `Não foi possível salvar. Verifique as permissões RLS da tabela pacientes. Detalhe: ${err.message}` : "Não foi possível salvar o cadastro.");
    } finally { setSaving(false); }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Voltar ao painel">
          <Image src="/logo-fb.png" alt="Fabiana Bruinsma Pilates e Fisioterapia" width={380} height={190} className="brand-full" priority />
          <Image src="/icon.png" alt="FB Clínica" width={48} height={48} className="brand-compact" />
        </Link>
        <div className="side-label">MENU PRINCIPAL</div>
        <nav>
          <Link className="nav-item" href="/"><ChartNoAxesColumn size={18} /> Visão geral</Link>
          <Link className="nav-item active" href="/pacientes"><Users size={18} /> Pacientes</Link>
          <Link className="nav-item" href="/profissionais"><UserRound size={18} /> Profissionais</Link>
          <Link className="nav-item" href="/agenda"><CalendarDays size={18} /> Agenda</Link>
          <Link className="nav-item" href="/financeiro"><Wallet size={18} /> Financeiro</Link>
        </nav>
        <div className="sidebar-bottom"><SairButton /></div>
      </aside>

      <section className="content patients-content">
        <header className="topbar">
          <div><span className="eyebrow">GESTÃO DA CLÍNICA</span><h1>Pacientes</h1><p className="page-subtitle">Cadastros, contatos e informações dos pacientes.</p></div>
          <div className="profile"><div className="avatar">FB</div><div><strong>Fabiana Bruinsma</strong><span>Administradora</span></div></div>
        </header>

        <div className="patient-toolbar">
          <label className="patient-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CPF, telefone ou e-mail..." /></label>
          <label className="inactive-toggle"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Mostrar inativos</label>
          <button className="primary-button" onClick={openNew}><Plus size={18} /> Novo paciente</button>
        </div>

        {success && <div className="notice success"><CheckCircle2 size={17} />{success}</div>}
        {error && !modalOpen && <div className="notice warning"><AlertCircle size={18} /><span>{error}</span><button onClick={() => void loadPatients()} aria-label="Tentar novamente"><RefreshCw size={16} /></button></div>}

        <section className="patient-panel">
          <div className="panel-heading"><div><h2>Lista de pacientes</h2><p>{loading ? "Carregando cadastros..." : `${filtered.length} paciente(s) encontrado(s)`}</p></div><button className="icon-button" onClick={() => void loadPatients()} title="Atualizar lista"><RefreshCw size={17} /></button></div>
          {loading ? <div className="empty-state"><RefreshCw className="spin" size={25} /><span>Carregando pacientes...</span></div> : filtered.length === 0 ? <div className="empty-state"><UserCircle2 size={34} /><strong>{search ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</strong><span>{search ? "Tente alterar os termos da busca." : "Use “Novo paciente” para iniciar os cadastros."}</span></div> : (
            <div className="patient-table-wrap"><table className="patient-table"><thead><tr><th>Paciente</th><th>Contato</th><th>Nascimento</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((patient) => <tr key={patient.id}><td><strong>{patient.nome}</strong><small>{patient.cpf || "CPF não informado"}</small></td><td><span>{patient.telefone || patient.whatsapp || "—"}</span><small>{patient.email || ""}</small></td><td>{formatDate(patient.data_nascimento)}</td><td><span className={`status-pill ${patient.ativo ? "is-active" : "is-inactive"}`}>{patient.ativo ? "Ativo" : "Inativo"}</span></td><td><button className="icon-button" onClick={() => openEdit(patient)} title="Editar paciente"><Pencil size={16} /></button></td></tr>)}</tbody></table></div>
          )}
        </section>
        <footer>FB Clínica · Fabiana Bruinsma Pilates &amp; Fisioterapia</footer>
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}><section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-modal-title">
        <header className="modal-header"><div><span className="eyebrow">CADASTRO CLÍNICO</span><h2 id="patient-modal-title">{editing ? "Editar paciente" : "Novo paciente"}</h2><p>Preencha os dados principais e os contatos.</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={20} /></button></header>
        {error && <div className="notice warning modal-error"><AlertCircle size={17} /><span>{error}</span></div>}
        <form onSubmit={savePatient}>
          <div className="form-section-title">Dados pessoais</div>
          <div className="form-grid"><label className="field full"><span>Nome completo *</span><input required value={form.nome} onChange={(e) => updateField("nome", e.target.value)} placeholder="Nome do paciente" /></label>
            <label className="field"><span>Data de nascimento</span><input type="date" value={form.data_nascimento} onChange={(e) => updateField("data_nascimento", e.target.value)} /></label>
            <label className="field"><span>CPF</span><input value={form.cpf ?? ""} onChange={(e) => updateField("cpf", e.target.value)} placeholder="000.000.000-00" /></label>
            <label className="field"><span>Sexo</span><select value={form.sexo ?? ""} onChange={(e) => updateField("sexo", e.target.value)}><option value="">Não informado</option><option value="Feminino">Feminino</option><option value="Masculino">Masculino</option><option value="Outro">Outro</option></select></label>
            <label className="field"><span>Status do cadastro</span><select value={form.ativo ? "ativo" : "inativo"} onChange={(e) => updateField("ativo", e.target.value === "ativo")}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
          </div>
          <div className="form-section-title">Contato</div>
          <div className="form-grid"><label className="field"><span>Telefone</span><input value={form.telefone ?? ""} onChange={(e) => updateField("telefone", e.target.value)} placeholder="(00) 0000-0000" /></label>
            <label className="field"><span>WhatsApp</span><input value={form.whatsapp ?? ""} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="(00) 00000-0000" /></label>
            <label className="field full"><span>E-mail</span><input type="email" value={form.email ?? ""} onChange={(e) => updateField("email", e.target.value)} placeholder="paciente@email.com" /></label>
          </div>
          <div className="form-section-title">Endereço</div>
          <div className="form-grid"><label className="field full"><span>Rua e número</span><input value={form.endereco ?? ""} onChange={(e) => updateField("endereco", e.target.value)} placeholder="Endereço completo" /></label>
            <label className="field"><span>Cidade</span><input value={form.cidade ?? ""} onChange={(e) => updateField("cidade", e.target.value)} /></label>
            <label className="field"><span>Estado</span><input maxLength={2} value={form.estado ?? ""} onChange={(e) => updateField("estado", e.target.value.toUpperCase())} placeholder="UF" /></label>
          </div>
          <div className="form-section-title">Contato de emergência</div>
          <div className="form-grid"><label className="field"><span>Nome do contato</span><input value={form.contato_emergencia ?? ""} onChange={(e) => updateField("contato_emergencia", e.target.value)} /></label>
            <label className="field"><span>Telefone de emergência</span><input value={form.telefone_emergencia ?? ""} onChange={(e) => updateField("telefone_emergencia", e.target.value)} /></label>
            <label className="field full"><span>Observações</span><textarea rows={3} value={form.observacoes ?? ""} onChange={(e) => updateField("observacoes", e.target.value)} placeholder="Informações importantes sobre o paciente..." /></label>
          </div>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar paciente"}</button></div>
        </form>
      </section></div>}
    </main>
  );
}
