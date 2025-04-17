# Conversor de Pixel Art

Este repositório contém uma aplicação web para converter pixel arts desenhadas à mão em versões digitais com cores sólidas.

## Funcionalidades

- Upload de imagens de pixel art desenhadas à mão
- Detecção automática de grade
- Análise de cores predominantes em cada célula
- Geração de pixel art digital com cores sólidas
- Opções de personalização (tamanho do pixel, grade, melhoria de cores)

## Tecnologias Utilizadas

- Frontend: HTML, CSS, JavaScript
- Backend: Python (Funções Serverless)
- Processamento de Imagem: OpenCV, NumPy, Pillow
- Implantação: Vercel

## Como Usar

1. Acesse a aplicação em [https://pixel-art-converter.vercel.app](https://pixel-art-converter.vercel.app)
2. Faça upload de uma imagem contendo sua pixel art desenhada à mão
3. Configure as opções desejadas
4. Clique em "Converter"
5. Visualize e baixe o resultado

## Desenvolvimento Local

### Pré-requisitos

- Node.js
- Python 3.8+
- Vercel CLI

### Instalação

1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/pixel-art-converter.git
   cd pixel-art-converter
   ```

2. Instale as dependências Python:
   ```
   pip install -r requirements.txt
   ```

3. Instale a Vercel CLI:
   ```
   npm install -g vercel
   ```

4. Execute o ambiente de desenvolvimento local:
   ```
   vercel dev
   ```

5. Acesse a aplicação em `http://localhost:3000`

## Implantação

A aplicação está configurada para implantação automática no Vercel através do GitHub. Qualquer push para a branch principal acionará uma nova implantação.

Para implantar manualmente:

1. Faça login na Vercel CLI:
   ```
   vercel login
   ```

2. Implante a aplicação:
   ```
   vercel
   ```

## Estrutura do Projeto

- `/api` - Funções serverless Python
- `/public` - Arquivos estáticos (HTML, CSS, JS, imagens)
- `vercel.json` - Configuração do Vercel
- `requirements.txt` - Dependências Python

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.
