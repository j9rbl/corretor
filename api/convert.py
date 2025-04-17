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
def process_image(image_data, pixel_size=20, with_grid=False, enhance_colors=True):
    # Decodificar a imagem base64
    image_bytes = base64.b64decode(image_data.split(',')[1])
    
    # Converter para array numpy usando OpenCV
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return None, "Erro ao processar a imagem"
    
    # Detectar grade (simplificado para este exemplo)
    height, width = image.shape[:2]
    cell_size = 30  # Tamanho estimado da célula
    cells_y = height // cell_size
    cells_x = width // cell_size
    
    # Criar matriz de cores
    color_matrix = np.zeros((cells_y, cells_x, 3), dtype=np.uint8)
    
    # Analisar cada célula
    for y in range(cells_y):
        for x in range(cells_x):
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
        # Converter para HSV para ajustar saturação e brilho
        hsv_matrix = np.zeros_like(color_matrix)
        for y in range(cells_y):
            for x in range(cells_x):
                hsv_pixel = cv2.cvtColor(color_matrix[y, x].reshape(1, 1, 3), cv2.COLOR_BGR2HSV)
                hsv_matrix[y, x] = hsv_pixel[0, 0]
        
        # Aumentar saturação e valor
        hsv_matrix[:, :, 1] = np.clip(hsv_matrix[:, :, 1] * 1.2, 0, 255).astype(np.uint8)  # Saturação
        hsv_matrix[:, :, 2] = np.clip(hsv_matrix[:, :, 2] * 1.1, 0, 255).astype(np.uint8)  # Valor
        
        # Converter de volta para BGR
        for y in range(cells_y):
            for x in range(cells_x):
                bgr_pixel = cv2.cvtColor(hsv_matrix[y, x].reshape(1, 1, 3), cv2.COLOR_HSV2BGR)
                color_matrix[y, x] = bgr_pixel[0, 0]
    
    # Gerar pixel art
    grid_width = 1 if with_grid else 0
    width = cells_x * pixel_size + (cells_x + 1) * grid_width if with_grid else cells_x * pixel_size
    height = cells_y * pixel_size + (cells_y + 1) * grid_width if with_grid else cells_y * pixel_size
    
    # Criar imagem em branco
    pixel_art = np.ones((height, width, 3), dtype=np.uint8) * (255 if with_grid else 0)
    
    # Se com grade, preencher toda a imagem com a cor da grade
    if with_grid:
        pixel_art[:, :] = (0, 0, 0)  # Cor da grade (preto)
    
    # Preencher cada pixel com a cor correspondente
    for y in range(cells_y):
        for x in range(cells_x):
            # Calcular coordenadas do pixel na imagem final
            if with_grid:
                y1 = y * (pixel_size + grid_width) + grid_width
                x1 = x * (pixel_size + grid_width) + grid_width
            else:
                y1 = y * pixel_size
                x1 = x * pixel_size
            
            y2 = y1 + pixel_size
            x2 = x1 + pixel_size
            
            # Preencher o pixel com a cor da matriz
            pixel_art[y1:y2, x1:x2] = color_matrix[y, x]
    
    # Converter para RGB (de BGR)
    pixel_art_rgb = cv2.cvtColor(pixel_art, cv2.COLOR_BGR2RGB)
    
    # Converter para imagem PIL
    pil_img = Image.fromarray(pixel_art_rgb)
    
    # Salvar em buffer de memória
    buffer = BytesIO()
    pil_img.save(buffer, format="PNG")
    
    # Converter para base64
    img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_str}", None

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            
            # Extrair parâmetros
            image_data = data.get('image_data', '')
            pixel_size = int(data.get('pixel_size', 20))
            with_grid = data.get('with_grid', False)
            enhance_colors = data.get('enhance_colors', True)
            
            # Processar imagem
            result_image, error = process_image(
                image_data, 
                pixel_size=pixel_size,
                with_grid=with_grid,
                enhance_colors=enhance_colors
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
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode('utf-8'))
