import { useAppState } from '@/useAppState'
import { chartImage } from '@/services/chartUtils'

const { ajaxUrl, settings, input, output, buildingData } = useAppState()

export const requestPdf = async function () {
  const formData = new FormData()
  formData.append('action', 'pdf_report')
  formData.append('title', input.address)

  // const imageUrl = chartImage()
  // if (imageUrl) {
  //   const res = await fetch(imageUrl)
  //   const blob = await res.blob()
  //   formData.append('image', blob, 'solarChart.png')
  // }

  try {
    const response = await fetch(ajaxUrl, {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success) {
      window.open(result.data.file_url, '_blank')
    } else {
      console.error('PDF generation failed:', result.data?.message)
    }
  } catch (error) {
    console.error('Fetch error:', error)
  }
}
