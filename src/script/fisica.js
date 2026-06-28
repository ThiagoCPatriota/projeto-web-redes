// =============================================
// Camada 1 — Física
// Confere o CRC recebido e converte o frame para binário.
// =============================================

import { md5 } from './md5.js';

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function separarCRC(frame) {
    const { crc, ...frameSemCRC } = frame;
    return { crcRecebido: crc, frameSemCRC };
}

export function validarCRC(frame) {
    const { crcRecebido, frameSemCRC } = separarCRC(frame);
    const crcRecalculado = md5(JSON.stringify(frameSemCRC)).toUpperCase();

    return {
        crcRecebido,
        crcRecalculado,
        mensagemIntegra: crcRecebido === crcRecalculado
    };
}

export function converterObjetoParaBinario(objeto) {
    const jsonString = JSON.stringify(objeto, null, 2);
    return Array.from(new TextEncoder().encode(jsonString))
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join(' ');
}

/**
 * Renderiza a camada física exibindo o objeto e, abaixo, sua versão binária.
 * @param {Object} frame Frame recebido da camada de enlace.
 * @returns {string}
 */
export function renderFisica(frame) {
    const resultadoCRC = validarCRC(frame);
    const frameJson = JSON.stringify(frame, null, 2);
    const binaryData = converterObjetoParaBinario(frame);
    const statusClass = resultadoCRC.mensagemIntegra ? 'physical-status-ok' : 'physical-status-error';
    const statusText = resultadoCRC.mensagemIntegra
        ? 'Mensagem íntegra: nenhum frame foi perdido ou alterado.'
        : 'Falha de integridade: o CRC recalculado é diferente do recebido.';

    return `
        <div class="osi-layer layer-1">
            <div class="osi-layer-header">
                <div class="osi-layer-badge">1</div>
                <div class="osi-layer-title">
                    <span>Camada Física</span>
                    <span>Verificação do CRC e conversão do frame em binário</span>
                </div>
            </div>
            <div class="osi-layer-content">
                <div class="physical-status ${statusClass}">
                    ${escapeHTML(statusText)}
                </div>

                <div class="data-link-grid">
                    <span class="session-label">CRC recebido</span>
                    <span class="session-value">${escapeHTML(resultadoCRC.crcRecebido)}</span>

                    <span class="session-label">CRC recalculado</span>
                    <span class="session-value">${escapeHTML(resultadoCRC.crcRecalculado)}</span>
                </div>

                <div class="frame-box">
                    <span class="token-label">Objeto recebido da camada de enlace</span>
                    <pre>${escapeHTML(frameJson)}</pre>
                </div>

                <div class="frame-box binary-box">
                    <span class="token-label">Objeto convertido para binário</span>
                    <pre>${escapeHTML(binaryData)}</pre>
                </div>
            </div>
        </div>
    `;
}
