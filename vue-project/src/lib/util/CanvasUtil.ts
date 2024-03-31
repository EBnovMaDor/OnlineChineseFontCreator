export default class CanvasUtil {

    /**
     * transform canvas data to base64url data
     * @param canvas HTMLCanvasElement
     * @returns base64url data
     */
    static canvasToBase64Url(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL("image/png");
    }

    /**
     * transform canvas data to Blob data
     * @param canvas HTMLCanvasElement
     * @returns blob data
     */
    static canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            canvas.toBlob(function (blob) {
                if (!blob) reject('error in CanvasUtil.canvasToBlob,读取blob失败')
                resolve(blob!)
            })
        })
    }

    /**
     * transform Blob data to base64url data
     * @param blob image Blob data
     * @returns base64url data
     */
    static blobToBase64Url(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader()
            reader.readAsDataURL(blob)
            reader.onload = function (e) {
                if (typeof reader.result !== 'string') reject('error in CanvasUtil.blobToBase64Url')
                resolve(reader.result as string)
            }
        })
    }

    /**
     * draw Blob data to canvas
     * @param blob Blob data
     * @param canvas HTMLCanvasElement
     * @returns void
     */
    static drawBlobToCanvas(blob: Blob, canvas: HTMLCanvasElement): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let dataUrl: string = await CanvasUtil.blobToBase64Url(blob)
            let img = new Image()
            img.src = dataUrl
            if (!canvas.getContext) {
                reject('error in CanvasUtil.drawBlobToCanvas，浏览器不支持Canvas')
            }
            let ctx = canvas.getContext('2d')
            if (!ctx) reject('error in CanvasUtil.drawBlobToCanvas，获取canvas的ctx失败')
            img.onload = function () {
                ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
                resolve()
            }
        })
    }
}   