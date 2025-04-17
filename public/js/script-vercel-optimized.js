// script-vercel-optimized.js - Funcionalidades frontend otimizadas para o Vercel

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const uploadForm = document.getElementById('uploadForm');
    const convertButton = document.getElementById('convertButton');
    const loaderContainer = document.getElementById('loaderContainer');
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const alertContainer = document.getElementById('alertContainer');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const imageInfo = document.getElementById('imageInfo');
    
    // Elementos de configuração
    const pixelSize = document.getElementById('pixelSize');
    const pixelSizeValue = document.getElementById('pixelSizeValue');
    
    // Atualizar nome do arquivo quando selecionado
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileName.textContent = this.files[0].name;
            
            // Verificar tamanho do arquivo
            const fileSize = this.files[0].size / 1024 / 1024; // em MB
            if (fileSize > 5) {
                showAlert(`Atenção: O arquivo tem ${fileSize.toFixed(1)}MB. Arquivos grandes podem levar mais tempo para processar ou causar erros no servidor.`, 'warning');
            }
            
            // Verificar dimensões da imagem
            const img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(this.src); // Liberar memória
                
                imageInfo.textContent = `Dimensões: ${this.width}x${this.height} pixels`;
                
                if (this.width > 1000 || this.height > 1000) {
                    showAlert(`Atenção: A imagem tem dimensões de ${this.width}x${this.height} pixels. Imagens grandes serão redimensionadas automaticamente para otimizar o processamento.`, 'warning');
                }
            };
            img.src = URL.createObjectURL(this.files[0]);
        } else {
            fileName.textContent = 'Nenhum arquivo selecionado';
            imageInfo.textContent = '';
        }
    });
    
    // Atualizar valores dos sliders
    pixelSize.addEventListener('input', function() {
        pixelSizeValue.textContent = this.value;
    });
    
    // Manipular envio do formulário
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar se um arquivo foi selecionado
        if (!fileInput.files || !fileInput.files[0]) {
            showAlert('Por favor, selecione um arquivo para converter.', 'danger');
            return;
        }
        
        // Mostrar loader e barra de progresso
        loaderContainer.classList.add('active');
        progressContainer.classList.add('active');
        progressBar.style.width = '10%';
        
        // Desabilitar botão de conversão
        convertButton.disabled = true;
        
        // Mostrar mensagem de processamento
        showAlert('Processando imagem... Isso pode levar alguns segundos para imagens grandes.', 'info');
        
        // Ler o arquivo como Data URL
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            progressBar.style.width = '30%';
            
            // Pré-processar a imagem para reduzir tamanho se necessário
            preprocessImage(imageData, function(processedImageData) {
                progressBar.style.width = '50%';
                
                // Obter valores de configuração
                const pixelSizeValue = parseInt(pixelSize.value);
                const withGrid = document.getElementById('withGrid').checked;
                const enhanceColors = document.getElementById('enhanceColors').checked;
                
                // Preparar dados para envio
                const requestData = {
                    image_data: processedImageData,
                    pixel_size: pixelSizeValue,
                    with_grid: withGrid,
                    enhance_colors: enhanceColors
                };
                
                // Enviar requisição para a API com timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos de timeout
                
                progressBar.style.width = '70%';
                
                fetch('/api/convert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData),
                    signal: controller.signal
                })
                .then(response => {
                    clearTimeout(timeoutId);
                    progressBar.style.width = '90%';
                    
                    if (!response.ok) {
                        throw new Error('Erro no servidor: ' + response.status);
                    }
                    return response.json();
                })
                .then(data => {
                    // Completar barra de progresso
                    progressBar.style.width = '100%';
                    
                    // Esconder loader e barra de progresso após um breve delay
                    setTimeout(() => {
                        loaderContainer.classList.remove('active');
                        progressContainer.classList.remove('active');
                        progressBar.style.width = '0%';
                    }, 500);
                    
                    // Habilitar botão de conversão
                    convertButton.disabled = false;
                    
                    if (data.success) {
                        // Mostrar seção de resultados
                        resultsSection.classList.add('active');
                        
                        // Limpar resultados anteriores
                        resultsGrid.innerHTML = '';
                        
                        // Adicionar resultado
                        displayResult(data.result_image);
                        
                        // Rolar para a seção de resultados
                        resultsSection.scrollIntoView({ behavior: 'smooth' });
                        
                        // Mostrar mensagem de sucesso
                        showAlert('Conversão concluída com sucesso!', 'success');
                    } else {
                        showAlert(data.error || 'Ocorreu um erro durante a conversão.', 'danger');
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    
                    // Esconder loader e barra de progresso
                    loaderContainer.classList.remove('active');
                    progressContainer.classList.remove('active');
                    progressBar.style.width = '0%';
                    
                    // Habilitar botão de conversão
                    convertButton.disabled = false;
                    
                    // Verificar se foi um erro de timeout
                    if (error.name === 'AbortError') {
                        showAlert('O processamento demorou muito tempo e foi interrompido. Tente uma imagem menor ou use a versão local do aplicativo para imagens grandes.', 'danger');
                    } else {
                        // Mostrar mensagem de erro
                        showAlert('Erro: ' + error.message, 'danger');
                    }
                    
                    // Sugerir alternativa local
                    showLocalFallbackOption();
                });
            });
        };
        
        reader.onerror = function() {
            // Esconder loader e barra de progresso
            loaderContainer.classList.remove('active');
            progressContainer.classList.remove('active');
            
            // Habilitar botão de conversão
            convertButton.disabled = false;
            
            // Mostrar mensagem de erro
            showAlert('Erro ao ler o arquivo.', 'danger');
        };
        
        // Iniciar leitura do arquivo
        reader.readAsDataURL(fileInput.files[0]);
    });
    
    // Função para pré-processar a imagem
    function preprocessImage(imageData, callback) {
        // Criar uma imagem para obter dimensões
        const img = new Image();
        img.onload = function() {
            // Verificar se a imagem é grande demais
            if (this.width > 1000 || this.height > 1000) {
                // Redimensionar a imagem no cliente antes de enviar
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calcular novas dimensões mantendo proporção
                const maxDimension = 1000;
                const ratio = Math.min(maxDimension / this.width, maxDimension / this.height);
                const newWidth = Math.floor(this.width * ratio);
                const newHeight = Math.floor(this.height * ratio);
                
                // Configurar canvas e desenhar imagem redimensionada
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(this, 0, 0, newWidth, newHeight);
                
                // Obter data URL com qualidade reduzida
                const processedImageData = canvas.toDataURL('image/jpeg', 0.85);
                callback(processedImageData);
            } else {
                // Imagem já está em um tamanho aceitável
                callback(imageData);
            }
        };
        img.onerror = function() {
            // Em caso de erro, usar a imagem original
            callback(imageData);
        };
        img.src = imageData;
    }
    
    // Função para exibir o resultado
    function displayResult(resultImageData) {
        // Criar card para o resultado
        const card = document.createElement('div');
        card.className = 'result-card';
        
        // Criar imagem
        const img = document.createElement('img');
        img.className = 'result-image';
        img.src = resultImageData;
        img.alt = 'Pixel Art Digital';
        
        // Criar informações
        const info = document.createElement('div');
        info.className = 'result-info';
        
        // Nome do resultado
        const name = document.createElement('div');
        name.className = 'result-name';
        name.textContent = 'Pixel Art Digital';
        
        // Descrição
        const description = document.createElement('div');
        description.className = 'result-description';
        description.textContent = 'Versão digital final da sua pixel art.';
        
        // Botão de download
        const downloadLink = document.createElement('a');
        downloadLink.className = 'download-button';
        downloadLink.href = resultImageData;
        downloadLink.download = 'pixel_art_' + new Date().getTime() + '.jpg';
        downloadLink.textContent = 'Download';
        
        // Montar estrutura
        info.appendChild(name);
        info.appendChild(description);
        info.appendChild(downloadLink);
        
        card.appendChild(img);
        card.appendChild(info);
        
        // Adicionar ao grid de resultados
        resultsGrid.appendChild(card);
    }
    
    // Função para mostrar opção de fallback local
    function showLocalFallbackOption() {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'fallback-option';
        fallbackDiv.innerHTML = `
            <h3>Alternativa para Imagens Grandes</h3>
            <p>Para processar imagens maiores, você pode baixar a versão local do aplicativo que não tem as limitações da versão web:</p>
            <a href="https://github.com/seu-usuario/pixel-art-converter/releases/latest" class="download-button" target="_blank">Baixar Versão Desktop</a>
        `;
        
        // Adicionar ao container de resultados
        resultsSection.classList.add('active');
        resultsGrid.appendChild(fallbackDiv);
        
        // Rolar para a seção
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Função para exibir alertas
    function showAlert(message, type) {
        // Limpar alertas anteriores do mesmo tipo
        const existingAlerts = alertContainer.querySelectorAll(`.alert-${type}`);
        existingAlerts.forEach(alert => alert.remove());
        
        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Adicionar ao container
        alertContainer.appendChild(alert);
        
        // Remover após 5 segundos se for sucesso ou info
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }
    
    // Inicialização: esconder seção de resultados
    resultsSection.classList.remove('active');
});
