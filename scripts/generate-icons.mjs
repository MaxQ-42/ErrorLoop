import sharp from 'sharp';
const source='public/icons/app-icon.svg', maskable='public/icons/app-icon-maskable.svg';
await Promise.all([
  sharp(source).resize(192,192).png().toFile('public/icons/errorloop-192.png'),
  sharp(source).resize(512,512).png().toFile('public/icons/errorloop-512.png'),
  sharp(maskable).resize(512,512).png().toFile('public/icons/errorloop-maskable-512.png'),
  sharp(source).resize(180,180).png().toFile('public/icons/apple-touch-icon.png'),
  sharp(source).resize(48,48).png().toFile('public/icons/favicon-48.png'),
]);
