// Estado global da aplicação
let state = {
    jogos: [],
    times: [],
    competidores: [],
    confrontos: [],
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    configurarNavegacao();
    renderizarTudo();
});

// Busca todos os dados via service
async function carregarDados() {
    try {
        const [jogos, times, competidores, confrontos] = await Promise.all([
            getJogos(),
            getTimes(),
            getCompetidores(),
            getConfrontos(),
        ]);

        state.jogos = jogos;
        state.times = times;
        state.competidores = competidores;
        state.confrontos = confrontos;
    } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
    }
}

// Configura cliques na navegação lateral
function configurarNavegacao() {
    const itens = document.querySelectorAll('#sidebar-nav li');

    itens.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');

            trocarView(view);

            itens.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function trocarView(viewId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    const view = document.getElementById(`view-${viewId}`);

    if (view) {
        view.classList.add('active');
    }
}

function renderizarTudo() {
    renderizarDashboard();
    renderizarJogos();
    renderizarTimes();
    renderizarCompetidores();
    renderizarConfrontos();
}

// ======================================================
// DASHBOARD
// ======================================================

function renderizarDashboard() {
    const stats = document.getElementById('dashboard-stats');
    const proximos = document.getElementById('upcoming-matches');

    if (!stats || !proximos) return;

    const encerrados = state.confrontos.filter(
        c => c.status === 'finished'
    ).length;

    const agendados = state.confrontos.filter(
        c => c.status === 'scheduled'
    ).length;

    stats.innerHTML = `
        <div class="card">
            <span class="card-tag">Torneio</span>
            <h3>${state.times.length}</h3>
            <p class="subtitle">Equipes</p>
        </div>

        <div class="card">
            <span class="card-tag">Atletas</span>
            <h3>${state.competidores.length}</h3>
            <p class="subtitle">Competidores</p>
        </div>

        <div class="card">
            <span class="card-tag">Encerrados</span>
            <h3>${encerrados}</h3>
            <p class="subtitle">Resultados</p>
        </div>

        <div class="card">
            <span class="card-tag">Pendentes</span>
            <h3>${agendados}</h3>
            <p class="subtitle">Agendamentos</p>
        </div>
    `;

    const lista = state.confrontos
        .filter(c => c.status === 'scheduled')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (lista.length === 0) {
        proximos.innerHTML = `
            <div class="card">
                <span class="card-tag">Agenda</span>
                <h3>Nenhum confronto agendado</h3>
                <p class="subtitle">
                    Cadastre um novo confronto para começar.
                </p>
            </div>
        `;
    } else {
        proximos.innerHTML = lista.map(c => {
            const jogo = state.jogos.find(j => j.id == c.gameId);
            const time1 = state.times.find(t => t.id == c.team1Id);
            const time2 = state.times.find(t => t.id == c.team2Id);

            const data = new Date(c.date).toLocaleString('pt-BR');

            return `
                <div class="card">
                    <span class="card-tag">
                        ${jogo?.name || 'Jogo'}
                    </span>

                    <div class="match-card">
                        <div class="team-score">
                            <strong>${time1?.name || 'TBD'}</strong>
                        </div>

                        <div class="vs">VS</div>

                        <div class="team-score">
                            <strong>${time2?.name || 'TBD'}</strong>
                        </div>
                    </div>

                    <p class="subtitle" style="text-align:center;">
                        ${data}
                    </p>
                </div>
            `;
        }).join('');
    }

    // Novo elemento inteligente
    renderizarAssistenteInteligente();
}

// ======================================================
// ELEMENTO INTELIGENTE
// ======================================================

function gerarInsightTorneio() {
    const agendados = state.confrontos
        .filter(c => c.status === 'scheduled')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const finalizados = state.confrontos.filter(
        c => c.status === 'finished'
    );

    // Caso não existam dados
    if (
        state.times.length === 0 &&
        state.competidores.length === 0 &&
        state.confrontos.length === 0
    ) {
        return {
            titulo: 'Comece seu torneio',
            mensagem:
                'Cadastre equipes, competidores e confrontos para que o assistente possa analisar o torneio.',
            cor: '#6366f1',
            icone: '🤖'
        };
    }

    // Nenhum confronto agendado
    if (agendados.length === 0 && finalizados.length > 0) {
        return {
            titulo: 'Agenda atualizada',
            mensagem:
                'Não existem confrontos pendentes no momento. Todos os confrontos cadastrados foram encerrados.',
            cor: '#10b981',
            icone: '✅'
        };
    }

    // Existem confrontos agendados
    if (agendados.length > 0) {
        const proximo = agendados[0];

        const time1 = state.times.find(
            t => t.id == proximo.team1Id
        );

        const time2 = state.times.find(
            t => t.id == proximo.team2Id
        );

        const jogo = state.jogos.find(
            j => j.id == proximo.gameId
        );

        const data = new Date(proximo.date);

        const agora = new Date();

        let mensagemData = '';

        if (data > agora) {
            const diferenca =
                data.getTime() - agora.getTime();

            const horas = Math.ceil(
                diferenca / (1000 * 60 * 60)
            );

            if (horas < 24) {
                mensagemData =
                    `O confronto acontece em aproximadamente ${horas} hora(s).`;
            } else {
                const dias = Math.ceil(horas / 24);

                mensagemData =
                    `O próximo confronto acontece em aproximadamente ${dias} dia(s).`;
            }
        } else {
            mensagemData =
                'O próximo confronto está marcado para este momento ou já passou do horário.';
        }

        return {
            titulo: 'Assistente do Torneio',
            mensagem:
                `O próximo confronto é ${time1?.name || 'TBD'} vs ${time2?.name || 'TBD'} ` +
                `pelo jogo ${jogo?.name || 'não informado'}. ${mensagemData}`,
            cor: '#6366f1',
            icone: '🤖'
        };
    }

    // Existem equipes mas nenhum confronto
    if (state.times.length > 0 && state.confrontos.length === 0) {
        return {
            titulo: 'Próximo passo sugerido',
            mensagem:
                `Você possui ${state.times.length} equipe(s) cadastrada(s). Crie um confronto para iniciar o calendário do torneio.`,
            cor: '#f59e0b',
            icone: '💡'
        };
    }

    // Situação padrão
    return {
        titulo: 'Torneio em andamento',
        mensagem:
            `O sistema identificou ${state.times.length} equipe(s), ` +
            `${state.competidores.length} competidor(es) e ` +
            `${state.confrontos.length} confronto(s) cadastrado(s).`,
        cor: '#6366f1',
        icone: '🤖'
    };
}

function renderizarAssistenteInteligente() {
    const dashboard = document.getElementById('dashboard-stats');

    if (!dashboard) return;

    // Evita duplicação
    const antigo = document.getElementById(
        'assistente-inteligente'
    );

    if (antigo) {
        antigo.remove();
    }

    const insight = gerarInsightTorneio();

    const card = document.createElement('div');

    card.id = 'assistente-inteligente';

    card.className = 'card';

    card.style.gridColumn = '1 / -1';
    card.style.borderLeft = `5px solid ${insight.cor}`;
    card.style.background =
        'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(255,255,255,0.04))';
    card.style.marginTop = '1rem';

    card.innerHTML = `
        <div style="
            display:flex;
            align-items:center;
            gap:12px;
            margin-bottom:10px;
        ">
            <div style="
                width:42px;
                height:42px;
                border-radius:50%;
                background:${insight.cor};
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:22px;
            ">
                ${insight.icone}
            </div>

            <div>
                <span class="card-tag">
                    IA DO TORNEIO
                </span>

                <h3 style="margin:4px 0 0;">
                    ${insight.titulo}
                </h3>
            </div>
        </div>

        <p class="subtitle" style="line-height:1.6;">
            ${insight.mensagem}
        </p>

        <button
            type="button"
            onclick="atualizarInsight()"
            style="
                padding:8px 14px;
                margin-top:8px;
                cursor:pointer;
            "
        >
            Atualizar análise
        </button>
    `;

    dashboard.appendChild(card);
}

window.atualizarInsight = function () {
    renderizarAssistenteInteligente();
};

// ======================================================
// JOGOS
// ======================================================

function renderizarJogos() {
    const lista = document.getElementById('list-jogos');

    if (!lista) return;

    lista.innerHTML = state.jogos.map(j => `
        <div class="card">
            <span class="card-tag">${j.genre}</span>

            <h3>${j.name}</h3>

            <p class="subtitle">
                ID: ${j.id}
            </p>
        </div>
    `).join('');
}

// ======================================================
// TIMES
// ======================================================

function renderizarTimes() {
    const lista = document.getElementById('list-times');

    if (!lista) return;

    lista.innerHTML = state.times.map(t => `
        <div
            class="card"
            style="border-right: 4px solid ${t.color}"
        >
            <span class="card-tag">
                EQUIPE
            </span>

            <h3>${t.name}</h3>

            <p class="subtitle">
                ${
                    state.competidores.filter(
                        c => c.teamId == t.id
                    ).length
                } Jogadores
            </p>
        </div>
    `).join('');
}

// ======================================================
// COMPETIDORES
// ======================================================

function renderizarCompetidores() {
    const lista =
        document.getElementById('list-competidores');

    if (!lista) return;

    lista.innerHTML = state.competidores.map(c => {
        const time = state.times.find(
            t => t.id == c.teamId
        );

        return `
            <div class="card">
                <span class="card-tag">
                    ${time?.name || 'Sem Time'}
                </span>

                <h3>${c.nickname}</h3>

                <p class="subtitle">
                    ${c.name}
                </p>
            </div>
        `;
    }).join('');
}

// ======================================================
// CONFRONTOS
// ======================================================

function renderizarConfrontos() {
    const lista =
        document.getElementById('list-confrontos');

    if (!lista) return;

    lista.innerHTML = state.confrontos.map(c => {
        const jogo = state.jogos.find(
            j => j.id == c.gameId
        );

        const time1 = state.times.find(
            t => t.id == c.team1Id
        );

        const time2 = state.times.find(
            t => t.id == c.team2Id
        );

        const data = new Date(c.date)
            .toLocaleString('pt-BR');

        return `
            <div class="card">

                <span class="card-tag">
                    ${jogo?.name || 'Jogo'} | ${data}
                </span>

                <div class="match-card">

                    <div class="team-score">
                        <strong>
                            ${time1?.name || '???'}
                        </strong>

                        <div class="score">
                            ${c.score1}
                        </div>
                    </div>

                    <div class="vs">
                        VS
                    </div>

                    <div class="team-score">
                        <strong>
                            ${time2?.name || '???'}
                        </strong>

                        <div class="score">
                            ${c.score2}
                        </div>
                    </div>

                </div>

                <div style="
                    margin-top:1rem;
                    text-align:center;
                ">

                    <span
                        class="card-tag"
                        style="
                            background:
                            ${
                                c.status === 'finished'
                                    ? '#10b981'
                                    : '#f59e0b'
                            }
                        "
                    >
                        ${
                            c.status === 'finished'
                                ? 'FINALIZADO'
                                : 'AGENDADO'
                        }
                    </span>

                    ${
                        c.status === 'scheduled'
                            ? `
                                <button
                                    onclick="encerrarConfrontos(${c.id})"
                                    style="
                                        padding:4px 8px;
                                        font-size:0.7rem;
                                        margin-left:8px;
                                    "
                                >
                                    Finalizar
                                </button>
                            `
                            : ''
                    }

                </div>
            </div>
        `;
    }).join('');
}

// ======================================================
// MODAL E FORMULÁRIOS
// ======================================================

const modal =
    document.getElementById('modal-container');

const formContent =
    document.getElementById('form-content');

window.abrirFormulario = function (tipo) {

    if (!modal || !formContent) return;

    modal.style.display = 'flex';

    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'all';
    }, 10);

    const optionsTimes = state.times
        .map(t => `
            <option value="${t.id}">
                ${t.name}
            </option>
        `)
        .join('');

    const optionsJogos = state.jogos
        .map(j => `
            <option value="${j.id}">
                ${j.name}
            </option>
        `)
        .join('');

    const formularios = {

        jogo: `
            <h2>Adicionar Jogo</h2>

            <form
                onsubmit="salvarItem(event, 'jogos')"
            >
                <div class="form-group">
                    <label>Nome do Jogo</label>

                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Ex: CS2"
                    >
                </div>

                <div class="form-group">
                    <label>Gênero</label>

                    <input
                        type="text"
                        name="genre"
                        required
                        placeholder="Ex: FPS"
                    >
                </div>

                <div style="
                    display:flex;
                    gap:1rem;
                ">
                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        Salvar
                    </button>

                    <button
                        type="button"
                        onclick="fecharModal()"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        `,

        time: `
            <h2>Adicionar Time</h2>

            <form
                onsubmit="salvarItem(event, 'times')"
            >
                <div class="form-group">
                    <label>Nome da Equipe</label>

                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Ex: Ninjas da Noite"
                    >
                </div>

                <div class="form-group">
                    <label>Cor Identidade</label>

                    <input
                        type="color"
                        name="color"
                        value="#6366f1"
                    >
                </div>

                <div style="
                    display:flex;
                    gap:1rem;
                ">
                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        Criar
                    </button>

                    <button
                        type="button"
                        onclick="fecharModal()"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        `,

        competidor: `
            <h2>Registrar Competidor</h2>

            <form
                onsubmit="salvarItem(event, 'competidores')"
            >
                <div class="form-group">
                    <label>Nome Completo</label>

                    <input
                        type="text"
                        name="name"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Nickname</label>

                    <input
                        type="text"
                        name="nickname"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Time</label>

                    <select
                        name="teamId"
                        required
                    >
                        ${optionsTimes}
                    </select>
                </div>

                <div style="
                    display:flex;
                    gap:1rem;
                ">
                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        Registrar
                    </button>

                    <button
                        type="button"
                        onclick="fecharModal()"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        `,

        confronto: `
            <h2>Novo Confronto</h2>

            <form
                onsubmit="salvarItem(event, 'confrontos')"
            >

                <div class="form-group">
                    <label>Jogo</label>

                    <select
                        name="gameId"
                        required
                    >
                        ${optionsJogos}
                    </select>
                </div>

                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:1rem;
                ">

                    <div class="form-group">
                        <label>Time A</label>

                        <select
                            name="team1Id"
                            required
                        >
                            ${optionsTimes}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Time B</label>

                        <select
                            name="team2Id"
                            required
                        >
                            ${optionsTimes}
                        </select>
                    </div>

                </div>

                <div class="form-group">
                    <label>Data/Hora</label>

                    <input
                        type="datetime-local"
                        name="date"
                        required
                        value="${new Date()
                            .toISOString()
                            .slice(0, 16)}"
                    >
                </div>

                <input
                    type="hidden"
                    name="score1"
                    value="0"
                >

                <input
                    type="hidden"
                    name="score2"
                    value="0"
                >

                <input
                    type="hidden"
                    name="status"
                    value="scheduled"
                >

                <div style="
                    display:flex;
                    gap:1rem;
                ">

                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        Agendar
                    </button>

                    <button
                        type="button"
                        onclick="fecharModal()"
                    >
                        Cancelar
                    </button>

                </div>
            </form>
        `
    };

    formContent.innerHTML =
        formularios[tipo] || '';
};

