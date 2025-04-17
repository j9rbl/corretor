from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import uuid
import numpy as np
import cv2
from io import BytesIO
from PIL import Image

# Função para processar a imagem e criar pixel art
def process_image(image_data, pixel_size=20, with_grid=False, enhance_colors=True, max_dimension=800):
    try:
        # Decodificar a imagem base64
        image_bytes = base64.b64decode(image_data.split(',')[1])
        
        # Converter para imagem PIL
        img = Image.open(BytesIO(image_bytes))
        
        # Redimensionar imagem se for muito grande
        width, height = img.size
        if width > max_dimension or height > max_dimension:
            # Calcular proporção para manter aspecto
            ratio = min(max_dimension / width, max_dimension / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.LANCZOS)
        
        # Converter para array numpy
        image = np.array(img)
        
        # Converter para BGR se necessário (para OpenCV)
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # Detectar grade (simplificado e otimizado)
        height, width = image.shape[:2]
        
        # Estimar tamanho da célula baseado na imagem
        # Para imagens de pixel art, geralmente podemos detectar linhas de grade
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Usar um valor fixo para o tamanho da célula se a detecção falhar
        cell_size = 10  # Valor padrão
        
        # Tentar detectar o tamanho da célula pela análise de linhas horizontais e verticais
        try:
            # Aplicar detecção de bordas
            edges = cv2.Canny(gray, 50, 150)
            
            # Detectar linhas horizontais e verticais
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
            # Se a detecção falhar, usar o valor padrão
            print(f"Erro na detecção de grade: {e}")
        
        # Limitar o número de células para evitar processamento excessivo
        max_cells = 10000  # Limite para evitar timeout
        cells_y = min(height // cell_size, int(np.sqrt(max_cells * height / width)))
        cells_x = min(width // cell_size, int(np.sqrt(max_cells * width / height)))
        
        # Ajustar cell_size para garantir que usamos toda a imagem
        cell_height = height // cells_y
        cell_width = width // cells_x
        
        # Criar matriz de cores (otimizada para memória)
        color_matrix = np.zeros((cells_y, cells_x, 3), dtype=np.uint8)
        
        # Processar em blocos para reduzir uso de memória
        block_size = 20  # Processar 20x20 células por vez
        for by in range(0, cells_y, block_size):
            for bx in range(0, cells_x, block_size):
                # Definir limites do bloco atual
                by_end = min(by + block_size, cells_y)
                bx_end = min(bx + block_size, cells_x)
                
                # Processar cada célula no bloco
                for y in range(by, by_end):
                    for x in range(bx, bx_end):
                        # Extrair região da célula
                        y1 = y * cell_height
                        x1 = x * cell_width
                        y2 = min((y + 1) * cell_height, height)
                        x2 = min((x + 1) * cell_width, width)
                        
                        cell = image[y1:y2, x1:x2]
                        
                        # Calcular cor média (mais rápido que k-means)
                        if cell.size > 0:
                            color = np.mean(cell, axis=(0, 1)).astype(np.uint8)
                            color_matrix[y, x] = color
        
        # Melhorar cores se solicitado (otimizado)
        if enhance_colors:
            # Converter para HSV para ajustar saturação e brilho
            hsv_matrix = np.zeros_like(color_matrix)
            
            # Processar em blocos para reduzir uso de memória
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
        
        # Gerar pixel art (otimizado)
        grid_width = 1 if with_grid else 0
        
        # Limitar tamanho do pixel para evitar imagens muito grandes
        pixel_size = min(pixel_size, 20)
        
        # Calcular dimensões da imagem final
        out_width = cells_x * pixel_size + (cells_x + 1) * grid_width if with_grid else cells_x * pixel_size
        out_height = cells_y * pixel_size + (cells_y + 1) * grid_width if with_grid else cells_y * pixel_size
        
        # Limitar tamanho da saída
        max_output_size = 2000 * 2000  # ~4MB de memória para uma imagem RGB
        if out_width * out_height > max_output_size:
            scale_factor = np.sqrt(max_output_size / (out_width * out_height))
            pixel_size = max(1, int(pixel_size * scale_factor))
            out_width = cells_x * pixel_size + (cells_x + 1) * grid_width if with_grid else cells_x * pixel_size
            out_height = cells_y * pixel_size + (cells_y + 1) * grid_width if with_grid else cells_y * pixel_size
        
        # Criar imagem em branco
        pixel_art = np.ones((out_height, out_width, 3), dtype=np.uint8) * (255 if with_grid else 0)
        
        # Se com grade, preencher toda a imagem com a cor da grade
        if with_grid:
            pixel_art[:, :] = (0, 0, 0)  # Cor da grade (preto)
        
        # Preencher cada pixel com a cor correspondente (otimizado por blocos)
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
        
        # Converter para RGB (de BGR)
        pixel_art_rgb = cv2.cvtColor(pixel_art, cv2.COLOR_BGR2RGB)
        
        # Converter para imagem PIL
        pil_img = Image.fromarray(pixel_art_rgb)
        
        # Salvar em buffer de memória com compressão otimizada
        buffer = BytesIO()
        pil_img.save(buffer, format="JPEG", quality=85, optimize=True)
        
        # Converter para base64
        img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_str}", None
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Erro no processamento: {e}\n{error_details}")
        return None, f"Erro ao processar a imagem: {str(e)}"

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            
            # Extrair parâmetros
            image_data = data.get('image_data', '')
            pixel_size = min(int(data.get('pixel_size', 10)), 20)  # Limitar tamanho do pixel
            with_grid = data.get('with_grid', False)
            enhance_colors = data.get('enhance_colors', True)
            
            # Processar imagem com limite de tamanho
            result_image, error = process_image(
                image_data, 
                pixel_size=pixel_size,
                with_grid=with_grid,
                enhance_colors=enhance_colors,
                max_dimension=800  # Limitar dimensão máxima
            )
            
            if error:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': error
                }).encode('utf-8'))
                return
            
            # Enviar resposta
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'result_image': result_image
            }).encode('utf-8'))
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Erro na requisição: {e}\n{error_details}")
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode('utf-8'))
