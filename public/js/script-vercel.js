// script-vercel.js - Funcionalidades frontend adaptadas para o Vercel

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
    
    // Elementos de configuração
    const pixelSize = document.getElementById('pixelSize');
    const pixelSizeValue = document.getElementById('pixelSizeValue');
    
    // Atualizar nome do arquivo quando selecionado
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = 'Nenhum arquivo selecionado';
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
        
        // Mostrar loader
        loaderContainer.classList.add('active');
        
        // Desabilitar botão de conversão
        convertButton.disabled = true;
        
        // Ler o arquivo como Data URL
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            
            // Obter valores de configuração
            const pixelSizeValue = parseInt(pixelSize.value);
            const withGrid = document.getElementById('withGrid').checked;
            const enhanceColors = document.getElementById('enhanceColors').checked;
            
            // Preparar dados para envio
            const requestData = {
                image_data: imageData,
                pixel_size: pixelSizeValue,
                with_grid: withGrid,
                enhance_colors: enhanceColors
            };
            
            // Enviar requisição para a API
            fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro no servidor: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                // Esconder loader
                loaderContainer.classList.remove('active');
                
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
                // Esconder loader
                loaderContainer.classList.remove('active');
                
                // Habilitar botão de conversão
                convertButton.disabled = false;
                
                // Mostrar mensagem de erro
                showAlert('Erro: ' + error.message, 'danger');
            });
        };
        
        reader.onerror = function() {
            // Esconder loader
            loaderContainer.classList.remove('active');
            
            // Habilitar botão de conversão
            convertButton.disabled = false;
            
            // Mostrar mensagem de erro
            showAlert('Erro ao ler o arquivo.', 'danger');
        };
        
        // Iniciar leitura do arquivo
        reader.readAsDataURL(fileInput.files[0]);
    });
    
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
        downloadLink.download = 'pixel_art_' + new Date().getTime() + '.png';
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
    
    // Função para exibir alertas
    function showAlert(message, type) {
        // Limpar alertas anteriores
        alertContainer.innerHTML = '';
        
        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Adicionar ao container
        alertContainer.appendChild(alert);
        
        // Remover após 5 segundos se for sucesso
        if (type === 'success') {
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }
    
    // Inicialização: esconder seção de resultados
    resultsSection.classList.remove('active');
});
