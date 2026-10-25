// Deterministic synthetic originals, large enough for visual and PDF proof.
// No real customer, provider or brand data.
import { deflateSync } from 'node:zlib'
const crc = bytes => { let c=0xffffffff; for (const b of bytes) { c ^= b; for(let i=0;i<8;i++) c=(c>>>1)^((c&1)?0xedb88320:0) } return (c^0xffffffff)>>>0 }
function png(width,height,pixel) {
  const raw=Buffer.alloc((width*4+1)*height)
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) for(let c=0;c<4;c++) raw[y*(width*4+1)+1+x*4+c]=pixel(x,y)[c]
  const chunk=(kind,data)=>{const name=Buffer.from(kind),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([size,name,data,sum])}
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]).toString('base64')
}
export const documentLogo = png(64,64,(x,y)=> x>14&&x<50&&y>14&&y<50 ? [18,31,57,255] : [255,104,31,255])
export const documentPhoto = png(320,200,(x,y)=> {
  if ((x>120&&x<130&&y>20&&y<55)||(x>185&&x<195&&y>20&&y<55)) return [188,104,62,255]
  if (x>110&&x<205&&y>50&&y<180) {
    if ((x-158)**2+(y-130)**2<100) return [255,104,31,255]
    if(x<114||x>201||y<54||y>176) return [44,59,82,255]
    return [220,226,235,255]
  }
  return y>180 ? [201,210,222,255] : [239,244,250,255]
})
export const documentSignature = png(320,90,(x,y)=> Math.abs(y-(45+16*Math.sin(x/17)+8*Math.sin(x/6)))<2&&x>15&&x<305 ? [18,31,57,255] : [255,255,255,255])

// Synthetic technician portrait for customer-recognition journeys.
export const technicianPhoto = png(176,224,(x,y)=> {
  let c=[232,239,245,255]
  if (((x-88)/78)**2+((y-232)/72)**2<1) c=[31,56,79,255]
  if (x>74&&x<103&&y>133&&y<177) c=[174,113,77,255]
  if (((x-88)/53)**2+((y-93)/72)**2<1) c=[35,27,25,255]
  if (((x-88)/40)**2+((y-102)/53)**2<1) c=[190,132,94,255]
  if (y<75&&((x-84)/46)**2+((y-70)/28)**2<1) c=[35,27,25,255]
  if ((x-72)**2+(y-101)**2<7||(x-104)**2+(y-101)**2<7) c=[32,28,28,255]
  if (x>85&&x<90&&y>105&&y<119) c=[153,94,65,255]
  if (x>76&&x<101&&Math.abs(y-(130-0.025*(x-88)**2))<1.3) c=[116,53,48,255]
  return c
})
