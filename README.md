# Portal de Escala de Folga

Visual RRP Bioenergia (verde agro `#174A2B` + dourado milho `#D4A017`), com modo claro/escuro.

Sistema de gerenciamento de escala de folga — **Elétrica & Cogeração**

**Versão:** 2.1.0

## Acesso

O portal tem duas equipes com ambientes separados: **Elétrica** e **Casa de Força**.

- **Colaborador:** informe a matrícula — o portal identifica a equipe automaticamente
- **Administrador:** acesse https://hayralde.github.io/escala-folga/#admin e informe o usuário e a senha da equipe:
  - usuário `Elétrica` → ambiente da Elétrica & Cogeração
  - usuário `Casaforça` → ambiente da Casa de Força
  - cada equipe tem a própria senha (no banco, criptografada); altere em Ajustes

## Funcionalidades

- Consulta individual da escala (calendário)
- Administração completa da escala (ciclo automático por colaborador, padrão 6 dias)
- Cadastro de colaboradores com dia-âncora de folga
- Meses de Setembro a Dezembro/2026 pré-carregados
- Exportar / Importar backup JSON
- Visual RRP Bioenergia, modo claro/escuro
- Status do dia (folga hoje / trabalhando) e setor (Elétrica / Cogeração) por colaborador
- Instalável como app (PWA) — opção "Instalar app" sempre disponível, com passo a passo por aparelho

## Publicação (GitHub Pages)

1. No repositório, vá em **Settings → Pages**
2. Source: branch `main` / folder `/ (root)`
3. Acesse: https://hayralde.github.io/escala-folga/

## Instalar como app

No Android/Chrome/Edge aparece o botão **Instalar app** (tela de login e cabeçalho). No iPhone: Safari → Compartilhar → **Adicionar à Tela de Início**.

## Dados

Os dados ficam no Supabase (tabela `escala_folga`, um registro por equipe: `main` = Elétrica, `casaforca` = Casa de Força):

- Leitura pública (colaboradores consultam pela matrícula)
- Gravação apenas pelo administrador — a senha é conferida no banco (hash bcrypt)
- Sem conexão, o portal mostra a última cópia salva no aparelho (somente leitura)

Estrutura do banco: `supabase/escala_folga.sql` e `supabase/escala_folga_equipes.sql`.
