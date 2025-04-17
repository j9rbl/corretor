#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Versão local do Conversor de Pixel Art para processar imagens grandes.
Esta versão não tem as limitações de tempo e memória do ambiente serverless.
"""

import os
import sys
import argparse
import numpy as np
import cv2
from PIL import Image
import base64
import json
import time
from pathlib import Path
import webbrowser
import http.server
import socketserver
import threading

# Configurações
OUTPUT_DIR = "output"
TEMP_DIR = "temp"
MAX_DIMENSION = 3000  # Maior dimensão permitida sem redimensionamento

def process_image(image_path, pixel_size=10, with_grid=False, enhance_colors=True, output_path=None):
    """
    Processa uma imagem de pixel art e gera uma versão digital.
    
    Args:
        image_path (str): Caminho para a imagem de entrada
        pixel_size (int): Tamanho de cada pixel na imagem final
        with_grid (bool): Se True, adiciona uma grade entre os pixels
        enhance_colors (bool): Se True, melhora as cores da pixel art
        output_path (str): Caminho para salvar a imagem de saída
        
    Returns:
        str: Caminho para a imagem processada
    """
    print(f"Processando imagem: {image_path}")
    print(f"Configurações: pixel_size={pixel_size}, with_grid={with_grid}, enhance_colors={enhance_colors}")
    
    start_time = time.time()
    
    # Carregar imagem
    try:
        image = cv2.imread(image_path)
        if image is None:
            # Tentar com PIL se OpenCV falhar
            pil_img = Image.open(image_path)
            image = np.array(pil_img)
            if len(image.shape) == 3 and image.shape[2] == 4:  # Com canal alpha
                image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
            elif len(image.shape) == 3 and image.shape[2] == 3:  # RGB
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"Erro ao carregar a imagem: {e}")
        return None
    
    # Verificar dimensões
    height, width = image.shape[:2]
    print(f"Dimensões da imagem: {width}x{height}")
    
    # Redimensionar se necessário
    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        print(f"Imagem muito grande, redimensionando...")
        ratio = min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        height, width = image.shape[:2]
        print(f"Novas dimensões: {new_width}x{new_height}")
    
    # Detectar grade
    print("Detectando grade...")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    
    # Valor padrão para o tamanho da célula
    cell_size = 10
    
    # Tentar detectar o tamanho da célula
    try:
        # Aplicar detecção de bordas
        edges = cv2.Canny(gray, 50, 150)
        
        # Detectar linhas
        lines = cv2.HoughLinesP(edges, 1, np.pi/90, threshold=100, minLineLength=width//10, maxLineGap=20)
        
        if lines is not None and len(lines) > 0:
            # Separar linhas horizontais e verticais
            h_lines = []
            v_lines = []
            
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if abs(y2 - y1) < abs(x2 - x1) // 5:  # Linha quase horizontal
                    h_lines.append(y1)
                elif abs(x2 - x1) < abs(y2 - y1) // 5:  # Linha quase vertical
                    v_lines.append(x1)
            
            # Ordenar e encontrar distâncias mais frequentes
            if h_lines:
                h_lines.sort()
                h_diffs = [h_lines[i+1] - h_lines[i] for i in range(len(h_lines)-1) if h_lines[i+1] - h_lines[i] > 3]
                if h_diffs:
                    h_cell = max(set(h_diffs), key=h_diffs.count)
                    if 5 <= h_cell <= 50:  # Tamanho razoável para uma célula
                        cell_size = h_cell
            
            if v_lines and cell_size == 10:  # Se ainda não encontramos um bom valor
                v_lines.sort()
                v_diffs = [v_lines[i+1] - v_lines[i] for i in range(len(v_lines)-1) if v_lines[i+1] - v_lines[i] > 3]
                if v_diffs:
                    v_cell = max(set(v_diffs), key=v_diffs.count)
                    if 5 <= v_cell <= 50:  # Tamanho razoável para uma célula
                        cell_size = v_cell
    except Exception as e:
        print(f"Erro na detecção de grade: {e}")
    
    print(f"Tamanho da célula detectado: {cell_size}px")
    
    # Calcular número de células
    cells_y = height // cell_size
    cells_x = width // cell_size
    print(f"Grade: {cells_x}x{cells_y} células")
    
    # Criar matriz de cores
    print("Analisando cores...")
    color_matrix = np.zeros((cells_y, cells_x, 3), dtype=np.uint8)
    
    # Processar em blocos para melhor feedback
    block_size = 50  # Processar 50x50 células por vez
    total_blocks = ((cells_y + block_size - 1) // block_size) * ((cells_x + block_size - 1) // block_size)
    block_count = 0
    
    for by in range(0, cells_y, block_size):
        for bx in range(0, cells_x, block_size):
            block_count += 1
            print(f"Processando bloco {block_count}/{total_blocks}...")
            
            # Definir limites do bloco atual
            by_end = min(by + block_size, cells_y)
            bx_end = min(bx + block_size, cells_x)
            
            # Processar cada célula no bloco
            for y in range(by, by_end):
                for x in range(bx, bx_end):
                    # Extrair região da célula
                    y1 = y * cell_size
                    x1 = x * cell_size
                    y2 = min((y + 1) * cell_size, height)
                    x2 = min((x + 1) * cell_size, width)
                    
                    cell = image[y1:y2, x1:x2]
                    
                    # Calcular cor média
                    if cell.size > 0:
                        color = np.mean(cell, axis=(0, 1)).astype(np.uint8)
                        color_matrix[y, x] = color
    
    # Melhorar cores se solicitado
    if enhance_colors:
        print("Melhorando cores...")
        # Converter para HSV para ajustar saturação e brilho
        hsv_matrix = np.zeros_like(color_matrix)
        
        # Processar em blocos
        for by in range(0, cells_y, block_size):
            for bx in range(0, cells_x, block_size):
                # Definir limites do bloco atual
                by_end = min(by + block_size, cells_y)
                bx_end = min(bx + block_size, cells_x)
                
                # Converter bloco para HSV
                block = color_matrix[by:by_end, bx:bx_end]
                block_hsv = cv2.cvtColor(block, cv2.COLOR_BGR2HSV)
                
                # Aumentar saturação e valor
                block_hsv[:, :, 1] = np.clip(block_hsv[:, :, 1] * 1.2, 0, 255).astype(np.uint8)  # Saturação
                block_hsv[:, :, 2] = np.clip(block_hsv[:, :, 2] * 1.1, 0, 255).astype(np.uint8)  # Valor
                
                # Converter de volta para BGR
                block_enhanced = cv2.cvtColor(block_hsv, cv2.COLOR_HSV2BGR)
                color_matrix[by:by_end, bx:bx_end] = block_enhanced
    
    # Gerar pixel art
    print("Gerando pixel art...")
    grid_width = 1 if with_grid else 0
    
    # Calcular dimensões da imagem final
    out_width = cells_x * pixel_size + (cells_x + 1) * grid_width if with_grid else cells_x * pixel_size
    out_height = cells_y * pixel_size + (cells_y + 1) * grid_width if with_grid else cells_y * pixel_size
    
    print(f"Dimensões da saída: {out_width}x{out_height}")
    
    # Criar imagem em branco
    pixel_art = np.ones((out_height, out_width, 3), dtype=np.uint8) * (255 if with_grid else 0)
    
    # Se com grade, preencher toda a imagem com a cor da grade
    if with_grid:
        pixel_art[:, :] = (0, 0, 0)  # Cor da grade (preto)
    
    # Preencher cada pixel com a cor correspondente
    for by in range(0, cells_y, block_size):
        for bx in range(0, cells_x, block_size):
            # Definir limites do bloco atual
            by_end = min(by + block_size, cells_y)
            bx_end = min(bx + block_size, cells_x)
            
            # Processar cada célula no bloco
            for y in range(by, by_end):
                for x in range(bx, bx_end):
                    # Calcular coordenadas do pixel na imagem final
                    if with_grid:
                        y1 = y * (pixel_size + grid_width) + grid_width
                        x1 = x * (pixel_size + grid_width) + grid_width
                    else:
                        y1 = y * pixel_size
                        x1 = x * pixel_size
                    
                    y2 = y1 + pixel_size
                    x2 = x1 + pixel_size
                    
                    # Verificar limites
                    if y1 < out_height and x1 < out_width:
                        # Preencher o pixel com a cor da matriz
                        y2 = min(y2, out_height)
                        x2 = min(x2, out_width)
                        pixel_art[y1:y2, x1:x2] = color_matrix[y, x]
    
    # Salvar resultado
    if output_path is None:
        # Criar diretório de saída se não existir
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # Gerar nome de arquivo baseado no original
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        output_path = os.path.join(OUTPUT_DIR, f"{base_name}_pixel_art.png")
    
    # Converter para RGB (de BGR)
    pixel_art_rgb = cv2.cvtColor(pixel_art, cv2.COLOR_BGR2RGB)
    
    # Salvar usando PIL para melhor compatibilidade
    pil_img = Image.fromarray(pixel_art_rgb)
    pil_img.save(output_path)
    
    end_time = time.time()
    print(f"Processamento concluído em {end_time - start_time:.2f} segundos")
    print(f"Resultado salvo em: {output_path}")
    
    return output_path

def create_html_viewer(image_path, original_path):
    """
    Cria uma página HTML para visualizar o resultado.
    
    Args:
        image_path (str): Caminho para a imagem processada
        original_path (str): Caminho para a imagem original
        
    Returns:
        str: Caminho para o arquivo HTML
    """
    os.makedirs(TEMP_DIR, exist_ok=True)
    html_path = os.path.join(TEMP_DIR, "result.html")
    
    # Obter caminhos relativos
    rel_image_path = os.path.relpath(image_path, TEMP_DIR)
    rel_original_path = os.path.relpath(original_path, TEMP_DIR)
    
    html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado do Conversor de Pixel Art</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7fc;
            margin: 0;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
            padding: 20px;
        }}
        
        h1 {{
            color: #4a6baf;
            text-align: center;
            margin-bottom: 30px;
        }}
        
        .result-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .result-card {{
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        }}
        
        .result-image {{
            width: 100%;
            height: auto;
            display: block;
        }}
        
        .result-info {{
            padding: 15px;
        }}
        
        .result-name {{
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 8px;
            color: #343a40;
        }}
        
        .result-description {{
            color: #6c757d;
            margin-bottom: 15px;
        }}
        
        .button {{
            display: inline-block;
            background-color: #4a6baf;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.3s;
        }}
        
        .button:hover {{
            background-color: #3a569c;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Resultado do Conversor de Pixel Art</h1>
        
        <div class="result-grid">
            <div class="result-card">
                <img src="{rel_original_path}" alt="Imagem Original" class="result-image">
                <div class="result-info">
                    <div class="result-name">Imagem Original</div>
                    <div class="result-description">Pixel art desenhada à mão.</div>
                </div>
            </div>
            
            <div class="result-card">
                <img src="{rel_image_path}" alt="Pixel Art Digital" class="result-image">
                <div class="result-info">
                    <div class="result-name">Pixel Art Digital</div>
                    <div class="result-description">Versão digital com cores sólidas.</div>
                    <a href="{rel_image_path}" download class="button">Download</a>
                </div>
            </div>
        </div>
        
        <p style="text-align: center; color: #6c757d;">
            Processado pelo Conversor de Pixel Art - Versão Local
        </p>
    </div>
</body>
</html>
"""
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    return html_path

