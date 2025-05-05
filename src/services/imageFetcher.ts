export async function fetchGeoTiffImage(imageUrl: string, apiKey: string): Promise<string> {
  const url = new URL(imageUrl)
  const imageId = url.searchParams.get('id') || imageUrl.split('id=')[1]

  if (!imageId) {
    throw new Error('Unable to extract image ID from URL')
  }

  const fetchUrl = `https://solar.googleapis.com/v1/geoTiff:get?id=${imageId}&key=${apiKey}`

  const response = await fetch(fetchUrl)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`geoTiff:get error: ${text}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob) // usable as <img :src="..." />
}
