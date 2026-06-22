"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const TIPOS_SANGUINEOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

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
    setLoading(true);
    setMensagem({ tipo: "", texto: "" });

    let telefoneLimpo = telefone.replace(/\D/g, "");

    if (telefoneLimpo.length < 10) {
      setMensagem({ tipo: "erro", texto: "Por favor, insira um telefone válido com DDD." });
      setLoading(false);
      return;
    }

    if (!telefoneLimpo.startsWith("55")) {
      telefoneLimpo = "55" + telefoneLimpo;
    }

    const { error } = await supabase
      .from("doador")
      .insert([
        { 
          nome: nome, 
          tipo_sanguineo: tipoSanguineo, 
          cidade: cidadeSelecionada, 
          telefone: telefoneLimpo 
        }
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
    <main className="min-h-screen p-4 md:p-8 bg-red-600 bg-[url('/fundo-doacao.png')] bg-contain bg-center bg-no-repeat bg-fixed flex items-center justify-center">
      <div className="max-w-md w-full bg-white/90 p-8 rounded-3xl shadow-2xl backdrop-blur-sm border border-white/20">
        
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold text-red-700 tracking-tight">Seja um Doador</h1>
          <p className="text-gray-600 font-medium text-sm">Seu sangue pode salvar vidas. Cadastre-se na nossa rede.</p>
        </header>

        {mensagem.texto && (
          <div className={`p-4 mb-6 rounded-xl text-sm font-medium text-center ${
            mensagem.tipo === "erro" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
            <input 
              required
              type="text" 
              placeholder="Ex: João da Silva" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-800"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
              <select 
                required
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-red-300 outline-none"
                value={ufSelecionada}
                onChange={(e) => {
                  setUfSelecionada(e.target.value);
                  setCidadeSelecionada(""); 
                }}
              >
                <option value="" disabled>Selecione</option>
                {ufs.map((uf) => (
                  <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
              <select 
                required
                disabled={!ufSelecionada}
                className="w-full p-3 border border-gray-200 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-red-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                value={cidadeSelecionada}
                onChange={(e) => setCidadeSelecionada(e.target.value)}
              >
                <option value="" disabled>Selecione a Cidade</option>
                {cidades.map((cid) => (
                  <option key={cid.id} value={cid.nome}>{cid.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo Sanguíneo</label>
            <select 
              required
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-800 bg-white"
              value={tipoSanguineo}
              onChange={(e) => setTipoSanguineo(e.target.value)}
            >
              <option value="" disabled>Selecione</option>
              {TIPOS_SANGUINEOS.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp (com DDD)</label>
            <div className="flex gap-2">
              <input 
                required
                type="tel" 
                placeholder="(55) 99999-9999" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-800"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <button 
                type="button"
                onClick={handleTestarWhatsApp}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-xl font-medium text-sm transition-colors border border-gray-200 whitespace-nowrap"
              >
                Testar Link
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Clique em "Testar Link" para confirmar se o número abre corretamente.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-md disabled:opacity-70 mt-4"
          >
            {loading ? "Cadastrando..." : "Confirmar Cadastro"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
          >
            ← Voltar para a busca
          </button>
        </div>

      </div>
    </main>
  );
}