# Guia de Solução de Problemas - Implantação no Vercel

Este guia ajudará a resolver problemas comuns ao implantar o Conversor de Pixel Art no Vercel.

## Erro 404 (Not Found)

Se você estiver enfrentando erros 404 após a implantação, verifique:

### 1. Estrutura de Diretórios

A estrutura de diretórios no GitHub deve ser exatamente:

```
/
├── api/
│   └── convert.py
├── public/
│   ├── css/
│   ├── js/
│   │   └── script-vercel-optimized.js
│   ├── images/
│   └── index.html
├── vercel.json
└── requirements.txt
```

Certifique-se de que os arquivos estão na raiz do repositório, não dentro de uma pasta adicional.

### 2. Configuração do vercel.json

Verifique se o arquivo `vercel.json` contém a configuração correta:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.py", "use": "@vercel/python" },
    { "src": "public/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(css|js|images)/(.*)", "dest": "/public/$1/$2" },
    { "src": "/", "dest": "/public/index.html" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

### 3. Formato da Função Serverless

A função Python deve usar o formato correto para o Vercel:

```python
def handler(event, context):
    # Código da função
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'result': 'dados'
        })
    }
```

### 4. Caminhos de Arquivos no HTML

Verifique se os caminhos para CSS, JS e imagens no HTML começam com `/`:

```html
<link rel="stylesheet" href="/css/style.css">
<script src="/js/script-vercel-optimized.js"></script>
<img src="/images/example.png">
```

## Erros de Tempo Limite (Timeout)

Se a função estiver atingindo o limite de tempo:

1. Reduza o tamanho das imagens no cliente antes de enviar
2. Otimize o código para processar mais rapidamente
3. Aumente o limite de tempo no `vercel.json`:

```json
"functions": {
  "api/**/*.py": {
    "memory": 1024,
    "maxDuration": 30
  }
}
```

## Erros de Memória

Se a função estiver excedendo o limite de memória:

1. Processe imagens em blocos menores
2. Reduza a resolução das imagens antes do processamento
3. Aumente o limite de memória no `vercel.json` (como mostrado acima)

## Problemas de CORS

Se estiver enfrentando erros de CORS:

1. Certifique-se de que a API retorna os cabeçalhos CORS corretos:

```python
'headers': {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
}
```

2. Adicione uma rota OPTIONS no `vercel.json`:

```json
{
  "routes": [
    { "src": "/api/(.*)", "methods": ["OPTIONS"], "dest": "/api/$1" }
  ]
}
```

## Verificando Logs de Implantação

Para diagnosticar problemas:

1. Acesse o dashboard do Vercel
2. Selecione seu projeto
3. Vá para a aba "Deployments"
4. Clique na implantação mais recente
5. Vá para a aba "Functions" para ver os logs das funções serverless

## Reimplantação

Se você fez alterações e precisa reimplantar:

1. Faça commit e push das alterações para o GitHub
2. O Vercel reimplantará automaticamente
3. Ou force uma nova implantação no dashboard do Vercel

## Testando Localmente

Para testar localmente antes de implantar:

1. Instale a Vercel CLI: `npm install -g vercel`
2. Execute `vercel dev` na pasta do projeto
3. Acesse `http://localhost:3000`

## Problemas com Dependências Python

Se houver problemas com as dependências Python:

1. Verifique se todas as dependências estão listadas no `requirements.txt`
2. Use versões específicas para evitar incompatibilidades:

```
numpy==1.24.3
opencv-python-headless==4.8.0.76
Pillow==10.0.0
```

3. Use `opencv-python-headless` em vez de `opencv-python` para reduzir o tamanho

## Contato para Suporte

Se você continuar enfrentando problemas após tentar estas soluções, entre em contato para obter suporte adicional.
