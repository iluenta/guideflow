export async function compressImage(
    file: File,
    maxWidth = 1920,
    quality = 0.82,
    outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<File> {
    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            let { width, height } = img
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                resolve(file)
                return
            }
            ctx.drawImage(img, 0, 0, width, height)

            URL.revokeObjectURL(url)

            const extension = outputFormat === 'image/png' ? '.png' : '.jpg'

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file)
                        return
                    }
                    resolve(
                        new File([blob], file.name.replace(/\.[^.]+$/, extension), {
                            type: outputFormat,
                            lastModified: Date.now(),
                        })
                    )
                },
                outputFormat,
                quality
            )
        }
        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
        img.src = url
    })
}

/**
 * Crea un FileList sintético a partir de un objeto File.
 * Necesario para simular eventos de input en tests o flujos de compresión.
 */
export function createFileList(file: File): FileList {
    const dt = new DataTransfer()
    dt.items.add(file)
    return dt.files
}
