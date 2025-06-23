import { useAppState } from '@/useAppState'

const { ajaxUrl, settings, input, output, buildingData } = useAppState()

export const requestPdf = async function (image) {
  const formData = new FormData()
  formData.append('action', 'pdf_report')
  formData.append('title', input.address)

  if (image) {
    formData.append('image', image)
  }

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
