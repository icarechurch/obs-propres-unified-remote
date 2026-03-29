export async function getScreenshot(
  url: string,
  width?: number,
  height?: number,
  sleep?: number,
) {
  const captureBase =
    process.env.SCREENSHOT_SERVICE_URL ?? 'https://image.thum.io/get'

  const params = new URLSearchParams({
    url,
    ...(width ? { width: String(width) } : {}),
    ...(height ? { height: String(height) } : {}),
    ...(sleep ? { delay: String(sleep * 1000) } : {}),
  })

  try {
    const response = await fetch(`${captureBase}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Screenshot request failed with ${String(response.status)}`)
    }
    return await response.arrayBuffer()
  } catch (error) {
    console.error('Error getting screenshot:', error)
    throw error
  }
}