window.fecharModal = function () {

    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.pointerEvents = 'none';

    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

// ======================================================
// SALVAR ITEM
// ======================================================

window.salvarItem = function (
    event,
    colecao
) {
    event.preventDefault();

    const dados = Object.fromEntries(
        new FormData(event.target).entries()
    );

    const maxId = state[colecao].reduce(
        (max, item) =>
            item.id > max
                ? item.id
                : max,
        0
    );

    dados.id = maxId + 1;

    if (dados.teamId) {
        dados.teamId = Number(dados.teamId);
    }

    if (dados.gameId) {
        dados.gameId = Number(dados.gameId);
    }

    if (dados.team1Id) {
        dados.team1Id = Number(dados.team1Id);
    }

    if (dados.team2Id) {
        dados.team2Id = Number(dados.team2Id);
    }

    if (dados.score1 !== undefined) {
        dados.score1 = Number(dados.score1);
    }

    if (dados.score2 !== undefined) {
        dados.score2 = Number(dados.score2);
    }

    state[colecao].push(dados);

    renderizarTudo();

    fecharModal();
};

// ======================================================
// FINALIZAR CONFRONTO
// ======================================================

window.encerrarConfrontos = function (id) {

    const confronto =
        state.confrontos.find(
            c => c.id == id
        );

    if (!confronto) return;

    const time1 =
        state.times.find(
            t => t.id == confronto.team1Id
        );

    const time2 =
        state.times.find(
            t => t.id == confronto.team2Id
        );

    const placar1 = prompt(
        `Placar para ${time1?.name || 'Time A'}:`,
        '0'
    );

    const placar2 = prompt(
        `Placar para ${time2?.name || 'Time B'}:`,
        '0'
    );

    if (
        placar1 !== null &&
        placar2 !== null
    ) {

        const valor1 = Number(placar1);
        const valor2 = Number(placar2);

        if (
            Number.isNaN(valor1) ||
            Number.isNaN(valor2) ||
            valor1 < 0 ||
            valor2 < 0
        ) {
            alert(
                'Digite placares válidos.'
            );
            return;
        }

        confronto.score1 = valor1;
        confronto.score2 = valor2;
        confronto.status = 'finished';

        renderizarTudo();
    }
};
