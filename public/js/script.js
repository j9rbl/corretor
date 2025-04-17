// script.js - Funcionalidades frontend para o Conversor de Pixel Art

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
    const minCellSize = document.getElementById('minCellSize');
    const minCellSizeValue = document.getElementById('minCellSizeValue');
    const maxCellSize = document.getElementById('maxCellSize');
    const maxCellSizeValue = document.getElementById('maxCellSizeValue');
    
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
    
    minCellSize.addEventListener('input', function() {
        minCellSizeValue.textContent = this.value;
        
        // Garantir que o tamanho mínimo não seja maior que o máximo
        if (parseInt(this.value) > parseInt(maxCellSize.value)) {
            maxCellSize.value = this.value;
            maxCellSizeValue.textContent = this.value;
        }
    });
    
    maxCellSize.addEventListener('input', function() {
        maxCellSizeValue.textContent = this.value;
        
        // Garantir que o tamanho máximo não seja menor que o mínimo
        if (parseInt(this.value) < parseInt(minCellSize.value)) {
            minCellSize.value = this.value;
            minCellSizeValue.textContent = this.value;
        }
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
        
        // Criar FormData para envio
        const formData = new FormData(uploadForm);
        
        // Enviar requisição AJAX
        fetch('/convert', {
            method: 'POST',
            body: formData
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
                
                // Adicionar novos resultados
                displayResults(data.results);
                
                // Rolar para a seção de resultados
                resultsSection.scrollIntoView({ behavior: 'smooth' });
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
    });
    
    // Função para exibir os resultados
    function displayResults(results) {
        // Verificar se é um array (múltiplos resultados) ou objeto (resultado único)
        const resultsArray = Array.isArray(results) ? results : [results];
        
        resultsArray.forEach(result => {
            if (!result.success) {
                return; // Pular resultados com erro
            }
            
            // Criar cards para cada tipo de resultado
            const resultTypes = [
                { 
                    path: result.grid_visualization_path || result.grid_visualization_path_url, 
                    name: 'Visualização da Grade', 
                    description: 'Grade detectada na imagem original.'
                },
                { 
                    path: result.color_matrix_path || result.color_matrix_path_url, 
                    name: 'Matriz de Cores', 
                    description: 'Cores detectadas em cada célula da grade.'
                },
                { 
                    path: result.pixel_art_path || result.pixel_art_path_url, 
                    name: 'Pixel Art Digital', 
                    description: 'Versão digital final da sua pixel art.'
                },
                { 
                    path: result.spritesheet_path || result.spritesheet_path_url, 
                    name: 'Spritesheet', 
                    description: 'Versão da pixel art como spritesheet.'
                }
            ];
            
            resultTypes.forEach(type => {
                if (type.path) {
                    const card = document.createElement('div');
                    card.className = 'result-card';
                    
                    const img = document.createElement('img');
                    img.className = 'result-image';
                    img.src = type.path.startsWith('/') ? `/results/${type.path.split('/').pop()}` : type.path;
                    img.alt = type.name;
                    
                    const info = document.createElement('div');
                    info.className = 'result-info';
                    
                    const name = document.createElement('div');
                    name.className = 'result-name';
                    name.textContent = type.name;
                    
                    const description = document.createElement('div');
                    description.className = 'result-description';
                    description.textContent = type.description;
                    
                    const downloadLink = document.createElement('a');
                    downloadLink.className = 'download-button';
                    downloadLink.href = img.src;
                    downloadLink.download = type.name.toLowerCase().replace(/\s+/g, '_') + '.png';
                    downloadLink.textContent = 'Download';
                    
                    info.appendChild(name);
                    info.appendChild(description);
                    info.appendChild(downloadLink);
                    
                    card.appendChild(img);
                    card.appendChild(info);
                    
                    resultsGrid.appendChild(card);
                }
            });
        });
        
        // Mostrar mensagem de sucesso
        showAlert('Conversão concluída com sucesso!', 'success');
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
