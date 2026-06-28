// =============================================
// Camada 2 — Enlace
// Cria o frame, gera MACs e calcula o CRC/hash MD5 dos dados.
// =============================================

import { md5 } from './md5.js';

const MAC_ORIGEM_KEY = 'osi_local_machine_mac';
const FRAME_COUNTER_KEY = 'osi_frame_counter';

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function randomByte() {
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
        const array = new Uint8Array(1);
        globalThis.crypto.getRandomValues(array);
        return array[0];
    }

    return Math.floor(Math.random() * 256);
}

/**
 * Cria um endereço MAC fictício no formato AA:BB:CC:DD:EE:FF.
 * O primeiro byte é ajustado para ser localmente administrado e unicast.
 * @returns {string}
 */
export function criarMacFicticio() {
    const bytes = Array.from({ length: 6 }, randomByte);
    bytes[0] = (bytes[0] | 0x02) & 0xfe;

    return bytes
        .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
        .join(':');
}

/**
 * No navegador não existe permissão para ler o MAC físico real do computador.
 * Para a simulação, geramos um MAC local persistente e salvamos no localStorage.
 * @returns {string}
 */
export function obterMacOrigem() {
    const storedMac = localStorage.getItem(MAC_ORIGEM_KEY);
    if (storedMac) return storedMac;

    const newMac = criarMacFicticio();
    localStorage.setItem(MAC_ORIGEM_KEY, newMac);
    return newMac;
}

function criarFrameId() {
    const currentCounter = Number(localStorage.getItem(FRAME_COUNTER_KEY) || '0') + 1;
    localStorage.setItem(FRAME_COUNTER_KEY, String(currentCounter));
    return `F${String(currentCounter).padStart(3, '0')}`;
}

/**
 * Cria o objeto da camada de enlace e calcula o CRC com MD5.
 * @param {Object} dados Dados recebidos da camada anterior.
 * @returns {Object} Frame completo.
 */
export function criarFrameEnlace(dados) {
    const frameSemCRC = {
        frameId: criarFrameId(),
        macOrigem: obterMacOrigem(),
        macDestino: criarMacFicticio(),
        tipo: 'IPv4',
        dados
    };

    const jsonString = JSON.stringify(frameSemCRC);
    const crc = md5(jsonString).toUpperCase();

    return {
        ...frameSemCRC,
        crc
    };
}

/**
 * Renderiza a camada de enlace mostrando o objeto antes de ir para a camada física.
 * @param {Object} dados Dados recebidos da camada anterior.
 * @returns {{ html: string, frame: Object }}
 */
export function renderEnlace(dados) {
    const frame = criarFrameEnlace(dados);
    const frameJson = JSON.stringify(frame, null, 2);

    const html = `
        <div class="osi-layer layer-2">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">2</div>
                <div class="osi-layer-title">
                    <span>Camada de Enlace</span>
                    <span>Criação do frame, endereços MAC e CRC com MD5</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="data-link-grid">
                    <span class="session-label">Frame ID</span>
                    <span class="session-value">${escapeHTML(frame.frameId)}</span>

                    <span class="session-label">MAC origem</span>
                    <span class="session-value">${escapeHTML(frame.macOrigem)}</span>

                    <span class="session-label">MAC destino</span>
                    <span class="session-value">${escapeHTML(frame.macDestino)}</span>

                    <span class="session-label">Tipo</span>
                    <span class="session-value">${escapeHTML(frame.tipo)}</span>

                    <span class="session-label">CRC / MD5</span>
                    <span class="session-value">${escapeHTML(frame.crc)}</span>
                </div>

                <div class="frame-box">
                    <span class="token-label">Objeto completo antes de enviar para a camada física</span>
                    <pre>${escapeHTML(frameJson)}</pre>
                </div>
            </div>
        </div>
    `;

    return { html, frame };
}
