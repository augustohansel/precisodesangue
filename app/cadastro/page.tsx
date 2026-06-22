"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const TIPOS_SANGUINEOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

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

export default function CadastroDoador() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [tipoSanguineo, setTipoSanguineo] = useState("");
  const [telefone, setTelefone] = useState("");

  // Estados do IBGE
  const [ufs, setUfs] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState("RS");
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => setUfs(data));
  }, []);

  useEffect(() => {
    if (!ufSelecionada) {
      setCidades([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSelecionada}/municipios`)
      .then((res) => res.json())
      .then((data) => setCidades(data));
  }, [ufSelecionada]);

  const handleTestarWhatsApp = () => {
    let telefoneLimpo = telefone.replace(/\D/g, "");
    if (telefoneLimpo.length < 10) {
      alert("Por favor, digite o número completo com DDD antes de testar.");
      return;
    }
    if (!telefoneLimpo.startsWith("55")) telefoneLimpo = "55" + telefoneLimpo;
    window.open(`https://wa.me/${telefoneLimpo}`, "_blank");
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ tipo: "", texto: "" });

    if (!tipoSanguineo) {
      setMensagem({ tipo: "erro", texto: "Selecione seu tipo sanguíneo." });
      return;
    }

    setLoading(true);

    let telefoneLimpo = telefone.replace(/\D/g, "");

    if (telefoneLimpo.length < 10) {
      setMensagem({ tipo: "erro", texto: "Por favor, insira um telefone válido com DDD." });
      setLoading(false);
      return;
    }

    if (!telefoneLimpo.startsWith("55")) {
      telefoneLimpo = "55" + telefoneLimpo;
    }

    const { error } = await supabase.from("doador").insert([
      {
        nome: nome,
        tipo_sanguineo: tipoSanguineo,
        cidade: cidadeSelecionada,
        telefone: telefoneLimpo,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Erro ao cadastrar:", error);
      setMensagem({ tipo: "erro", texto: "Ocorreu um erro ao salvar seu cadastro. Tente novamente." });
    } else {
      setMensagem({ tipo: "sucesso", texto: "Cadastro realizado com sucesso! Redirecionando..." });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBF5F3]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-[#2A0E14]">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            ← Voltar
          </button>
          <div className="flex items-center gap-2">
            <IconPulse className="w-7 h-3.5 text-[#E2566E]" />
            <span
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-white font-bold text-base tracking-tight"
            >
              Preciso de Sangue
            </span>
          </div>
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

      <div className="max-w-md mx-auto px-4 py-8 md:py-10">
        <div className="bg-white rounded-3xl border border-[#F0DEDC] shadow-sm p-6 md:p-8 space-y-6">
          <header className="text-center space-y-1.5">
            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-2xl md:text-[1.75rem] font-bold text-[#2A0E14] tracking-tight"
            >
              Seja um doador
            </h1>
            <p className="text-[#7A6266] text-sm font-medium">
              Seu sangue pode salvar vidas. Cadastre-se na nossa rede.
            </p>
          </header>

          {mensagem.texto && (
            <div
              className={`p-3.5 rounded-xl text-sm font-medium text-center border ${
                mensagem.tipo === "erro"
                  ? "bg-[#FBEAEA] text-[#C41E3A] border-[#F0DEDC]"
                  : "bg-[#E7F3F0] text-[#1F6F64] border-[#cfe7e1]"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          <form onSubmit={handleCadastro} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-1.5">
                Nome completo
              </label>
              <input
                required
                type="text"
                placeholder="Ex: João da Silva"
                className="w-full p-3 border border-[#F0DEDC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] text-[#2A0E14] text-sm"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-1.5">
                  Estado
                </label>
                <select
                  required
                  className="w-full p-3 border border-[#F0DEDC] rounded-xl bg-white text-[#2A0E14] text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A]"
                  value={ufSelecionada}
                  onChange={(e) => {
                    setUfSelecionada(e.target.value);
                    setCidadeSelecionada("");
                  }}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
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
                  required
                  disabled={!ufSelecionada}
                  className="w-full p-3 border border-[#F0DEDC] rounded-xl bg-white text-[#2A0E14] text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/30 focus:border-[#C41E3A] disabled:bg-[#FBF5F3] disabled:text-[#bfa9ac]"
                  value={cidadeSelecionada}
                  onChange={(e) => setCidadeSelecionada(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {cidades.map((cid) => (
                    <option key={cid.id} value={cid.nome}>
                      {cid.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-2">
                Tipo sanguíneo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIPOS_SANGUINEOS.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoSanguineo(tipo)}
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                      tipoSanguineo === tipo
                        ? "bg-[#C41E3A] border-[#C41E3A] text-white"
                        : "bg-white border-[#F0DEDC] text-[#2A0E14] hover:border-[#C41E3A]/40"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A6266] uppercase tracking-wide mb-1.5">
                WhatsApp (com DDD)
              </label>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1 border border-[#F0DEDC] rounded-xl focus-within:ring-2 focus-within:ring-[#C41E3A]/30 focus-within:border-[#C41E3A]">
                  <span className="pl-3 text-sm text-[#9c8689] font-medium select-none">+55</span>
                  <input
                    required
                    type="tel"
                    placeholder="(55) 99999-9999"
                    className="w-full py-3 pr-3 bg-transparent focus:outline-none text-[#2A0E14] text-sm"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestarWhatsApp}
                  className="bg-[#FBF5F3] hover:bg-[#F4DEDC] text-[#2A0E14] px-4 rounded-xl font-medium text-sm transition-colors border border-[#F0DEDC] whitespace-nowrap"
                >
                  Testar link
                </button>
              </div>
              <p className="text-xs text-[#9c8689] mt-1.5">
                Toque em "Testar link" para confirmar se o número abre corretamente.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C41E3A] hover:bg-[#A8162E] text-white py-3.5 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-60 mt-2"
            >
              {loading ? "Cadastrando..." : "Confirmar cadastro"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}