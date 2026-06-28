// =============================================
// Utilitário MD5
// Implementação didática em JavaScript puro para gerar o CRC/hash da camada de enlace.
// =============================================

function leftRotate(value, shift) {
    return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function toHexLittleEndian(value) {
    let output = '';
    for (let i = 0; i < 4; i += 1) {
        output += ((value >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return output;
}

const SHIFT_AMOUNTS = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

const TABLE_CONSTANTS = Array.from({ length: 64 }, (_, index) => (
    Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32) >>> 0
));

/**
 * Calcula o MD5 de uma string e retorna o hash hexadecimal.
 * @param {string} input
 * @returns {string}
 */
export function md5(input) {
    const bytes = Array.from(new TextEncoder().encode(input));
    const originalBitLength = bytes.length * 8;

    bytes.push(0x80);
    while (bytes.length % 64 !== 56) {
        bytes.push(0);
    }

    for (let i = 0; i < 8; i += 1) {
        bytes.push(Math.floor(originalBitLength / (2 ** (8 * i))) & 0xff);
    }

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
        const words = [];
        for (let i = 0; i < 16; i += 1) {
            const offset = chunkStart + i * 4;
            words[i] = (
                bytes[offset] |
                (bytes[offset + 1] << 8) |
                (bytes[offset + 2] << 16) |
                (bytes[offset + 3] << 24)
            ) >>> 0;
        }

        let a = a0;
        let b = b0;
        let c = c0;
        let d = d0;

        for (let i = 0; i < 64; i += 1) {
            let f;
            let g;

            if (i < 16) {
                f = (b & c) | ((~b) & d);
                g = i;
            } else if (i < 32) {
                f = (d & b) | ((~d) & c);
                g = (5 * i + 1) % 16;
            } else if (i < 48) {
                f = b ^ c ^ d;
                g = (3 * i + 5) % 16;
            } else {
                f = c ^ (b | (~d));
                g = (7 * i) % 16;
            }

            const temp = d;
            d = c;
            c = b;
            b = (b + leftRotate((a + f + TABLE_CONSTANTS[i] + words[g]) >>> 0, SHIFT_AMOUNTS[i])) >>> 0;
            a = temp;
        }

        a0 = (a0 + a) >>> 0;
        b0 = (b0 + b) >>> 0;
        c0 = (c0 + c) >>> 0;
        d0 = (d0 + d) >>> 0;
    }

    return `${toHexLittleEndian(a0)}${toHexLittleEndian(b0)}${toHexLittleEndian(c0)}${toHexLittleEndian(d0)}`;
}
