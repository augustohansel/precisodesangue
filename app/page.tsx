"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Doador {
  id: number;
  nome: string;
  tipo_sanguineo: string;
  cidade: string;
}

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
  @keyframes pulse-draw {
    0% { stroke-dashoffset: 240; }
    100% { stroke-dashoffset: 0; }
  }
  .pulse-line {
    stroke-dasharray: 240;
    animation: pulse-draw 2.8s linear infinite;
  }
`;

function IconPulse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 16" className={className} fill="none">
      <path
        d="M1 8H9L11 2L14 14L17 4L19 8H31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.2-.6.9-.8 1-.1.2-.3.2-.5.1-1.4-.7-2.3-1.2-3.3-2.7-.2-.3 0-.4.2-.6.3-.3.6-.6.7-.8.1-.2.1-.4 0-.5-.1-.2-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.1 1.7 2.6 4.1 3.6 2 .8 2.4.6 2.8.6.4 0 1.3-.5 1.5-1 .2-.5.2-.9.1-1z" />
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.1l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

function IconGoogle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.2z" />
      <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.7-2.8c-1 .7-2.2 1.1-3.5 1.1-2.7 0-5-1.8-5.8-4.3H1.1v2.8C2.9 20.6 7.1 23 12 23z" />
      <path fill="#FBBC05" d="M6.2 14.4c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.6H1.1A11.4 11.4 0 0 0 0 12.4c0 1.8.4 3.5 1.1 5l5.1-3z" />
      <path fill="#EA4335" d="M12 5.8c1.5 0 2.9.5 4 1.5l3.2-3.1C17.4 2.4 14.9 1.4 12 1.4 7.1 1.4 2.9 3.8 1.1 7.6l5.1 3c.8-2.5 3.1-4.8 5.8-4.8z" />
    </svg>
  );
}

export default function Home() {
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [carregandoDoadores, setCarregandoDoadores] = useState(true);

  // Estados do IBGE
  const [ufs, setUfs] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState("RS"); // Iniciando no RS para agilizar testes
  const [cidadeBusca, setCidadeBusca] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [doadorSelecionado, setDoadorSelecionado] = useState<Doador | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  useEffect(() => {
    // 1. Busca os Estados do IBGE
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => setUfs(data));

    // 2. Busca os Doadores (apenas campos seguros)
    const fetchDoadores = async () => {
      setCarregandoDoadores(true);
      const { data, error } = await supabase
        .from("doador")
        .select("id, nome, tipo_sanguineo, cidade");

      if (data) setDoadores(data);
      if (error) console.error("Erro ao buscar doadores:", error.message);
      setCarregandoDoadores(false);
    };
    fetchDoadores();

    // 3. Monitora Login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioLogado(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuarioLogado(session?.user ?? null);
      if (session?.user) setShowModal(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Busca Cidades quando o Estado muda
  useEffect(() => {
    if (!ufSelecionada) {
      setCidades([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSelecionada}/municipios`)
      .then((res) => res.json())
      .then((data) => setCidades(data));
  }, [ufSelecionada]);

  const handleLoginGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } catch (error: any) {
      alert("Erro ao autenticar com o Google: " + error.message);
    }
  };

  const handleAcaoWhatsApp = async (doador: Doador) => {
    if (usuarioLogado) {
      try {
        const { data, error } = await supabase
          .from("doador")
          .select("telefone")
          .eq("id", doador.id)
          .single();

        if (error) throw error;

        if (data && data.telefone) {
          const numeroLimpo = data.telefone.replace(/\D/g, "");
          const mensagem = `Olá, ${doador.nome}! Vi seu cadastro no BuscaSangue e estou precisando de doação de sangue tipo ${doador.tipo_sanguineo}. Você estaria disponível?`;
          window.open(`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, "_blank");
        } else {
          alert("Telefone não encontrado para este doador.");
        }
      } catch (error) {
        console.error("Erro ao buscar telefone:", error);
        alert("Ocorreu um erro ao buscar o contato. Tente novamente.");
      }
    } else {
      setDoadorSelecionado(doador);
      setShowModal(true);
    }
  };

  const doadoresFiltrados = doadores.filter(
    (doador) => cidadeBusca === "" || doador.cidade === cidadeBusca
  );

  return (
    <main className="min-h-screen bg-[#FBF5F3]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-[#2A0E14]">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconPulse className="w-8 h-4 text-[#E2566E]" />
            <span
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-white font-bold text-lg tracking-tight"
            >
              Preciso de Sangue
            </span>
          </div>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-1.5 bg-[#C41E3A] hover:bg-[#A8162E] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <span>♥</span> Quero doar
          </Link>
        </div>
        <svg viewBox="0 0 400 10" preserveAspectRatio="none" className="w-full h-2.5 block">
          <polyline
            className="pulse-line"
            points="0,5 150,5 158,1 166,9 174,5 400,5"
            fill="none"
            stroke="#C41E3A"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
        </svg>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10 space-y-7">
        {/* Hero */}
        <div className="text-center space-y-2.5">
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-3xl md:text-[2.5rem] font-bold text-[#2A0E14] tracking-tight leading-tight"
          >
            Encontre doadores <span className="text-[#C41E3A]">compatíveis</span> perto de você
          </h1>
          <p className="text-[#7A6266] font-medium text-sm md:text-base">
            Entre em contato rapidamente com quem pode te ajudar.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-[#F0DEDC] shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-1.5">
                Estado
              </label>
              <select
                className="w-full p-3 border border-[#F0DEDC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] text-[#2A0E14] text-sm"
                value={ufSelecionada}
                onChange={(e) => {
                  setUfSelecionada(e.target.value);
                  setCidadeBusca("");
                }}
              >
                <option value="">Selecione...</option>
                {ufs.map((uf) => (
                  <option key={uf.id} value={uf.sigla}>
                    {uf.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-1.5">
                Cidade
              </label>
              <select
                disabled={!ufSelecionada}
                className="w-full p-3 border border-[#F0DEDC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] text-[#2A0E14] text-sm disabled:bg-[#FBF5F3] disabled:text-[#bfa9ac]"
                value={cidadeBusca}
                onChange={(e) => setCidadeBusca(e.target.value)}
              >
                <option value="">Todas as cidades</option>
                {cidades.map((cid) => (
                  <option key={cid.id} value={cid.nome}>
                    {cid.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!carregandoDoadores && (
            <p
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              className="text-xs text-[#1F6F64] font-semibold"
            >
              {doadoresFiltrados.length} doador{doadoresFiltrados.length === 1 ? "" : "es"} encontrado
              {doadoresFiltrados.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {/* Lista de doadores */}
        <div className="space-y-3">
          {carregandoDoadores ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#F0DEDC] p-4 flex items-center gap-3 animate-pulse"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F4DEDC]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#F4DEDC] rounded w-1/2" />
                  <div className="h-3 bg-[#F4DEDC] rounded w-1/3" />
                </div>
              </div>
            ))
          ) : doadoresFiltrados.length > 0 ? (
            doadoresFiltrados.map((doador) => (
              <div
                key={doador.id}
                className="bg-white p-4 rounded-xl border border-[#F0DEDC] shadow-sm flex items-center justify-between gap-3 transition-all hover:border-[#C41E3A]/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#F4DEDC] text-[#C41E3A] font-bold text-sm"
                  >
                    {doador.tipo_sanguineo}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-[#2A0E14] truncate">{doador.nome}</h2>
                    <p className="text-xs text-[#9c8689] truncate">📍 {doador.cidade}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAcaoWhatsApp(doador)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-[#1FAA59] hover:bg-[#188F4B] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  <IconWhatsapp className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 px-4 border-2 border-dashed border-[#F0DEDC] rounded-2xl">
              <p className="text-3xl mb-2">🩸</p>
              <p className="text-[#7A6266] font-medium text-sm">Nenhum doador encontrado nesta região.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de login */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A0E14]/70 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#F4DEDC] flex items-center justify-center">
              <span className="text-2xl">❤️</span>
            </div>
            <div>
              <h2
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                className="text-xl font-bold text-[#2A0E14]"
              >
                Ver contato
              </h2>
              <p className="text-[#7A6266] text-sm mt-2">
                Para evitar spam e proteger os doadores, precisamos que você faça um login rápido.
              </p>
            </div>
            <button
              onClick={handleLoginGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-[#F0DEDC] py-3 rounded-xl font-semibold text-[#2A0E14] hover:bg-[#FBF5F3] transition-colors"
            >
              <IconGoogle className="w-5 h-5" /> Entrar com Google
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="text-[#9c8689] hover:text-[#C41E3A] text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}