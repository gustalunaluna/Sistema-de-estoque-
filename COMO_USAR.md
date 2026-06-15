# FabricaERP — Como Instalar e Usar

## Opção 1: Rodar diretamente no navegador (mais simples)

### Pré-requisitos
- [Node.js](https://nodejs.org) versão 18 ou superior instalado

### Passos

1. Baixe ou clone o projeto
2. Abra o terminal na pasta do projeto
3. Execute:
```bash
npm install
npm run dev
```
4. Abra o navegador em: **http://localhost:5173**

---

## Opção 2: Rodar como Aplicativo Desktop (Electron)

### Pré-requisitos
- [Node.js](https://nodejs.org) versão 18 ou superior instalado

### Rodar em modo desenvolvimento
```bash
npm install
npm run electron:dev
```
O aplicativo abrirá como uma janela de desktop.

### Gerar instalador (.exe para Windows)
```bash
npm install
npm run electron:build:win
```
O instalador será gerado na pasta `release/`. Execute o `.exe` para instalar.

### Gerar para Mac
```bash
npm run electron:build:mac
```

### Gerar para Linux
```bash
npm run electron:build:linux
```

---

## Como Usar o Sistema

### Login
- Ao abrir, você entra automaticamente como **Administrador**
- Email padrão: `admin@fabrica.com`

---

### Estoque de Insumos
1. Clique em **"Est. Insumos"** no menu lateral
2. Clique em **"Novo Insumo"** para adicionar materiais (cursor, zíper, etiqueta, etc.)
3. Preencha: nome, código, categoria, unidade, quantidade e valor unitário
4. Use os botões ↑ (entrada) e ↓ (saída) para movimentar o estoque
5. Itens em vermelho estão abaixo do estoque mínimo

---

### Estoque de Pilotagem (Modelos)
1. Clique em **"Est. Pilotagem"** no menu
2. Clique em **"Novo Modelo"** para cadastrar mochilas, pochetes, etc.
3. Adicione foto principal, categoria e status
4. Clique em **"Ver detalhes"** para ver todas as informações

---

### Fichas Técnicas
1. Clique em **"Fichas Técnicas"** no menu
2. Clique em **"Nova Ficha"**
3. Selecione o modelo
4. Clique em **"Adicionar item"** para incluir os materiais necessários
   - Ex: 4x Cursor 7 Invertido, 2 metros de Zíper 7, 2x Etiqueta
5. O sistema calcula automaticamente o custo e o preço sugerido de venda

---

### Controle de Produção
1. Clique em **"Produção"** no menu
2. Clique em **"Nova Ordem"** para criar uma ordem de produção
3. Selecione o modelo, quantidade, cliente e data de entrega
4. Use o botão **"Avançar →"** para mover entre etapas
5. Etapas: Criada → Revisão → Aprovada → Corte → Costura → Acabamento → Finalizada

---

### Kanban
1. Clique em **"Kanban"** no menu
2. Arraste os cartões entre as colunas para mudar o status
3. Cada coluna representa uma etapa de produção

---

### Clientes
1. Cadastre clientes com nome, telefone, email e Instagram
2. Veja o histórico de ordens de cada cliente

---

### Orçamentos
1. Crie orçamentos vinculados a cliente + modelo
2. O custo de produção é preenchido automaticamente da ficha técnica
3. Define o preço de venda e veja a margem de lucro calculada

---

### Fornecedores e Compras
1. Cadastre fornecedores na aba **"Fornecedores"**
2. Em **"Compras"**, registre novas compras
3. Ao clicar **"Receber agora"**, o estoque é atualizado automaticamente

---

### Relatórios
- Veja valor total em estoque, consumo de materiais, ordens por status e dados financeiros

---

## Dados
- Os dados são salvos automaticamente no computador (localStorage do navegador ou arquivo do Electron)
- Não é necessário servidor ou internet
- Os dados persistem entre sessões

---

## Suporte
Em caso de dúvidas, abra uma issue no repositório do projeto.
