import Link from "next/link";
export default function Profissionais() {
  return <main style={{padding:32,fontFamily:"Arial",background:"#f8f7fa",minHeight:"100vh"}}>
    <Link href="/" style={{color:"#76618f"}}>← Voltar ao painel</Link>
    <h1 style={{color:"#292a30"}}>Profissionais</h1>
    <p style={{color:"#777985"}}>Área preparada. O cadastro será conectado à tabela profissionais do Supabase após validar a estrutura e as permissões do banco.</p>
  </main>;
}
