# Guia de Implantação no Vercel via GitHub

Este guia explica como implantar o Conversor de Pixel Art no Vercel usando integração com GitHub.

## Pré-requisitos

- Uma conta no [GitHub](https://github.com/)
- Uma conta no [Vercel](https://vercel.com/)

## Passo a Passo

### 1. Criar um Repositório no GitHub

1. Acesse [GitHub](https://github.com/) e faça login na sua conta
2. Clique no botão "+" no canto superior direito e selecione "New repository"
3. Preencha os seguintes campos:
   - Repository name: `pixel-art-converter` (ou outro nome de sua preferência)
   - Description: "Aplicação web para converter pixel arts desenhadas à mão em versões digitais"
   - Visibilidade: Public (ou Private, se preferir)
4. Clique em "Create repository"

### 2. Fazer Upload dos Arquivos para o GitHub

#### Usando a Interface Web do GitHub:

1. No seu novo repositório, clique no botão "uploading an existing file"
2. Arraste todos os arquivos e pastas do projeto ou use o seletor de arquivos
3. Clique em "Commit changes"

#### Usando Git na Linha de Comando:

1. Clone o repositório vazio:
   ```
   git clone https://github.com/seu-usuario/pixel-art-converter.git
   cd pixel-art-converter
   ```

2. Copie todos os arquivos do projeto para esta pasta

3. Adicione, faça commit e push dos arquivos:
   ```
   git add .
   git commit -m "Versão inicial do Conversor de Pixel Art"
   git push origin main
   ```

### 3. Conectar o Vercel ao GitHub

1. Acesse [Vercel](https://vercel.com/) e faça login na sua conta
2. Na dashboard, clique no botão "Add New..." e selecione "Project"
3. Na seção "Import Git Repository", conecte sua conta GitHub se ainda não estiver conectada
4. Selecione o repositório `pixel-art-converter` da lista
5. O Vercel detectará automaticamente as configurações do projeto graças ao arquivo `vercel.json`

### 4. Configurar o Projeto no Vercel

1. Na tela de configuração do projeto, você pode manter as configurações padrão detectadas
2. Opcionalmente, você pode definir variáveis de ambiente se necessário
3. Clique em "Deploy"

### 5. Aguardar a Implantação

1. O Vercel iniciará o processo de build e implantação
2. Você poderá acompanhar o progresso em tempo real
3. Após a conclusão, o Vercel fornecerá uma URL para acessar sua aplicação (por exemplo, `https://pixel-art-converter.vercel.app`)

### 6. Configurar Domínio Personalizado (Opcional)

1. Na dashboard do projeto no Vercel, vá para a aba "Settings" e depois "Domains"
2. Adicione seu domínio personalizado e siga as instruções para configurar os registros DNS

## Implantação Contínua

Uma vez configurado, o Vercel automaticamente implantará novas versões sempre que você fizer push para a branch principal do seu repositório GitHub. Isso permite um fluxo de trabalho de desenvolvimento contínuo:

1. Faça alterações no código localmente
2. Faça commit e push para o GitHub
3. O Vercel detectará as mudanças e implantará automaticamente
4. Sua aplicação será atualizada em minutos

## Solução de Problemas

### Falha na Implantação

Se a implantação falhar, verifique:

1. Os logs de build no Vercel para identificar o problema
2. Se todas as dependências estão listadas corretamente no `requirements.txt`
3. Se o arquivo `vercel.json` está configurado corretamente

### Problemas com Dependências Python

O Vercel tem limites para o tamanho total das dependências Python. Se encontrar problemas:

1. Considere usar versões mais leves das bibliotecas (como `opencv-python-headless` em vez de `opencv-python`)
2. Remova dependências desnecessárias
3. Otimize o código para usar menos bibliotecas externas

## Recursos Adicionais

- [Documentação do Vercel para Python](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [Guia de Integração GitHub-Vercel](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Limites e Restrições do Vercel](https://vercel.com/docs/concepts/limits/overview)