def start_server(port=8000):
    """
    Inicia um servidor HTTP local para visualizar os resultados.
    
    Args:
        port (int): Porta para o servidor
        
    Returns:
        tuple: (servidor, thread)
    """
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", port), handler)
    
    print(f"Servidor iniciado em http://localhost:{port}")
    
    # Iniciar servidor em uma thread separada
    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    return httpd, server_thread

def main():
    parser = argparse.ArgumentParser(description="Conversor de Pixel Art - Versão Local")
    parser.add_argument("image", help="Caminho para a imagem de pixel art")
    parser.add_argument("--pixel-size", type=int, default=10, help="Tamanho de cada pixel na imagem final (padrão: 10)")
    parser.add_argument("--with-grid", action="store_true", help="Adicionar grade entre os pixels")
    parser.add_argument("--no-enhance", action="store_true", help="Não melhorar as cores")
    parser.add_argument("--output", help="Caminho para salvar a imagem de saída")
    parser.add_argument("--no-view", action="store_true", help="Não abrir o resultado no navegador")
    
    args = parser.parse_args()
    
    # Verificar se o arquivo existe
    if not os.path.isfile(args.image):
        print(f"Erro: O arquivo '{args.image}' não existe.")
        return 1
    
    # Processar imagem
    result_path = process_image(
        args.image,
        pixel_size=args.pixel_size,
        with_grid=args.with_grid,
        enhance_colors=not args.no_enhance,
        output_path=args.output
    )
    
    if result_path is None:
        print("Erro ao processar a imagem.")
        return 1
    
    # Abrir resultado no navegador
    if not args.no_view:
        # Criar página HTML para visualizar o resultado
        html_path = create_html_viewer(result_path, args.image)
        
        # Iniciar servidor local
        current_dir = os.getcwd()
        os.chdir(os.path.dirname(os.path.abspath(html_path)))
        
        httpd, server_thread = start_server()
        
        # Abrir navegador
        webbrowser.open(f"http://localhost:8000/{os.path.basename(html_path)}")
        
        try:
            print("Pressione Ctrl+C para encerrar o servidor...")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Encerrando servidor...")
            httpd.shutdown()
            os.chdir(current_dir)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
