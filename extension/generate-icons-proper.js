const sharp = require('sharp');
const fs = require('fs');

// Create a simple icon design programmatically
async function createIcon(size) {
  // Create a canvas with the specified size
  const canvas = Buffer.alloc(size * size * 4); // RGBA
  
  // Fill with blue background
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 59;     // R: Blue
    canvas[i + 1] = 130; // G: Blue
    canvas[i + 2] = 246; // B: Blue
    canvas[i + 3] = 255; // A: Full opacity
  }
  
  // Create a simple design
  const center = Math.floor(size / 2);
  const radius = Math.floor(size * 0.3);
  
  // Draw a white circle in the center
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      if (distance < radius) {
        const index = (y * size + x) * 4;
        canvas[index] = 255;     // R: White
        canvas[index + 1] = 255; // G: White
        canvas[index + 2] = 255; // B: White
        canvas[index + 3] = 255; // A: Full opacity
      }
    }
  }
  
  // Add a dollar sign in the center
  const textSize = Math.floor(size * 0.4);
  const textX = center - Math.floor(textSize / 2);
  const textY = center + Math.floor(textSize / 2);
  
  // Simple dollar sign representation
  for (let y = textY - textSize; y < textY + textSize; y++) {
    for (let x = textX - textSize; x < textX + textSize; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = (y * size + x) * 4;
        // Add a dark blue dollar sign
        canvas[index] = 30;      // R: Dark blue
        canvas[index + 1] = 64;  // G: Dark blue
        canvas[index + 2] = 175; // B: Dark blue
        canvas[index + 3] = 255; // A: Full opacity
      }
    }
  }
  
  return canvas;
}

// Generate icons for different sizes
async function generateIcons() {
  const sizes = [16, 32, 48, 128];
  
  for (const size of sizes) {
    try {
      console.log(`Generating ${size}x${size} icon...`);
      
      const iconData = await createIcon(size);
      
      // Create a proper PNG using Sharp
      const icon = sharp(iconData, {
        raw: {
          width: size,
          height: size,
          channels: 4
        }
      });
      
      const filename = `icon${size}.png`;
      await icon.png().toFile(filename);
      
      console.log(`✅ Created ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to create icon${size}.png:`, error.message);
    }
  }
  
  console.log('\n🎉 Icon generation complete!');
  console.log('The extension should now load without icon errors.');
}

// Run the icon generation
generateIcons().catch(console.error);
