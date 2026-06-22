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

export default function Home() {
  const [doadores, setDoadores] = useState<Doador[]>([]);
  
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
      const { data, error } = await supabase
        .from("doador")
        .select("id, nome, tipo_sanguineo, cidade");
      
      if (data) setDoadores(data);
      if (error) console.error("Erro ao buscar doadores:", error.message);
    };
    fetchDoadores();

    // 3. Monitora Login
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuarioLogado(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const doadoresFiltrados = doadores.filter(doador => 
    cidadeBusca === "" || doador.cidade === cidadeBusca
  );

  return (
    <main className="min-h-screen p-4 md:p-8 bg-red-600 bg-[url('/fundo-doacao.png')] bg-contain bg-center bg-no-repeat bg-fixed">
      <div className="max-w-xl mx-auto space-y-6 bg-white/90 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-white/20">
        
        <header className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-red-700 tracking-tight">BuscaSangue</h1>
          <p className="text-gray-700 font-medium">Encontre doadores compatíveis perto de você de forma rápida.</p>
          <div className="pt-2">
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm border border-red-200">
              <span>❤️</span> Quero ser um doador
            </Link>
          </div>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-red-200 text-gray-800"
                value={ufSelecionada}
                onChange={(e) => {
                  setUfSelecionada(e.target.value);
                  setCidadeBusca("");
                }}
              >
                <option value="">Selecione...</option>
                {ufs.map((uf) => (
                  <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
              <select 
                disabled={!ufSelecionada}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-red-200 text-gray-800 disabled:bg-gray-100"
                value={cidadeBusca}
                onChange={(e) => setCidadeBusca(e.target.value)}
              >
                <option value="">Todas as cidades</option>
                {cidades.map((cid) => (
                  <option key={cid.id} value={cid.nome}>{cid.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {doadoresFiltrados.length > 0 ? (
            doadoresFiltrados.map((doador) => (
              <div key={doador.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">{doador.nome}</h2>
                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md text-xs">{doador.tipo_sanguineo}</span>
                    <span>• {doador.cidade}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleAcaoWhatsApp(doador)}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  WhatsApp
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4 font-medium">Nenhum doador encontrado nesta região.</p>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="text-5xl drop-shadow-md">❤️</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Ver contato</h2>
              <p className="text-gray-600 text-sm mt-2">Para evitar spam e proteger os doadores, precisamos que você faça um login rápido.</p>
            </div>
            <button 
              onClick={handleLoginGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
               Entrar com Google
            </button>
            <button 
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}