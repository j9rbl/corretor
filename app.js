document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('sharpenButton').addEventListener('click', applySharpen, false);
document.getElementById('indexColorButton').addEventListener('click', convertToIndexedColors, false);
document.getElementById('correctColorsButton').addEventListener('click', correctColors, false);

let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let img = new Image();
let originalImageData = null;

const colors = {
    "BRANCO": "#ffffff",
    "PRETO": "#000000",
    "AZUL CLARO/CYAN": "#00fffc",
    "AZUL MÉDIO": "#00adff",
    "AZUL": "#0048ff",
    "AZUL ESCURO": "#002499",
    "AZUL CELESTE": "#037aff",
    "ROSA CLARO": "#ffa5e0",
    "AZUL BEBÊ": "#aae2ff",
    "ROSA PINK": "#ff0480",
    "ROSA/CHICLETE": "#ff00cc",
    "ROXO": "#c000ff",
    "ROXO ESCURO": "#6a00a1",
    "AMARELO BEBÊ": "#fffdb3",
    "AMARELO": "#fff600",
    "LARANJA": "#ffa200",
    "LARANJA ESCURO": "#ff7e00",
    "VERMELHO": "#ff0000",
    "VERMELHO ESCURO": "#ab0000",
    "VERDE FLUORESCENTE": "#9cff00",
    "VERDE TIFANNY": "#00ffb4",
    "VERDE": "#00b300",
    "VERDE BANDEIRA": "#037603",
    "VERDE ESCURO": "#00520c",
    "VERDE OLIVA": "#485a00",
    "VERDE MUSGO": "#1f370f",
    "CINZA CLARO": "#c7c7c7",
    "CINZA": "#939393",
    "CINZA ESCURO": "#464646",
    "CHUMBO": "#2a2a2a",
    "BEGE/CREME": "#ffdcbf",
    "PÊSSEGO/SALMÃO CLARO": "#fdbdab",
    "PÊSSEGO/SALMÃO MÉDIO": "#fbb697",
    "PÊSSEGO/SALMÃO ESCURO": "#f9957b",
    "CARAMELO CLARO": "#d07a5f",
    "CARAMELO MÉDIO": "#b86851",
    "CARAMELO ESCURO": "#9e4a32",
    "MARROM CLARO": "#85492b",
    "MARROM": "#763726",
    "MARROM ESCURO": "#431e09",
    "PALHA/MARFIM": "#fde5d0",
    "MARSALA AVERMELHADO": "#740012",
    "CARAMELO TELHA": "#d1786a",
    "UVA": "#a1008c",
    "AMARELO GEMA": "#ffba00",
    "MARSALA": "#921d00",
    "LAVANDA": "#c5a5ff",
    "OCRE": "#c36a00",
    "VERDE TIF. ESCURO": "#00b5bc",
    "AMARELO OURO": "#F1D600",
    "CHOCOLATE": "#6a3319",
    "OCRE": "#ad6628",
    "VERMELHO CEREJA": "#fe324a",
    "VERDE LIMA": "#bbe04c",
    "VERDE CLARO": "#c3ffb5",
    "VERDE TIFF. CLARO": "#83ffdb",
    "ROSA CLARÍSSIMO": "#ffc9ec",
    "CINZA CLARÍSSIMO": "#dadada",
    "GOIABA": "#ff7e7e",
    "DOCE DE LEITE": "#edad75"
};

