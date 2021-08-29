class Image2CSSConverter{
    constructor(){
        this.cssString = '';
        this.loader = document.getElementById('loader');
        this.cssImageBody = document.getElementById('cssImageBody');
        const htmlCopySnippet = document.getElementById('copyHtmlSnippet');
        htmlCopySnippet.addEventListener('click', () => {
            navigator.clipboard.writeText(`<div id="cssImg">${document.getElementById('cssImageBody').innerHTML}<div/>`);
            htmlCopySnippet.classList.add('snippetCopied');
            cssCopySnippet.classList.remove('snippetCopied');
        });

        const cssCopySnippet = document.getElementById('copyCSSSnippet');
        cssCopySnippet.addEventListener('click', () => {
            navigator.clipboard.writeText(this.cssString);    
            cssCopySnippet.classList.add('snippetCopied');
            htmlCopySnippet.classList.remove('snippetCopied');
        });
    }

    async render(selectedFile){
        this.cssString = '.pixelRow { height: 1px !important; display: flex; justify-content: space-between;} .pixel { width: 1px !important; height: 1px !important;}';
        this.loader.classList.add('show');
        await this.initImgCanvasCtx(selectedFile);
    }

    componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
      }

      rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
      }

    async renderPixelsAsCSSImg(pixelRows, canvasWidth, canvasHeight){
        const self = this;
        return new Promise((resolve) => {
            self.cssImageBody.innerHTML = '';
            self.cssImageBody.style.width = `${canvasWidth}px`;
            self.cssImageBody.style.height = `${canvasHeight}px`;

            const div = document.createElement('div');

            for(const row of pixelRows){
                const pixelRowDiv = document.createElement('div');
                pixelRowDiv.classList.add('pixelRow');
                for (const pixel of row.pixels){
                    const pixelDiv = document.createElement('div');
                    const pixelId = `pixel-${pixel.row}-${pixel.col}`;
                    pixelDiv.id = pixelId;
                    pixelDiv.style.backgroundColor = self.rgbToHex(pixel.r,pixel.g,pixel.b);
                    pixelDiv.style.opacity = (pixel.a / 2.56) / 100;
                    self.cssString += `#${pixelId} {background-color: ${self.rgbToHex(pixel.r,pixel.g,pixel.b)};}`;
                    self.cssString += `#${pixelId} {opacity: ${(pixel.a / 2.56) / 100};}`;
                    pixelDiv.classList.add('pixel');
                    pixelRowDiv.append(pixelDiv);
                }
                div.append(pixelRowDiv);
            }
            self.cssImageBody.append(div);
            self.loader.classList.remove('show');
            resolve();
        });
    }

    async getPixelsFromImgCanvasCtx(canvasCtx, canvasWidth, canvasHeight){
        return new Promise((resolve) => {
            const pixelRows = [];
            for (let row = 0, rowLen = canvasHeight; row < rowLen; ++row){
                const pixelRow = new Row();
                for (let col = 0, colLen = canvasWidth; col < colLen; ++col){
                    const pixel = canvasCtx.getImageData(col,row,1,1).data;
                    pixelRow.addPixel(new Pixel(col, row, pixel[0], pixel[1], pixel[2], pixel[3]));
                }
                pixelRows.push(pixelRow);
            }
            resolve(pixelRows);
        });
    }

    async initImgCanvasCtx(selectedFile){
        const self = this;
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const canvasCtx = canvas.getContext("2d");
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () =>{
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvasCtx.drawImage(img,0,0);
                    self.cssString += `#cssImg {width: ${canvas.width}px;}`;
                    const pixelRows = await self.getPixelsFromImgCanvasCtx(canvasCtx, canvas.width, canvas.height);
                    await self.renderPixelsAsCSSImg(pixelRows, canvas.width, canvas.height);
                    resolve();
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(selectedFile);
          });

    }
}

class Row{
    constructor(){
        this.pixels = [];
    }

    addPixel(pixel){
        this.pixels.push(pixel);
    };
}

class Pixel{
    constructor(col, row, r,g,b,a){
        this.row = row;
        this.col = col;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Initialize{
    constructor(){
        this.converter = null;
        const imageInput = document.getElementById('imageInput');
        imageInput.addEventListener('change', async () => {
            const selectedFile = imageInput.files[0];
            if(selectedFile){
                if(selectedFile.width > 720 || selectedFile.height > 1280){
                    alert('File is too large. 1280 x 720 max size breached');
                    return;
                }
                if(selectedFile.size > 20000){
                    alert('File is too large. 200kb max size limit breached');
                    return;
                }
                await this.initImage2CSSConverter(selectedFile);
            }
        });
    }
    
    async initImage2CSSConverter(selectedFile) {
        if(this.converter === null){
            this.converter = new Image2CSSConverter();
        }
        await this.converter.render(selectedFile);
    };
}


window.onload = () => {
    new Initialize();
}