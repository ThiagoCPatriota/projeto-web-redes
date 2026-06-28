// =============================================
// Camada 4 + Camada 3 — Simulação de pacotes na rede
// Usa a ideia do professor.zip: segmento TCP, packetId, portas e protocolo.
// A escolha da melhor rota acontece com Dijkstra sobre um grafo ponderado.
// =============================================

const ROUTERS = [
    { id: 'R1', nome: 'Cliente', ip: '10.0.0.1', x: 85, y: 95, ativo: true },
    { id: 'R2', nome: 'Gateway A', ip: '10.0.0.2', x: 135, y: 285, ativo: true },
    { id: 'R3', nome: 'Roteador B', ip: '10.0.0.3', x: 230, y: 85, ativo: true },
    { id: 'R4', nome: 'Roteador C', ip: '10.0.0.4', x: 280, y: 245, ativo: true },
    { id: 'R5', nome: 'Backbone 1', ip: '10.0.0.5', x: 430, y: 135, ativo: true },
    { id: 'R6', nome: 'Backbone 2', ip: '10.0.0.6', x: 500, y: 310, ativo: true },
    { id: 'R7', nome: 'Roteador D', ip: '10.0.0.7', x: 610, y: 105, ativo: true },
    { id: 'R8', nome: 'Roteador E', ip: '10.0.0.8', x: 700, y: 265, ativo: true },
    { id: 'R9', nome: 'Servidor A', ip: '10.0.0.9', x: 805, y: 160, ativo: true },
    { id: 'R10', nome: 'Servidor B', ip: '10.0.0.10', x: 860, y: 335, ativo: true }
];

const LINKS = [
    { from: 'R1', to: 'R2', custo: 4 },
    { from: 'R1', to: 'R3', custo: 2 },
    { from: 'R2', to: 'R4', custo: 1 },
    { from: 'R3', to: 'R4', custo: 2 },
    { from: 'R3', to: 'R5', custo: 3 },
    { from: 'R4', to: 'R5', custo: 2 },
    { from: 'R4', to: 'R6', custo: 4 },
    { from: 'R5', to: 'R6', custo: 2 },
    { from: 'R5', to: 'R7', custo: 2 },
    { from: 'R6', to: 'R8', custo: 2 },
    { from: 'R7', to: 'R8', custo: 3 },
    { from: 'R7', to: 'R9', custo: 5 },
    { from: 'R8', to: 'R9', custo: 2 },
    { from: 'R8', to: 'R10', custo: 3 },
    { from: 'R9', to: 'R10', custo: 2 }
];

const TRANSPORT_SERVICES = {
    'HTTP/HTTPS': {
        servico: 'HTTPS',
        protocoloTransporte: 'TCP',
        portaDestino: 443,
        descricao: 'HTTP seguro normalmente trafega sobre TCP na porta 443.'
    },
    'SMTP/POP3': {
        servico: 'SMTP',
        protocoloTransporte: 'TCP',
        portaDestino: 587,
        descricao: 'SMTP para envio de e-mail usa TCP, geralmente nas portas 25 ou 587.'
    },
    FTP: {
        servico: 'FTP',
        protocoloTransporte: 'TCP',
        portaDestino: 21,
        descricao: 'FTP usa TCP na porta 21 para controle da conexão.'
    },
    WEBSOCKET: {
        servico: 'WebSocket',
        protocoloTransporte: 'TCP',
        portaDestino: 80,
        descricao: 'WebSocket sem TLS usa TCP na porta 80; com TLS costuma usar 443.'
    }
};

