# 📊 Umbler NPS — Sistema de Coleta e Análise de NPS

Sistema completo de Net Promoter Score desenvolvido para a Umbler, composto por um snippet JavaScript embeddable nos produtos web e um dashboard analítico com inteligência artificial.

---

## 🎯 Problema que resolve

A Umbler não tinha visibilidade contínua de como os clientes avaliam seus produtos. Sem isso, decisões sobre o que melhorar, o que está causando churn e quem está insatisfeito dependiam de suposições em vez de dados reais.

---

## 🏗️ Arquitetura

```
projeto-nps-umbler/
├── backend/
│   ├── server.js              # Entrada do servidor Express
│   ├── routes/
│   │   └── nps.js             # 10 endpoints da API REST
│   ├── services/
│   │   └── ai.js              # Integração com Groq (LLaMA 3.1)
│   └── models/
│       └── database.json      # Banco de dados JSON
├── frontend/
│   ├── snippet/
│   │   ├── embed.js           # Script de instalação (1 linha)
│   │   ├── widget.js          # Lógica do popup de coleta
│   │   └── widget.css         # Estilo com identidade Umbler
│   └── dashboard/
│       └── index.html         # Dashboard analítico completo
└── teste-widget.html          # Página de teste do snippet
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- Conta no [Groq](https://console.groq.com) (gratuito)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/projeto-nps-umbler.git
cd projeto-nps-umbler

# Instale as dependências
npm install
```

### Configuração

Crie o arquivo `.env` na raiz do projeto:

```env
PORT=3000
GROQ_API_KEY=sua_chave_groq_aqui
```

### Rodando em desenvolvimento

```bash
npm run dev
```

O servidor sobe em `http://localhost:3000`.

---

## 🖥️ Como testar o projeto

Com o servidor rodando, acesse as URLs abaixo no navegador:

### Dashboard analítico
```
http://localhost:3000/dashboard/index.html
```
Exibe o painel completo com métricas, gráficos, insights de IA, radar de risco, oportunidades de upsell e exportação CSV.

### Widget de coleta (snippet)
```
http://localhost:3000/teste/teste-widget.html
```
Simula um produto da Umbler com o widget instalado. Após 2 segundos o popup aparece no canto inferior direito.

---

## 🔄 Resetando o widget para novo teste

O widget possui uma regra de **cooldown de 90 dias** — após responder uma pesquisa, ele não aparece novamente para o mesmo usuário nesse período. Essa é uma regra padrão do NPS para não interromper a experiência do cliente.

Para resetar e testar novamente:

1. Acesse `http://localhost:3000/teste/teste-widget.html`
2. Pressione `F12` para abrir as ferramentas do desenvolvedor
3. Vá na aba **Console**
4. Digite o comando abaixo e pressione Enter:

```javascript
localStorage.clear()
```

5. Recarregue a página com `F5`
6. O widget aparecerá novamente após 2 segundos

---

## 📡 API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/nps` | Recebe e salva uma resposta com análise de IA |
| `GET` | `/api/nps` | Lista respostas com filtros |
| `GET` | `/api/nps/score` | Calcula o NPS com filtros |
| `GET` | `/api/nps/insights` | Insights gerados por IA por produto |
| `GET` | `/api/nps/analytics` | Radar de risco, upsell e voz do cliente |
| `GET` | `/api/nps/evolucao` | Evolução do NPS (adaptativo dia/mês) |
| `GET` | `/api/nps/exportar` | Exporta dados filtrados em CSV |
| `PATCH` | `/api/nps/:id/social-proof` | Aprova comentário para marketing |

### Filtros disponíveis (query params)

Todos os endpoints GET aceitam os seguintes filtros:

```
?product=hospedagem
&customer_tier=pro
&plan=anual
&data_inicio=2026-01-01
&data_fim=2026-03-31
```

---

## 🤖 Inteligência Artificial

A IA é processada pelo **Groq** com o modelo **LLaMA 3.1 8B Instant** — gratuito, rápido e preciso.

### Análise por resposta (tempo real)
Cada resposta recebida é automaticamente analisada e enriquecida com:

| Campo | Exemplo |
|-------|---------|
| `ia_categoria` | `suporte` |
| `ia_subcategoria` | `tempo de resposta` |
| `ia_resumo` | `Cliente insatisfeito com demora no atendimento` |

### Categorias e subcategorias

