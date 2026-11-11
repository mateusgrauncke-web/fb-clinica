"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
export default function SairButton() {
  const router = useRouter();
  async function sair() {
    try { await createClient().auth.signOut(); } finally { router.replace("/login"); router.refresh(); }
  }
  return <button type="button" className="logout-button" onClick={() => void sair()}><LogOut size={16}/> Sair</button>;
}
