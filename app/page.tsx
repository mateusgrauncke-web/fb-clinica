
import Link from "next/link";
import {
  Activity, CalendarDays, ClipboardList, Users, UserRound, Stethoscope,
  Wallet, FileText, ChartNoAxesColumn, Settings, Clock3, ArrowUpRight
} from "lucide-react";

const modules = [
  { title: "Pacientes", desc: "Cadastros e prontuários", icon: Users, href: "/pacientes" },
  { title: "Profissionais", desc: "Equipe clínica", icon: Stethoscope, href: "/profissionais" },
  { title: "Agenda", desc: "Disponibilidade e sessões", icon: CalendarDays, href: "/agenda" },
  { title: "Serviços", desc: "Pilates, Fisioterapia e Osteopatia", icon: Activity, href: "/servicos" },
  { title: "Planos", desc: "Pacotes e frequências", icon: ClipboardList, href: "/planos" },
  { title: "Financeiro", desc: "Receitas e repasses", icon: Wallet, href: "/financeiro" },
  { title: "Documentos", desc: "Termos e documentos clínicos", icon: FileText, href: "/documentos" },
  { title: "Relatórios", desc: "Indicadores da clínica", icon: ChartNoAxesColumn, href: "/relatorios" },
];

export default function Home() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Activity size={23} /></div>
          <div><strong>FB Clínica</strong><span>Fabiana Bruinsma</span></div>
        </div>

        <div className="side-label">MENU PRINCIPAL</div>

        <nav>
          <Link className="nav-item active" href="/">
            <ChartNoAxesColumn size={18} /> Visão geral
          </Link>

          <Link className="nav-item" href="/pacientes">
            <Users size={18} /> Pacientes
          </Link>

          <Link className="nav-item" href="/profissionais">
            <UserRound size={18} /> Profissionais
          </Link>

          <Link className="nav-item" href="/agenda">
            <CalendarDays size={18} /> Agenda
          </Link>

          <Link className="nav-item" href="/financeiro">
            <Wallet size={18} /> Financeiro
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <Settings size={18} /> Configurações
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">PAINEL DA CLÍNICA</span>
            <h1>Visão geral</h1>
          </div>

          <div className="profile">
            <div className="avatar">FB</div>
            <div>
              <strong>Fabiana Bruinsma</strong>
              <span>Administradora</span>
            </div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow light">BEM-VINDA À FB CLÍNICA</span>
            <h2>
              Cuidado organizado.
              <br />
              Atendimento em harmonia.
            </h2>
            <p>
              Gestão de Pilates, Fisioterapia e Osteopatia em um só lugar.
            </p>
          </div>

          <div className="welcome-icon">
            <Activity size={72} strokeWidth={1.2} />
          </div>
        </section>

        <div className="section-heading">
          <div>
            <h3>Resumo de hoje</h3>
            <p>
              Os indicadores serão conectados ao banco de dados na próxima etapa.
            </p>
          </div>

          <span className="date-chip">
            <Clock3 size={15} /> Hoje
          </span>
        </div>

        <div className="stats">
          <article className="stat-card">
            <div className="stat-icon purple">
              <CalendarDays size={19} />
            </div>
            <span>Agendamentos</span>
            <strong>—</strong>
            <small>Aguardando conexão</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon olive">
              <Users size={19} />
            </div>
            <span>Pacientes ativos</span>
            <strong>—</strong>
            <small>Aguardando conexão</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon green">
              <Activity size={19} />
            </div>
            <span>Sessões realizadas</span>
            <strong>—</strong>
            <small>Aguardando conexão</small>
          </article>

          <article className="stat-card">
            <div className="stat-icon sand">
              <Wallet size={19} />
            </div>
            <span>Receita do mês</span>
            <strong>—</strong>
            <small>Aguardando conexão</small>
          </article>
        </div>

        <div className="section-heading modules-heading">
          <div>
            <h3>Acessos rápidos</h3>
            <p>Escolha um módulo para começar.</p>
          </div>
        </div>

        <div className="module-grid">
          {modules.map(({ title, desc, icon: Icon, href }) => (
            <Link
              className="module-card"
              href={href}
              key={title}
            >
              <div className="module-icon">
                <Icon size={21} />
              </div>

              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>

              <ArrowUpRight className="arrow" size={17} />
            </Link>
          ))}
        </div>

        <footer>
          FB Clínica · Fabiana Bruinsma Pilates &amp; Fisioterapia
        </footer>
      </section>
    </main>
  );
}
