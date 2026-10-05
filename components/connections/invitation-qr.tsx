"use client";

/** A small QR Model 2 encoder: byte mode, version 5, error correction L.
 * Capacity is 106 UTF-8 bytes. No account data leaves the browser. */
export function invitationMatrix(value: string): boolean[][] | null {
  const bytes = Array.from(new TextEncoder().encode(value));
  if (bytes.length > 106) return null;
  const bits: number[] = [];
  const append = (value: number, count: number) => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  append(4, 4);
  append(bytes.length, 8);
  bytes.forEach((byte) => append(byte, 8));
  append(0, Math.min(4, 864 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  for (let pad = 0; data.length < 108; pad++) data.push(pad % 2 === 0 ? 0xec : 0x11);

  const multiply = (x: number, y: number) => {
    let result = 0;
    for (let i = 7; i >= 0; i--) {
      result = (result << 1) ^ ((result >>> 7) * 0x11d);
      result ^= ((y >>> i) & 1) * x;
    }
    return result;
  };
  const generator = Array<number>(26).fill(0);
  generator[25] = 1;
  let root = 1;
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      generator[j] = multiply(generator[j], root);
      if (j + 1 < 26) generator[j] ^= generator[j + 1];
    }
    root = multiply(root, 2);
  }
  const remainder = Array<number>(26).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    for (let i = 0; i < 26; i++) remainder[i] ^= multiply(generator[i], factor);
  });
  const codewords = [...data, ...remainder];
  const size = 37;
  const modules = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    if (x >= 0 && y >= 0 && x < size && y < size) { modules[y][x] = dark; fixed[y][x] = true; }
  };
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      set(cx + dx, cy + dy, distance !== 2 && distance !== 4);
    }
  }
  for (let i = 8; i < size - 8; i++) { set(i, 6, i % 2 === 0); set(6, i, i % 2 === 0); }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(30 + dx, 30 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  const formatData = 8; // L, mask 0
  let formatRemainder = formatData;
  for (let i = 0; i < 10; i++) formatRemainder = (formatRemainder << 1) ^ (((formatRemainder >>> 9) & 1) * 0x537);
  const format = ((formatData << 10) | formatRemainder) ^ 0x5412;
  const bit = (i: number) => ((format >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i++) set(8, i, bit(i));
  set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
  set(8, size - 8, true);
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      const y = ((right + 1) & 2) === 0 ? size - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset++) {
        const x = right - offset;
        if (!fixed[y][x]) {
          const dark = index < codewords.length * 8 && ((codewords[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0;
          modules[y][x] = dark !== ((x + y) % 2 === 0);
          index++;
        }
      }
    }
  }
  return modules;
}

export function InvitationQR({ value }: { value: string }) {
  const matrix = invitationMatrix(value);
  if (!matrix) return <p className="small muted">このリンクはQRに収まらないため、下のボタンからコピーしてください。</p>;
  return <svg className="invitation-qr" viewBox="0 0 45 45" role="img" aria-label="つながり招待リンクのQRコード" shapeRendering="crispEdges"><rect width="45" height="45" fill="white"/><path fill="#1f2937" d={matrix.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`M${x + 4},${y + 4}h1v1h-1z`] : [])).join("")}/></svg>;
}
