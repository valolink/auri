import * as GeoTIFF from 'geotiff'

export async function renderGeoTiffToCanvas(blob: Blob, canvas: HTMLCanvasElement) {
  const arrayBuffer = await blob.arrayBuffer()
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()

  const width = image.getWidth()
  const height = image.getHeight()

  const samplesPerPixel = image.getSamplesPerPixel()
  const raster = await image.readRasters({ interleave: true })

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available')

  canvas.width = width
  canvas.height = height

  const imageData = ctx.createImageData(width, height)

  for (let i = 0, j = 0; i < raster.length; i += samplesPerPixel, j += 4) {
    if (samplesPerPixel === 1) {
      // Grayscale
      const v = raster[i]
      imageData.data[j] = v
      imageData.data[j + 1] = v
      imageData.data[j + 2] = v
      imageData.data[j + 3] = 255
    } else if (samplesPerPixel === 3) {
      // RGB
      imageData.data[j] = raster[i]
      imageData.data[j + 1] = raster[i + 1]
      imageData.data[j + 2] = raster[i + 2]
      imageData.data[j + 3] = 255
    } else if (samplesPerPixel === 4) {
      // RGBA
      imageData.data[j] = raster[i]
      imageData.data[j + 1] = raster[i + 1]
      imageData.data[j + 2] = raster[i + 2]
      imageData.data[j + 3] = raster[i + 3]
    } else {
      throw new Error(`Unsupported number of samples per pixel: ${samplesPerPixel}`)
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