function createId(prefix) {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return `${prefix}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;
}

function createSourcePort() {
    return Math.floor(49152 + Math.random() * (65535 - 49152));
}

function createChecksum(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

function getRouter(id) {
    return ROUTERS.find(router => router.id === id);
}

function getActiveRouters() {
    return ROUTERS.filter(router => router.ativo);
}

function createTransportSegment(protocolKey) {
    const service = TRANSPORT_SERVICES[protocolKey] || TRANSPORT_SERVICES['HTTP/HTTPS'];
    const packetId = createId('PKT');
    const sessionId = createId('SESSAO');
    const sequenceNumber = Math.floor(10000 + Math.random() * 89999);

    return {
        sessionId,
        packetId,
        servico: service.servico,
        protocoloTransporte: service.protocoloTransporte,
        portaOrigem: createSourcePort(),
        portaDestino: service.portaDestino,
        sequenceNumber,
        ackNumber: sequenceNumber + 1,
        flags: ['SYN', 'ACK', 'PSH'],
        checksum: createChecksum(`${packetId}${sessionId}${service.portaDestino}`),
        descricao: service.descricao
    };
}

function createNetworkPacket(segment, sourceId, targetId, route, totalCost) {
    const source = getRouter(sourceId);
    const target = getRouter(targetId);

    return {
        ipOrigem: source.ip,
        ipDestino: target.ip,
        rota: route,
        ttl: Math.max(route.length + 2, 6),
        custoTotal: totalCost,
        payload: segment.packetId
    };
}

function buildGraph() {
    const graph = {};
    for (const router of getActiveRouters()) {
        graph[router.id] = [];
    }

    for (const link of LINKS) {
        const from = getRouter(link.from);
        const to = getRouter(link.to);
        if (!from || !to || !from.ativo || !to.ativo) continue;
        graph[link.from].push({ id: link.to, custo: link.custo });
        graph[link.to].push({ id: link.from, custo: link.custo });
    }

    return graph;
}

function findBestRoute(sourceId, targetId) {
    const graph = buildGraph();
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));
    const visitedOrder = [];

    for (const routerId of unvisited) {
        distances[routerId] = Infinity;
        previous[routerId] = null;
    }
    distances[sourceId] = 0;

    while (unvisited.size > 0) {
        let current = null;
        for (const routerId of unvisited) {
            if (current === null || distances[routerId] < distances[current]) {
                current = routerId;
            }
        }

        if (current === null || distances[current] === Infinity) break;
        unvisited.delete(current);
        visitedOrder.push(current);

        if (current === targetId) break;

        for (const neighbor of graph[current]) {
            if (!unvisited.has(neighbor.id)) continue;
            const candidateDistance = distances[current] + neighbor.custo;
            if (candidateDistance < distances[neighbor.id]) {
                distances[neighbor.id] = candidateDistance;
                previous[neighbor.id] = current;
            }
        }
    }

    const route = [];
    let cursor = targetId;
    while (cursor) {
        route.unshift(cursor);
        cursor = previous[cursor];
    }

    if (route[0] !== sourceId) {
        return { route: [], totalCost: Infinity, visitedOrder };
    }

    return { route, totalCost: distances[targetId], visitedOrder };
}

function routeContainsEdge(route, from, to) {
    for (let i = 0; i < route.length - 1; i += 1) {
        const a = route[i];
        const b = route[i + 1];
        if ((a === from && b === to) || (a === to && b === from)) {
            return true;
        }
    }
    return false;
}

function scalePoint(router, canvas) {
    const baseWidth = 940;
    const baseHeight = 430;
    return {
        x: (router.x / baseWidth) * canvas.width,
        y: (router.y / baseHeight) * canvas.height
    };
}

function drawGraph(ctx, canvas, state) {
    const { route, packetPosition, currentHop, visitedOrder } = state;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#07111f');
    gradient.addColorStop(1, '#101827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#66e3ff';
    for (let x = 0; x < canvas.width; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 42) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.restore();

    for (const link of LINKS) {
        const from = getRouter(link.from);
        const to = getRouter(link.to);
        const a = scalePoint(from, canvas);
        const b = scalePoint(to, canvas);
        const highlighted = routeContainsEdge(route, link.from, link.to);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = highlighted ? 5 : 2;
        ctx.strokeStyle = highlighted ? '#22d3ee' : 'rgba(148, 163, 184, 0.45)';
        ctx.stroke();

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        ctx.fillStyle = highlighted ? '#facc15' : '#94a3b8';
        ctx.font = '12px Segoe UI, Arial';
        ctx.fillText(String(link.custo), midX + 6, midY - 6);
    }

    for (const router of ROUTERS) {
        const point = scalePoint(router, canvas);
        const inRoute = route.includes(router.id);
        const visited = visitedOrder.includes(router.id);

        ctx.beginPath();
        ctx.arc(point.x, point.y, inRoute ? 17 : 13, 0, Math.PI * 2);
        ctx.fillStyle = inRoute ? '#0ea5e9' : visited ? '#475569' : '#1e293b';
        ctx.fill();
        ctx.lineWidth = inRoute ? 4 : 2;
        ctx.strokeStyle = inRoute ? '#bae6fd' : '#64748b';
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 13px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(router.id, point.x, point.y - 23);
        ctx.font = '11px Segoe UI, Arial';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText(router.ip, point.x, point.y + 34);
    }

    if (packetPosition) {
        ctx.save();
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(packetPosition.x, packetPosition.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.strokeStyle = '#fff7ed';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 12px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TCP', packetPosition.x, packetPosition.y - 17);
        if (currentHop) {
            ctx.font = '12px Segoe UI, Arial';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(currentHop, packetPosition.x, packetPosition.y + 29);
        }
        ctx.restore();
    }
}

function resizeCanvas(canvas) {
    const wrapper = canvas.parentElement;
    const cssWidth = wrapper ? wrapper.clientWidth : 900;
    const cssHeight = 430;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.floor(cssWidth);
    canvas.height = cssHeight;
}

function animatePacket(canvas, route, visitedOrder, onHopChange) {
    const ctx = canvas.getContext('2d');
    const points = route.map(id => scalePoint(getRouter(id), canvas));
    const segmentDuration = 900;
    const startTime = performance.now();
    let lastHopIndex = -1;

    function frame(now) {
        const elapsed = now - startTime;
        const totalDuration = Math.max((points.length - 1) * segmentDuration, segmentDuration);
        const progress = Math.min(elapsed / totalDuration, 1);
        const exact = progress * (points.length - 1);
        const index = Math.min(Math.floor(exact), points.length - 2);
        const localProgress = exact - index;
        const a = points[index] || points[0];
        const b = points[index + 1] || points[0];
        const packetPosition = {
            x: a.x + (b.x - a.x) * localProgress,
            y: a.y + (b.y - a.y) * localProgress
        };
        const currentHop = route[index + 1] ? `${route[index]} → ${route[index + 1]}` : route[route.length - 1];

        if (index !== lastHopIndex && typeof onHopChange === 'function') {
            lastHopIndex = index;
            onHopChange(index, currentHop);
        }

        drawGraph(ctx, canvas, { route, packetPosition, currentHop, visitedOrder });

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            const finalRouter = getRouter(route[route.length - 1]);
            const finalPoint = scalePoint(finalRouter, canvas);
            drawGraph(ctx, canvas, {
                route,
                packetPosition: finalPoint,
                currentHop: `Entregue em ${finalRouter.id}`,
                visitedOrder
            });
            if (typeof onHopChange === 'function') {
                onHopChange(route.length - 1, 'Pacote entregue no destino');
            }
        }
    }

    requestAnimationFrame(frame);
}

function detectProtocolFromText(text) {
    const value = String(text || '').trim().toLowerCase();
    if (value.includes('@')) return 'SMTP/POP3';
    if (value.startsWith('ftp://') || value === 'ftp') return 'FTP';
    if (value.includes('www.') || value.startsWith('http://') || value.startsWith('https://')) return 'HTTP/HTTPS';
    if (value.length > 0) return 'WEBSOCKET';
    return 'HTTP/HTTPS';
}

function createRouterOptions(selectedId) {
    return getActiveRouters().map(router => {
        const selected = router.id === selectedId ? 'selected' : '';
        return `<option value="${router.id}" ${selected}>${router.id} — ${router.nome} (${router.ip})</option>`;
    }).join('');
}

function renderSimulation(container, data) {
    const { sourceId, targetId, protocolKey, segment, networkPacket, route, totalCost, visitedOrder } = data;
    const routeNames = route.map(id => `${id} (${getRouter(id).ip})`).join(' → ');
    const visited = visitedOrder.join(' → ');

    container.innerHTML = `
        <div class="network-summary-grid">
            <article class="network-card transport-card">
                <span class="network-card-label">Camada 4 — Transporte</span>
                <h3>Segmento ${segment.protocoloTransporte}</h3>
                <p>${segment.descricao}</p>
                <div class="network-kv"><span>Session ID</span><strong>${segment.sessionId}</strong></div>
                <div class="network-kv"><span>Packet ID</span><strong>${segment.packetId}</strong></div>
                <div class="network-kv"><span>Porta origem</span><strong>${segment.portaOrigem}</strong></div>
                <div class="network-kv"><span>Porta destino</span><strong>${segment.portaDestino}</strong></div>
                <div class="network-kv"><span>Flags</span><strong>${segment.flags.join(', ')}</strong></div>
                <div class="network-kv"><span>Checksum</span><strong>${segment.checksum}</strong></div>
            </article>

            <article class="network-card route-card">
                <span class="network-card-label">Camada 3 — Rede</span>
                <h3>Melhor rota por Dijkstra</h3>
                <p>O grafo usa custos simulando atraso/latência. A rota destacada é a de menor custo total.</p>
                <div class="network-kv"><span>Origem</span><strong>${sourceId} — ${networkPacket.ipOrigem}</strong></div>
                <div class="network-kv"><span>Destino</span><strong>${targetId} — ${networkPacket.ipDestino}</strong></div>
                <div class="network-kv"><span>TTL inicial</span><strong>${networkPacket.ttl}</strong></div>
                <div class="network-kv"><span>Custo total</span><strong>${totalCost}</strong></div>
                <div class="network-route-text">${routeNames}</div>
                <small>Nós avaliados pelo algoritmo: ${visited}</small>
            </article>
        </div>

        <div class="network-canvas-panel">
            <div class="network-canvas-topbar">
                <strong>${protocolKey}</strong>
                <span id="network-hop-status">Preparando envio do pacote...</span>
            </div>
            <canvas id="network-canvas" aria-label="Canvas com a animação do pacote percorrendo o grafo"></canvas>
        </div>
    `;

    const canvas = document.getElementById('network-canvas');
    const status = document.getElementById('network-hop-status');
    resizeCanvas(canvas);
    drawGraph(canvas.getContext('2d'), canvas, { route, packetPosition: null, currentHop: '', visitedOrder });

    setTimeout(() => {
        animatePacket(canvas, route, visitedOrder, (hopIndex, label) => {
            if (!status) return;
            if (label.includes('entregue')) {
                status.textContent = label;
                return;
            }
            const remainingTtl = Math.max(networkPacket.ttl - hopIndex - 1, 0);
            status.textContent = `${label} | TTL restante: ${remainingTtl}`;
        });
    }, 350);

    window.addEventListener('resize', () => {
        resizeCanvas(canvas);
        drawGraph(canvas.getContext('2d'), canvas, { route, packetPosition: null, currentHop: '', visitedOrder });
    }, { passive: true });
}

function runNetworkSimulation() {
    const sourceSelect = document.getElementById('network-source');
    const targetSelect = document.getElementById('network-target');
    const protocolSelect = document.getElementById('network-protocol');
    const container = document.getElementById('network-simulation-container');

    if (!sourceSelect || !targetSelect || !protocolSelect || !container) return;

    let sourceId = sourceSelect.value || 'R1';
    let targetId = targetSelect.value || 'R10';
    if (sourceId === targetId) {
        targetId = getActiveRouters().find(router => router.id !== sourceId)?.id || 'R10';
        targetSelect.value = targetId;
    }

    const protocolKey = protocolSelect.value || 'HTTP/HTTPS';
    const bestRoute = findBestRoute(sourceId, targetId);

    if (bestRoute.route.length === 0) {
        container.innerHTML = '<p class="network-empty">Não existe rota ativa entre os roteadores escolhidos.</p>';
        return;
    }

    const segment = createTransportSegment(protocolKey);
    const networkPacket = createNetworkPacket(
        segment,
        sourceId,
        targetId,
        bestRoute.route,
        bestRoute.totalCost
    );

    renderSimulation(container, {
        sourceId,
        targetId,
        protocolKey,
        segment,
        networkPacket,
        route: bestRoute.route,
        totalCost: bestRoute.totalCost,
        visitedOrder: bestRoute.visitedOrder
    });
}

export function setupNetworkSimulator() {
    const sourceSelect = document.getElementById('network-source');
    const targetSelect = document.getElementById('network-target');
    const protocolSelect = document.getElementById('network-protocol');
    const runButton = document.getElementById('network-run');
    const requestInput = document.getElementById('input');

    if (!sourceSelect || !targetSelect || !protocolSelect || !runButton) return;

    sourceSelect.innerHTML = createRouterOptions('R1');
    targetSelect.innerHTML = createRouterOptions('R10');
    sourceSelect.value = 'R1';
    targetSelect.value = 'R10';

    runButton.addEventListener('click', runNetworkSimulation);
    sourceSelect.addEventListener('change', () => {
        if (sourceSelect.value === targetSelect.value) {
            const alternative = getActiveRouters().find(router => router.id !== sourceSelect.value);
            if (alternative) targetSelect.value = alternative.id;
        }
    });
    targetSelect.addEventListener('change', () => {
        if (sourceSelect.value === targetSelect.value) {
            const alternative = getActiveRouters().find(router => router.id !== targetSelect.value);
            if (alternative) sourceSelect.value = alternative.id;
        }
    });

    if (requestInput) {
        requestInput.addEventListener('input', () => {
            protocolSelect.value = detectProtocolFromText(requestInput.value);
        });
    }

    runNetworkSimulation();
}
