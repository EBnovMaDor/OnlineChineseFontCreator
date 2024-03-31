export default class SvgUtil {
    /**
     * download svg file
     * @param svgPath path In svg
     * @param viewBox svg viewBox
     * @param fileName fileName like 'bazier',so output will be bazier.svg
     * @param color default to be '#000000'
     */
    static downloadSvg(
        svgPath: string,
        viewBox: {
            x: number,
            y: number,
            width: number,
            height: number
        },
        fileName: string,
        color: string = "#000000") {
        let file_txt = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}">\n`
            + `<path d="${svgPath}Z" fill="${color}"/>\n</svg>`
        let txtFile = new Blob([file_txt], { type: ' text/plain' })
        downFile(txtFile, `${fileName}.svg`)
        function downFile(blob: Blob, fileName: string) {
            const link = document.createElement('tmp') as HTMLAnchorElement
            link.href = window.URL.createObjectURL(blob)
            link.download = fileName
            link.click()
            window.URL.revokeObjectURL(link.href)
        }
    }
}