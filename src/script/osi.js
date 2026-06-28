// =============================================
// Orquestrador OSI
<<<<<<< HEAD
// Coordena a renderização sequencial das camadas 7 → 6 → 5 → 2 → 1
=======
// Coordena a renderização sequencial das camadas 7 → 6 → 5
>>>>>>> a9680b699e4f7c5f9c31a9ca8e85e6490e5b0b7c
// =============================================

import { renderAplicacao } from './aplicacao.js';
import { renderApresentacao } from './apresentacao.js';
import { renderSessao } from './sessao.js';
<<<<<<< HEAD
import { renderEnlace } from './enlace.js';
import { renderFisica } from './fisica.js';

/**
 * Cria a seta visual entre camadas.
 * @param {number} delaySeconds Atraso da animação em segundos.
 * @returns {string}
 */
function createArrow(delaySeconds) {
    return `
        <div class="osi-arrow" style="animation-delay: ${delaySeconds}s;">
            <div class="osi-arrow-line"></div>
            <div class="osi-arrow-head"></div>
            <span class="osi-arrow-label">↓</span>
        </div>
    `;
}

/**
 * Renderiza as camadas OSI no container.
 * O projeto já simulava as camadas 7, 6 e 5. A atividade final adiciona
 * a camada de enlace e a camada física ao encerramento da transmissão.
 * @param {Object} emailData Dados do formulário SMTP.
=======

/**
 * Renderiza as 3 camadas OSI no container, com setas de conexão.
 * A animação sequencial é controlada via CSS animation-delay.
 * @param {Object} emailData - Dados do formulário SMTP.
>>>>>>> a9680b699e4f7c5f9c31a9ca8e85e6490e5b0b7c
 */
export function renderOSILayers(emailData) {
    const container = document.getElementById('osi-layers-container');
    if (!container) return;

    // Camada 7 — Aplicação
    const aplicacaoHTML = renderAplicacao(emailData);

    // Camada 6 — Apresentação (retorna HTML + token JWT)
    const { html: apresentacaoHTML, token: jwtToken } = renderApresentacao(emailData);

    // Camada 5 — Sessão (recebe o token JWT)
    const sessaoHTML = renderSessao(jwtToken);

<<<<<<< HEAD
    // Camada 2 — Enlace (cria frame + MAC origem/destino + CRC MD5)
    const dadosParaEnlace = {
        camadaAnterior: 'Sessão',
        protocolo: emailData.protocolo,
        remetente: emailData.remetente,
        destinatario: emailData.destinatario,
        tokenSessao: jwtToken,
        timestamp: new Date().toISOString()
    };
    const { html: enlaceHTML, frame } = renderEnlace(dadosParaEnlace);

    // Camada 1 — Física (confere CRC e converte o frame em binário)
    const fisicaHTML = renderFisica(frame);

    container.innerHTML = `
        ${aplicacaoHTML}
        ${createArrow(0.45)}
        ${apresentacaoHTML}
        ${createArrow(1.05)}
        ${sessaoHTML}
        ${createArrow(1.65)}
        ${enlaceHTML}
        ${createArrow(2.25)}
        ${fisicaHTML}
        <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
    `;

    container.classList.add('active');

=======
    // Seta visual entre camadas
    const arrowHTML = `
        <div class="osi-arrow">
            <div class="osi-arrow-line"></div>
            <div class="osi-arrow-head"></div>
            <span class="osi-arrow-label">↓</span>
        </div>
    `;

    // Montar tudo no container
    container.innerHTML = `
        ${aplicacaoHTML}
        ${arrowHTML}
        ${apresentacaoHTML}
        ${arrowHTML}
        ${sessaoHTML}
        <button class="osi-reset-btn" id="osi-reset-btn">Nova Requisição</button>
    `;

    // Ativar container (torna visível)
    container.classList.add('active');

    // Botão de reset
>>>>>>> a9680b699e4f7c5f9c31a9ca8e85e6490e5b0b7c
    document.getElementById('osi-reset-btn').addEventListener('click', () => {
        container.classList.remove('active');
        container.innerHTML = '';
    });
<<<<<<< HEAD
}
=======
}
>>>>>>> a9680b699e4f7c5f9c31a9ca8e85e6490e5b0b7c