function handleImage(e) {
    let reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            updateImageInfo();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

function applySharpen() {
    if (!originalImageData) return;

    ctx.putImageData(originalImageData, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let sharpenMatrix = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];

    let w = canvas.width;
    let h = canvas.height;

    let tempCanvas = document.createElement('canvas');
    let tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempCtx.putImageData(imageData, 0, 0);

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let idx = (y * w + x) * 4;

            let r = 0, g = 0, b = 0;
            let k = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    let kernelIdx = ((y + ky) * w + (x + kx)) * 4;
                    r += tempCtx.getImageData(x + kx, y + ky, 1, 1).data[0] * sharpenMatrix[k];
                    g += tempCtx.getImageData(x + kx, y + ky, 1, 1).data[1] * sharpenMatrix[k];
                    b += tempCtx.getImageData(x + kx, y + ky, 1, 1).data[2] * sharpenMatrix[k];
                    k++;
                }
            }

            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function convertToIndexedColors() {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let colorValues = Object.values(colors).map(hexToRgb);
    let usedColors = new Set();

    for (let i = 0; i < data.length; i += 4) {
        let nearestColor = findNearestColor(data[i], data[i + 1], data[i + 2], colorValues);
        data[i] = nearestColor[0];
        data[i + 1] = nearestColor[1];
        data[i + 2] = nearestColor[2];
        usedColors.add(`rgb(${nearestColor[0]},${nearestColor[1]},${nearestColor[2]})`);
    }

    ctx.putImageData(imageData, 0, 0);
    enlargePixels();
    updateImageInfo(Array.from(usedColors));
}

function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return [r, g, b];
}

function findNearestColor(r, g, b, colorValues) {
    let minDist = Infinity;
    let nearestColor = [0, 0, 0];

    for (let color of colorValues) {
        let dist = Math.sqrt(
            Math.pow(r - color[0], 2) +
            Math.pow(g - color[1], 2) +
            Math.pow(b - color[2], 2)
        );

        if (dist < minDist) {
            minDist = dist;
            nearestColor = color;
        }
    }

    return nearestColor;
}

function enlargePixels() {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let enlargedCanvas = document.createElement('canvas');
    let enlargedCtx = enlargedCanvas.getContext('2d');
    enlargedCanvas.width = canvas.width * 10;
    enlargedCanvas.height = canvas.height * 10;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let idx = (y * canvas.width + x) * 4;
            enlargedCtx.fillStyle = `rgb(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]})`;
            enlargedCtx.fillRect(x * 10, y * 10, 10, 10);
        }
    }

    canvas.width = enlargedCanvas.width;
    canvas.height = enlargedCanvas.height;
    ctx.drawImage(enlargedCanvas, 0, 0);
}

function updateImageInfo(usedColors = []) {
    let imageSize = document.getElementById('imageSize');
    imageSize.textContent = `Tamanho da Imagem: ${canvas.width / 10} x ${canvas.height / 10}`;

    let colorList = document.getElementById('colorList');
    colorList.innerHTML = '';

    usedColors.forEach(color => {
        let colorBox = document.createElement('div');
        colorBox.className = 'colorBox';
        colorBox.style.backgroundColor = color;

        let colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = rgbToHex(color);
        colorInput.addEventListener('input', function() {
            colorBox.style.backgroundColor = colorInput.value;
            replaceColor(color, colorInput.value);
        });

        colorBox.appendChild(colorInput);
        colorList.appendChild(colorBox);
    });
}

function rgbToHex(color) {
    let [r, g, b] = color.match(/\d+/g).map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function replaceColor(oldColor, newColor) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let [r1, g1, b1] = oldColor.match(/\d+/g).map(Number);
    let [r2, g2, b2] = hexToRgb(newColor);

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === r1 && data[i + 1] === g1 && data[i + 2] === b1) {
            let nearestColor = findNearestColor(r2, g2, b2, Object.values(colors).map(hexToRgb));
            data[i] = nearestColor[0];
            data[i + 1] = nearestColor[1];
            data[i + 2] = nearestColor[2];
        }
    }

    ctx.putImageData(imageData, 0, 0);
    updateImageInfo(getUsedColors());
}

function getUsedColors() {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let usedColors = new Set();

    for (let i = 0; i < data.length; i += 4) {
        usedColors.add(`rgb(${data[i]},${data[i + 1]},${data[i + 2]})`);
    }

    return Array.from(usedColors);
}

function correctColors() {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    let colorValues = Object.values(colors).map(hexToRgb);

    for (let i = 0; i < data.length; i += 4) {
        let nearestColor = findNearestColor(data[i], data[i + 1], data[i + 2], colorValues);
        data[i] = nearestColor[0];
        data[i + 1] = nearestColor[1];
        data[i + 2] = nearestColor[2];
    }

    ctx.putImageData(imageData, 0, 0);
    updateImageInfo(getUsedColors());
}