| Categoria | Subcategorias |
|-----------|---------------|
| suporte | tempo de resposta, qualidade da solução, cordialidade, disponibilidade |
| performance | lentidão, instabilidade, quedas, tempo de carregamento |
| preco | custo elevado, falta de transparência, custo-benefício, cobrança indevida |
| usabilidade | interface confusa, fluxo complexo, falta de documentação, onboarding |
| estabilidade | serviço fora do ar, erros recorrentes, perda de dados |
| recursos | funcionalidade faltante, integração, customização, automação |

### Insights automáticos
Quando nenhum produto está filtrado, a IA gera insights independentes por produto. Quando um produto está filtrado, traz a **categoria mais crítica** em vez de repetir o nome do produto.

---

## 🧩 Instalação do Snippet

Para instalar o widget em qualquer produto da Umbler, basta adicionar duas tags antes do `</body>`:

```html
<script>
  window.UmblerNPS = {
    product:       "nome-do-produto",   // hospedagem | email | umbler-talk | dominio
    customer_tier: "pro",               // free | pro | enterprise (vem da sessão)
    plan:          "anual",             // mensal | anual (vem da sessão)
    api_url:       "https://nps.umbler.com",
    delay_ms:      3000                 // tempo antes de exibir (padrão: 3s)
  };
</script>
<script src="https://nps.umbler.com/snippet/embed.js"></script>
```

### Regras de exibição
- O widget não aparece para o mesmo usuário por **90 dias** após uma resposta
- O delay padrão é de **3 segundos** — tempo suficiente para o usuário estar engajado
- Configurável por produto sem alterar o código do snippet

---

## 📊 Dashboard

### Métricas principais
- **NPS Score** com classificação por zona (Excelente / Muito bom / Razoável / Crítico)
- Distribuição entre Promotores (9-10), Neutros (7-8) e Detratores (0-6)
- Gráfico de barras por nota e donut de distribuição

### Evolução adaptativa
O gráfico de evolução temporal se adapta automaticamente:
- Período **> 31 dias** → agrupamento por **mês**
- Período **≤ 31 dias** → agrupamento por **dia**

### Análise estratégica
| Seção | O que mostra |
|-------|--------------|
| Radar de risco | Detratores recentes classificados por nível de risco (alto/médio/baixo) |
| Oportunidades de expansão | Promotores em planos free/mensal prontos para upsell |
| Social proof | Melhores depoimentos para usar em marketing |
| Voz dos neutros | Feedbacks agrupados por categoria para priorização de roadmap |

### Exportação
Exporta todas as respostas filtradas em **CSV** com encoding UTF-8 (compatível com Excel e Google Sheets), incluindo os campos de IA.

---

## 🔒 Segurança

- **Helmet.js** — cabeçalhos HTTP de segurança
- **CORS** configurado
- **Morgan** — logging de requisições
- **Validação de entrada** — score obrigatório entre 0 e 10
- **`.env`** — credenciais nunca expostas no código

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js + Express 4 |
| IA | Groq API (LLaMA 3.1 8B Instant) |
| Frontend | HTML + CSS + JavaScript puro |
| Gráficos | Chart.js 4 |
| Banco de dados | JSON (extensível para PostgreSQL/MongoDB) |
| Segurança | Helmet + CORS |
| Dev | Nodemon |

---

## 📈 Decisões técnicas

**Por que JSON como banco de dados?**
Para o MVP, o JSON elimina dependências externas e facilita a demonstração. A estrutura das respostas já está modelada para migração direta para qualquer banco relacional ou NoSQL sem mudanças nas rotas.

**Por que Groq em vez de OpenAI?**
Groq oferece latência extremamente baixa (~500ms) com o modelo LLaMA 3.1, ideal para análise em tempo real sem atrasar a resposta ao usuário. O custo é zero no tier gratuito.

**Por que JavaScript puro no frontend?**
Zero dependências de build, carregamento instantâneo e fácil manutenção. O dashboard inteiro é um único arquivo HTML — qualquer membro do time consegue editar sem configuração de ambiente.

**Por que snippet e dashboard separados?**
O snippet vive nos produtos dos clientes (contexto de coleta), o dashboard vive internamente na Umbler (contexto de análise). Misturá-los criaria acoplamento desnecessário e riscos de segurança.

---

## 👩‍💻 Desenvolvido por

Bruna Costa — Desafio Técnico Umbler