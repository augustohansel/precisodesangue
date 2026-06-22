# 🩸 Preciso de Sangue

Uma plataforma web desenvolvida para conectar pessoas que precisam de doação de sangue com doadores voluntários em sua região, de forma rápida, segura e eficiente.

## 🚀 Funcionalidades

* **Busca Inteligente e Precisa:** Filtro de doadores por Estado (UF) e Cidade, integrado diretamente com a **API oficial do IBGE**, garantindo padronização e zero erros de digitação.
* **Privacidade e Segurança Anti-Spam:** Os números de WhatsApp dos doadores são ocultos do banco de dados público. Para ver o contato e iniciar a conversa, o usuário precisa fazer um login rápido usando a conta do Google.
* **Acesso Facilitado:** Redirecionamento com um clique direto para o aplicativo do WhatsApp do doador com uma mensagem pré-configurada de solicitação.
* **Cadastro Simples:** Formulário intuitivo para novos doadores se cadastrarem com validação automática de formatação de telefone e botão de teste do link do WhatsApp.

## 🛠️ Tecnologias Utilizadas

* **[Next.js](https://nextjs.org/)** (App Router) - Framework React para construção da interface e rotas.
* **[Tailwind CSS](https://tailwindcss.com/)** - Estilização e design responsivo (Mobile-first).
* **[Supabase](https://supabase.com/)** - Backend as a Service (BaaS) utilizado para:
  * Banco de Dados relacional (PostgreSQL).
  * Autenticação OAuth (Login com Google).
* **API do IBGE** - Consumo de dados abertos para listagem de estados e municípios.
