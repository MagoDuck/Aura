// generate-icons.js
// Para usar: npm install sharp
// Depois: node generate-icons.js

const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = 'source-icon.png'; // Coloque sua imagem fonte aqui

async function generateIcons() {
  if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons');
  }
  
  for (const size of sizes) {
    try {
      await sharp(inputImage)
        .resize(size, size)
        .png()
        .toFile(`icons/icon-${size}.png`);
      console.log(`✅ Gerado icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}.png:`, error);
    }
  }
  
  console.log('🎉 Todos os ícones foram gerados com sucesso!');
}

generateIcons();