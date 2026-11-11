-- FB Clínica: acesso interno. Execute após criar o primeiro usuário no Supabase Auth.
-- Não abre cadastro público e não altera os dados clínicos existentes.

ALTER TABLE public.perfis_usuarios
  ADD CONSTRAINT perfis_usuarios_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.fb_perfil_atual()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.perfil FROM public.perfis_usuarios p
  WHERE p.id = (SELECT auth.uid()) AND p.ativo IS TRUE
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.fb_perfil_atual() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fb_perfil_atual() TO authenticated;

CREATE OR REPLACE FUNCTION public.fb_profissional_atual()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.id FROM public.profissionais p
  WHERE p.usuario_id = (SELECT auth.uid()) AND p.ativo IS TRUE
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.fb_profissional_atual() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fb_profissional_atual() TO authenticated;

CREATE POLICY "perfil proprio leitura" ON public.perfis_usuarios
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "administracao perfis leitura" ON public.perfis_usuarios
  FOR SELECT TO authenticated USING (public.fb_perfil_atual() IN ('administradora','administrador'));
CREATE POLICY "administracao perfis inserir" ON public.perfis_usuarios
  FOR INSERT TO authenticated WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador'));
CREATE POLICY "administracao perfis atualizar" ON public.perfis_usuarios
  FOR UPDATE TO authenticated USING (public.fb_perfil_atual() IN ('administradora','administrador'))
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador'));

CREATE POLICY "pacientes equipe leitura" ON public.pacientes FOR SELECT TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador','secretaria')
    OR (public.fb_perfil_atual() IN ('fisioterapeuta','profissional') AND EXISTS (
      SELECT 1 FROM public.agendamentos a WHERE a.paciente_id = pacientes.id
      AND a.profissional_id = public.fb_profissional_atual()
    )));
CREATE POLICY "pacientes secretaria inserir" ON public.pacientes FOR INSERT TO authenticated
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'));
CREATE POLICY "pacientes secretaria atualizar" ON public.pacientes FOR UPDATE TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'))
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'));

CREATE POLICY "agendamentos equipe leitura" ON public.agendamentos FOR SELECT TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador','secretaria')
    OR (public.fb_perfil_atual() IN ('fisioterapeuta','profissional') AND profissional_id = public.fb_profissional_atual()));
CREATE POLICY "agendamentos secretaria inserir" ON public.agendamentos FOR INSERT TO authenticated
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'));
CREATE POLICY "agendamentos secretaria atualizar" ON public.agendamentos FOR UPDATE TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'))
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador','secretaria'));

CREATE POLICY "profissionais equipe leitura" ON public.profissionais FOR SELECT TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador','secretaria')
    OR usuario_id = (SELECT auth.uid()));
CREATE POLICY "profissionais administracao inserir" ON public.profissionais FOR INSERT TO authenticated
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador'));
CREATE POLICY "profissionais administracao atualizar" ON public.profissionais FOR UPDATE TO authenticated
  USING (public.fb_perfil_atual() IN ('administradora','administrador'))
  WITH CHECK (public.fb_perfil_atual() IN ('administradora','administrador'));

-- Serviços, planos, salas e disponibilidade: leitura para equipe; escrita administrativa.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['servicos','planos_servicos','salas','agenda_disponibilidade','profissionais_servicos'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.fb_perfil_atual() IN (''administradora'',''administrador'',''secretaria'',''fisioterapeuta'',''profissional''))', 'equipe leitura', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.fb_perfil_atual() IN (''administradora'',''administrador''))', 'administracao inserir', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.fb_perfil_atual() IN (''administradora'',''administrador'')) WITH CHECK (public.fb_perfil_atual() IN (''administradora'',''administrador''))', 'administracao atualizar', t);
  END LOOP;
END $$;

-- Acesso de usuários novos deve ser concedido pela administradora.
-- Exemplo (SUBSTITUA os valores após criar a conta em Authentication > Users):
-- INSERT INTO public.perfis_usuarios (id,nome,email,perfil,ativo)
-- VALUES ('UUID_DO_AUTH_USERS','Fabiana Bruinsma','EMAIL_DA_CONTA','administradora',true);
