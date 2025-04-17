# Conversor de Pixel Art - Manual do Usuário

## Introdução

Bem-vindo ao Conversor de Pixel Art! Esta aplicação web permite transformar pixel arts desenhadas à mão (digitalizadas em PDF ou imagem) em versões digitais com cores sólidas. O aplicativo identifica automaticamente a grade na imagem, detecta a cor predominante em cada célula e gera uma versão digital limpa da pixel art.

## Como Acessar

A aplicação está disponível online em: [https://pixelartconverter.example.com](https://pixelartconverter.example.com)

## Como Usar

### 1. Preparar sua Pixel Art

Para obter os melhores resultados, siga estas recomendações ao criar sua pixel art manual:

- Use papel quadriculado com linhas bem definidas
- Preencha cada célula com cores sólidas e bem definidas
- Evite sombreamentos complexos dentro de uma mesma célula
- Digitalize ou fotografe com boa iluminação e alta resolução
- Certifique-se de que a grade esteja visível na imagem digitalizada

### 2. Converter sua Pixel Art

1. **Fazer Upload do Arquivo**:
   - Clique no botão "Escolher Arquivo" na seção de upload
   - Selecione um arquivo PDF ou imagem (PNG, JPG, etc.) contendo sua pixel art
   - O tamanho máximo do arquivo é de 16 MB

2. **Configurar Opções**:
   - **Tamanho do Pixel**: Define o tamanho de cada pixel na imagem final (padrão: 20)
   - **Tamanho Mínimo da Célula**: Define o tamanho mínimo da célula para detecção de grade (padrão: 20)
   - **Tamanho Máximo da Célula**: Define o tamanho máximo da célula para detecção de grade (padrão: 40)
   - **Adicionar Grade**: Se marcado, adiciona linhas de grade entre os pixels
   - **Melhorar Cores**: Se marcado, melhora a saturação e o brilho das cores
   - **Filtro**: Selecione um filtro a ser aplicado à imagem final:
     - **Nenhum**: Sem filtro
     - **Nitidez**: Aumenta a nitidez da imagem
     - **Bordas**: Destaca as bordas entre pixels
     - **Relevo**: Adiciona efeito de relevo
     - **Pixelizar**: Aumenta o efeito de pixelização

3. **Iniciar Conversão**:
   - Clique no botão "Converter"
   - Aguarde a conclusão do processo (pode levar alguns segundos dependendo do tamanho do arquivo)

### 3. Visualizar e Baixar Resultados

Após a conversão, você verá os seguintes resultados:

1. **Visualização da Grade**: Mostra a grade detectada na imagem original
2. **Matriz de Cores**: Mostra as cores detectadas em cada célula da grade
3. **Pixel Art Digital**: Versão final da sua pixel art com cores sólidas
4. **Spritesheet**: Versão da pixel art organizada como uma spritesheet

Para cada resultado, você pode:
- Visualizar a imagem diretamente no navegador
- Baixar a imagem clicando no botão "Download" abaixo de cada visualização

## Dicas e Solução de Problemas

### Detecção de Grade

Se a grade não for detectada corretamente:

- Ajuste os valores de "Tamanho Mínimo da Célula" e "Tamanho Máximo da Célula"
- Tente usar uma imagem com melhor contraste entre a grade e o conteúdo
- Certifique-se de que a grade é visível e regular na imagem

### Análise de Cores

Para obter melhores resultados na detecção de cores:

- Use cores distintas e bem definidas em cada célula
- Ative a opção "Melhorar Cores" para cores mais vibrantes
- Evite gradientes ou misturas de cores dentro de uma mesma célula

### Formatos de Arquivo

- **PDF**: Ideal para digitalizações de alta qualidade
- **PNG**: Recomendado para imagens com transparência ou cores sólidas
- **JPG/JPEG**: Adequado para fotografias, mas pode introduzir artefatos de compressão
- **BMP/TIFF**: Bom para imagens sem compressão

### Problemas Comuns

1. **Mensagem "Falha na detecção da grade"**:
   - Tente ajustar os valores de tamanho mínimo e máximo da célula
   - Verifique se a imagem tem uma grade visível e bem definida
   - Tente melhorar o contraste da imagem antes de fazer upload

2. **Cores incorretas na saída**:
   - Ative a opção "Melhorar Cores"
   - Tente usar o filtro "Nitidez" para melhorar a definição
   - Verifique se a iluminação estava adequada ao digitalizar

3. **Erro ao processar arquivo**:
   - Verifique se o formato do arquivo é suportado
   - Certifique-se de que o arquivo não excede o limite de tamanho (16 MB)
   - Tente converter o arquivo para outro formato e tentar novamente

## Exemplos

Na página inicial, você pode ver exemplos de pixel arts antes e depois da conversão. Estes exemplos mostram o potencial da ferramenta e podem servir de inspiração para seus próprios projetos.

## Privacidade e Segurança

- Seus arquivos são armazenados temporariamente em nossos servidores apenas durante o processamento
- Arquivos com mais de 24 horas são automaticamente excluídos
- Todas as conexões são protegidas por HTTPS
- Não coletamos informações pessoais além do necessário para o funcionamento do serviço

## Contato e Suporte

Para obter suporte ou relatar problemas, entre em contato através de:

- E-mail: suporte@pixelartconverter.example.com
- Formulário de contato: [https://pixelartconverter.example.com/contato](https://pixelartconverter.example.com/contato)

## Código-fonte

Este projeto é de código aberto e está disponível no GitHub:
[https://github.com/exemplo/pixel_art_converter](https://github.com/exemplo/pixel_art_converter)

Contribuições são bem-vindas!
