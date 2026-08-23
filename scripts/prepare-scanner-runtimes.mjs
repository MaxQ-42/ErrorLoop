import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const destination = resolve('public/vendor')
mkdirSync(resolve(destination, 'opencv'), { recursive: true })
mkdirSync(resolve(destination, 'jscanify'), { recursive: true })

copyFileSync(
  resolve('node_modules/jscanify/src/opencv.js'),
  resolve(destination, 'opencv/opencv.js'),
)
copyFileSync(
  resolve('node_modules/jscanify/src/jscanify.js'),
  resolve(destination, 'jscanify/jscanify.js'),
)
