/**
 * gif.js - Lightweight GIF encoder for browser
 * Encodes frames from canvas into animated GIF format.
 * Based on NeuQuant quantization and LZW compression.
 */
(function(global) {
  'use strict';

  class GIFEncoder {
    constructor(width, height) {
      this.width = ~~width;
      this.height = ~~height;
      this.transparent = null;
      this.transIndex = 0;
      this.repeat = 0;
      this.delay = 0;
      this.image = null;
      this.pixels = null;
      this.indexedPixels = null;
      this.colorDepth = null;
      this.colorTab = null;
      this.usedEntry = [];
      this.palSize = 7;
      this.dispose = -1;
      this.firstFrame = true;
      this.sample = 10;
      this.started = false;
      this.out = new ByteArray();
    }

    setDelay(ms) {
      this.delay = Math.round(ms / 10);
    }

    setRepeat(repeat) {
      this.repeat = repeat;
    }

    setTransparent(color) {
      this.transparent = color;
    }

    setQuality(quality) {
      this.sample = quality < 1 ? 1 : quality;
    }

    setDispose(code) {
      if (code >= 0) this.dispose = code;
    }

    start() {
      this.out = new ByteArray();
      this.out.writeUTFBytes('GIF89a');
      this.started = true;
    }

    addFrame(imageData) {
      if (!this.started) return;

      this.image = imageData;
      this.getImagePixels();
      this.analyzePixels();

      if (this.firstFrame) {
        this.writeLSD();
        this.writePalette();
        if (this.repeat >= 0) {
          this.writeNetscapeExt();
        }
      }

      this.writeGraphicCtrlExt();
      this.writeImageDesc();
      if (!this.firstFrame) this.writePalette();
      this.writePixels();
      this.firstFrame = false;
    }

    finish() {
      if (!this.started) return;
      this.started = false;
      this.out.writeByte(0x3b);
    }

    getBlob() {
      return new Blob([this.out.getData()], { type: 'image/gif' });
    }

    getImagePixels() {
      const w = this.width;
      const h = this.height;
      const data = this.image;
      this.pixels = new Uint8Array(w * h * 3);
      let count = 0;
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          const b = (i * w * 4) + j * 4;
          this.pixels[count++] = data[b];
          this.pixels[count++] = data[b + 1];
          this.pixels[count++] = data[b + 2];
        }
      }
    }

    analyzePixels() {
      const len = this.pixels.length;
      const nPix = len / 3;
      this.indexedPixels = new Uint8Array(nPix);

      const nq = new NeuQuant(this.pixels, this.sample);
      this.colorTab = nq.process();

      let k = 0;
      for (let j = 0; j < nPix; j++) {
        const index = nq.map(
          this.pixels[k++] & 0xff,
          this.pixels[k++] & 0xff,
          this.pixels[k++] & 0xff
        );
        this.usedEntry[index] = true;
        this.indexedPixels[j] = index;
      }

      this.pixels = null;
      this.colorDepth = 8;
      this.palSize = 7;

      if (this.transparent !== null) {
        this.transIndex = this.findClosest(this.transparent);
      }
    }

    findClosest(c) {
      const r = (c & 0xFF0000) >> 16;
      const g = (c & 0x00FF00) >> 8;
      const b = (c & 0x0000FF);
      let minpos = 0;
      let dmin = 256 * 256 * 256;
      const len = this.colorTab.length;

      for (let i = 0; i < len;) {
        const dr = r - (this.colorTab[i++] & 0xff);
        const dg = g - (this.colorTab[i++] & 0xff);
        const db = b - (this.colorTab[i++] & 0xff);
        const d = dr * dr + dg * dg + db * db;
        const index = i / 3;
        if (this.usedEntry[index] && (d < dmin)) {
          dmin = d;
          minpos = index;
        }
      }
      return minpos;
    }

    writeLSD() {
      this.writeShort(this.width);
      this.writeShort(this.height);
      this.out.writeByte(0x80 | 0x70 | 0x00 | this.palSize);
      this.out.writeByte(0);
      this.out.writeByte(0);
    }

    writePalette() {
      this.out.writeBytes(this.colorTab);
      const n = (3 * 256) - this.colorTab.length;
      for (let i = 0; i < n; i++) {
        this.out.writeByte(0);
      }
    }

    writeNetscapeExt() {
      this.out.writeByte(0x21);
      this.out.writeByte(0xff);
      this.out.writeByte(11);
      this.out.writeUTFBytes('NETSCAPE2.0');
      this.out.writeByte(3);
      this.out.writeByte(1);
      this.writeShort(this.repeat);
      this.out.writeByte(0);
    }

    writeGraphicCtrlExt() {
      this.out.writeByte(0x21);
      this.out.writeByte(0xf9);
      this.out.writeByte(4);

      let transp, disp;
      if (this.transparent === null) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }

      if (this.dispose >= 0) {
        disp = this.dispose & 7;
      }

      disp <<= 2;
      this.out.writeByte(0 | disp | 0 | transp);
      this.writeShort(this.delay);
      this.out.writeByte(this.transIndex);
      this.out.writeByte(0);
    }

    writeImageDesc() {
      this.out.writeByte(0x2c);
      this.writeShort(0);
      this.writeShort(0);
      this.writeShort(this.width);
      this.writeShort(this.height);

      if (this.firstFrame) {
        this.out.writeByte(0);
      } else {
        this.out.writeByte(0x80 | this.palSize);
      }
    }

    writePixels() {
      const enc = new LZWEncoder(this.width, this.height, this.indexedPixels, this.colorDepth);
      enc.encode(this.out);
    }

    writeShort(val) {
      this.out.writeByte(val & 0xff);
      this.out.writeByte((val >> 8) & 0xff);
    }
  }

  class ByteArray {
    constructor() {
      this.data = [];
    }
    writeByte(val) {
      this.data.push(val);
    }
    writeBytes(array) {
      for (let i = 0; i < array.length; i++) {
        this.data.push(array[i]);
      }
    }
    writeUTFBytes(string) {
      for (let i = 0; i < string.length; i++) {
        this.data.push(string.charCodeAt(i));
      }
    }
    getData() {
      return new Uint8Array(this.data);
    }
  }

  // NeuQuant Neural-Net Quantization Algorithm
  class NeuQuant {
    constructor(pixels, samplefac) {
      this.netsize = 256;
      this.prime1 = 499;
      this.prime2 = 491;
      this.prime3 = 487;
      this.prime4 = 503;
      this.minpicturebytes = (3 * this.prime4);
      this.maxnetpos = this.netsize - 1;
      this.netbiasshift = 4;
      this.ncycles = 100;
      this.intbiasshift = 16;
      this.intbias = (1 << this.intbiasshift);
      this.gammashift = 10;
      this.betashift = 10;
      this.beta = (this.intbias >> this.betashift);
      this.betagamma = (this.intbias << (this.gammashift - this.betashift));
      this.initrad = (this.netsize >> 3);
      this.radiusbiasshift = 6;
      this.radiusbias = (1 << this.radiusbiasshift);
      this.initradius = (this.initrad * this.radiusbias);
      this.radiusdec = 30;
      this.alphabiasshift = 10;
      this.initalpha = (1 << this.alphabiasshift);
      this.alphadec = 30;
      this.radbiasshift = 8;
      this.radbias = (1 << this.radbiasshift);
      this.alpharadbshift = (this.alphabiasshift + this.radbiasshift);
      this.alpharadbias = (1 << this.alpharadbshift);

      this.thepicture = pixels;
      this.lengthcount = pixels.length;
      this.samplefac = samplefac;

      this.network = [];
      this.netindex = new Int32Array(256);
      this.bias = new Int32Array(this.netsize);
      this.freq = new Int32Array(this.netsize);
      this.radpower = new Int32Array(this.netsize >> 3);

      for (let i = 0; i < this.netsize; i++) {
        const v = (i << (this.netbiasshift + 8)) / this.netsize;
        this.network[i] = new Float64Array([v, v, v, 0]);
        this.freq[i] = Math.floor(this.intbias / this.netsize);
        this.bias[i] = 0;
      }
    }

    process() {
      this.learn();
      this.unbiasnet();
      this.inxbuild();
      return this.colorMap();
    }

    colorMap() {
      const map = [];
      const index = new Array(this.netsize);
      for (let i = 0; i < this.netsize; i++) {
        index[this.network[i][3]] = i;
      }
      for (let i = 0; i < this.netsize; i++) {
        const j = index[i];
        map.push(this.network[j][0] & 0xff);
        map.push(this.network[j][1] & 0xff);
        map.push(this.network[j][2] & 0xff);
      }
      return map;
    }

    inxbuild() {
      let previouscol = 0;
      let startpos = 0;

      for (let i = 0; i < this.netsize; i++) {
        let smallpos = i;
        let smallval = this.network[i][1];
        for (let j = i + 1; j < this.netsize; j++) {
          if (this.network[j][1] < smallval) {
            smallpos = j;
            smallval = this.network[j][1];
          }
        }
        if (i !== smallpos) {
          const temp = this.network[i];
          this.network[i] = this.network[smallpos];
          this.network[smallpos] = temp;
        }
        if (smallval !== previouscol) {
          this.netindex[previouscol] = (startpos + i) >> 1;
          for (let j = previouscol + 1; j < smallval; j++) {
            this.netindex[j] = i;
          }
          previouscol = smallval;
          startpos = i;
        }
        this.network[i][3] = i;
      }
      this.netindex[previouscol] = (startpos + this.maxnetpos) >> 1;
      for (let j = previouscol + 1; j < 256; j++) {
        this.netindex[j] = this.maxnetpos;
      }
    }

    learn() {
      const lengthcount = this.lengthcount;
      const alphadec = this.alphadec;
      const samplefac = this.samplefac;
      const samplepixels = Math.floor(lengthcount / (3 * samplefac));
      let delta = Math.floor(samplepixels / this.ncycles);
      let alpha = this.initalpha;
      let radius = this.initradius;
      let rad = radius >> this.radiusbiasshift;

      if (rad <= 1) rad = 0;
      for (let i = 0; i < rad; i++) {
        this.radpower[i] = Math.floor(
          alpha * (((rad * rad - i * i) * this.radbias) / (rad * rad))
        );
      }

      let step;
      if (lengthcount < this.minpicturebytes) {
        samplefac === 1 && (delta = 1);
        step = 3;
      } else if ((lengthcount % this.prime1) !== 0) {
        step = 3 * this.prime1;
      } else if ((lengthcount % this.prime2) !== 0) {
        step = 3 * this.prime2;
      } else if ((lengthcount % this.prime3) !== 0) {
        step = 3 * this.prime3;
      } else {
        step = 3 * this.prime4;
      }

      let pix = 0;
      for (let i = 0; i < samplepixels;) {
        const b = (this.thepicture[pix] & 0xff) << this.netbiasshift;
        const g = (this.thepicture[pix + 1] & 0xff) << this.netbiasshift;
        const r = (this.thepicture[pix + 2] & 0xff) << this.netbiasshift;

        const j = this.contest(b, g, r);
        this.altersingle(alpha, j, b, g, r);
        if (rad !== 0) this.alterneigh(rad, j, b, g, r);

        pix += step;
        if (pix >= lengthcount) pix -= lengthcount;
        i++;

        if (delta === 0) delta = 1;
        if (i % delta === 0) {
          alpha -= Math.floor(alpha / alphadec);
          radius -= Math.floor(radius / this.radiusdec);
          rad = radius >> this.radiusbiasshift;
          if (rad <= 1) rad = 0;
          for (let k = 0; k < rad; k++) {
            this.radpower[k] = Math.floor(
              alpha * (((rad * rad - k * k) * this.radbias) / (rad * rad))
            );
          }
        }
      }
    }

    map(b, g, r) {
      let bestd = 1000;
      let best = -1;
      let i = this.netindex[g];
      let j = i - 1;

      while ((i < this.netsize) || (j >= 0)) {
        if (i < this.netsize) {
          const n = this.network[i];
          let dist = n[1] - g;
          if (dist >= bestd) {
            i = this.netsize;
          } else {
            i++;
            if (dist < 0) dist = -dist;
            let a = n[0] - b;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              a = n[2] - r;
              if (a < 0) a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = n[3];
              }
            }
          }
        }
        if (j >= 0) {
          const n = this.network[j];
          let dist = g - n[1];
          if (dist >= bestd) {
            j = -1;
          } else {
            j--;
            if (dist < 0) dist = -dist;
            let a = n[0] - b;
            if (a < 0) a = -a;
            dist += a;
            if (dist < bestd) {
              a = n[2] - r;
              if (a < 0) a = -a;
              dist += a;
              if (dist < bestd) {
                bestd = dist;
                best = n[3];
              }
            }
          }
        }
      }
      return best;
    }

    unbiasnet() {
      for (let i = 0; i < this.netsize; i++) {
        this.network[i][0] >>= this.netbiasshift;
        this.network[i][1] >>= this.netbiasshift;
        this.network[i][2] >>= this.netbiasshift;
        this.network[i][3] = i;
      }
    }

    altersingle(alpha, i, b, g, r) {
      const n = this.network[i];
      n[0] -= (alpha * (n[0] - b)) / this.initalpha;
      n[1] -= (alpha * (n[1] - g)) / this.initalpha;
      n[2] -= (alpha * (n[2] - r)) / this.initalpha;
    }

    alterneigh(rad, i, b, g, r) {
      let lo = i - rad;
      if (lo < -1) lo = -1;
      let hi = i + rad;
      if (hi > this.netsize) hi = this.netsize;

      let j = i + 1;
      let k = i - 1;
      let m = 1;

      while ((j < hi) || (k > lo)) {
        const a = this.radpower[m++];
        if (j < hi) {
          const n = this.network[j++];
          n[0] -= (a * (n[0] - b)) / this.alpharadbias;
          n[1] -= (a * (n[1] - g)) / this.alpharadbias;
          n[2] -= (a * (n[2] - r)) / this.alpharadbias;
        }
        if (k > lo) {
          const n = this.network[k--];
          n[0] -= (a * (n[0] - b)) / this.alpharadbias;
          n[1] -= (a * (n[1] - g)) / this.alpharadbias;
          n[2] -= (a * (n[2] - r)) / this.alpharadbias;
        }
      }
    }

    contest(b, g, r) {
      let bestd = ~(1 << 31);
      let bestbiasd = bestd;
      let bestpos = -1;
      let bestbiaspos = bestpos;

      for (let i = 0; i < this.netsize; i++) {
        const n = this.network[i];
        let dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
        if (dist < bestd) {
          bestd = dist;
          bestpos = i;
        }
        let biasdist = dist - ((this.bias[i]) >> (this.intbiasshift - this.netbiasshift));
        if (biasdist < bestbiasd) {
          bestbiasd = biasdist;
          bestbiaspos = i;
        }
        const betafreq = (this.freq[i] >> this.betashift);
        this.freq[i] -= betafreq;
        this.bias[i] += (betafreq << this.gammashift);
      }
      this.freq[bestpos] += this.beta;
      this.bias[bestpos] -= this.betagamma;
      return bestbiaspos;
    }
  }

  // LZW Encoder
  class LZWEncoder {
    constructor(width, height, pixels, colorDepth) {
      this.width = width;
      this.height = height;
      this.pixels = pixels;
      this.initCodeSize = Math.max(2, colorDepth);
      this.curPixel = 0;
      this.remaining = 0;
    }

    encode(outs) {
      outs.writeByte(this.initCodeSize);

      this.remaining = this.width * this.height;
      this.curPixel = 0;

      this.compress(this.initCodeSize + 1, outs);
      outs.writeByte(0);
    }

    compress(initBits, outs) {
      const BITS = 12;
      const HSIZE = 5003;
      const masks = [
        0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F,
        0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF
      ];

      let fcode, c, i, ent, disp, hsize_reg, hshift;
      let cur_accum = 0, cur_bits = 0;
      const accum = new Uint8Array(256);
      let a_count = 0;

      const g_init_bits = initBits;
      let n_bits = g_init_bits;
      let maxcode = (1 << n_bits) - 1;
      const ClearCode = 1 << (initBits - 1);
      const EOFCode = ClearCode + 1;
      let free_ent = ClearCode + 2;

      const htab = new Int32Array(HSIZE);
      const codetab = new Int32Array(HSIZE);
      htab.fill(-1);

      hsize_reg = HSIZE;
      hshift = 0;
      for (fcode = HSIZE; fcode < 65536; fcode *= 2) ++hshift;
      hshift = 8 - hshift;

      // output clear code
      cur_accum |= (ClearCode << cur_bits);
      cur_bits += n_bits;
      while (cur_bits >= 8) {
        accum[a_count++] = cur_accum & 0xff;
        cur_accum >>= 8;
        cur_bits -= 8;
        if (a_count >= 254) {
          outs.writeByte(a_count);
          outs.writeBytes(Array.from(accum.slice(0, a_count)));
          a_count = 0;
        }
      }

      ent = this.nextPixel();

      let outer = true;
      while (outer && this.remaining > 0) {
        c = this.nextPixel();
        fcode = (c << BITS) + ent;
        i = (c << hshift) ^ ent;

        if (htab[i] === fcode) {
          ent = codetab[i];
          continue;
        } else if (htab[i] >= 0) {
          disp = hsize_reg - i;
          if (i === 0) disp = 1;
          do {
            if ((i -= disp) < 0) i += hsize_reg;
            if (htab[i] === fcode) {
              ent = codetab[i];
              break;
            }
          } while (htab[i] >= 0);
          if (htab[i] === fcode) continue;
        }

        // output ent
        cur_accum |= (ent << cur_bits);
        cur_bits += n_bits;
        while (cur_bits >= 8) {
          accum[a_count++] = cur_accum & 0xff;
          cur_accum >>= 8;
          cur_bits -= 8;
          if (a_count >= 254) {
            outs.writeByte(a_count);
            outs.writeBytes(Array.from(accum.slice(0, a_count)));
            a_count = 0;
          }
        }

        if (free_ent < (1 << BITS)) {
          htab[i] = fcode;
          codetab[i] = free_ent++;
          if (free_ent > maxcode + 1) {
            n_bits++;
            if (n_bits === BITS) {
              maxcode = (1 << BITS) - 1;
            } else {
              maxcode = (1 << n_bits) - 1;
            }
          }
        } else {
          htab.fill(-1);
          free_ent = ClearCode + 2;
          // output clear code
          cur_accum |= (ClearCode << cur_bits);
          cur_bits += n_bits;
          while (cur_bits >= 8) {
            accum[a_count++] = cur_accum & 0xff;
            cur_accum >>= 8;
            cur_bits -= 8;
            if (a_count >= 254) {
              outs.writeByte(a_count);
              outs.writeBytes(Array.from(accum.slice(0, a_count)));
              a_count = 0;
            }
          }
          n_bits = g_init_bits;
          maxcode = (1 << n_bits) - 1;
        }

        ent = c;
      }

      // output ent
      cur_accum |= (ent << cur_bits);
      cur_bits += n_bits;
      while (cur_bits >= 8) {
        accum[a_count++] = cur_accum & 0xff;
        cur_accum >>= 8;
        cur_bits -= 8;
        if (a_count >= 254) {
          outs.writeByte(a_count);
          outs.writeBytes(Array.from(accum.slice(0, a_count)));
          a_count = 0;
        }
      }

      // output EOF code
      cur_accum |= (EOFCode << cur_bits);
      cur_bits += n_bits;
      while (cur_bits >= 8) {
        accum[a_count++] = cur_accum & 0xff;
        cur_accum >>= 8;
        cur_bits -= 8;
        if (a_count >= 254) {
          outs.writeByte(a_count);
          outs.writeBytes(Array.from(accum.slice(0, a_count)));
          a_count = 0;
        }
      }

      if (cur_bits > 0) {
        accum[a_count++] = cur_accum & 0xff;
      }

      if (a_count > 0) {
        outs.writeByte(a_count);
        outs.writeBytes(Array.from(accum.slice(0, a_count)));
      }
    }

    nextPixel() {
      if (this.remaining === 0) return -1;
      --this.remaining;
      return this.pixels[this.curPixel++] & 0xff;
    }
  }

  global.GIFEncoder = GIFEncoder;

})(typeof window !== 'undefined' ? window : this);
