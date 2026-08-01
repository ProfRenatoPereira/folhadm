function actualizarDashboard() {
    const elMes = document.getElementById('mes_referencia');
    const elAno = document.getElementById('ano_referencia');
    const mesSelecionado = elMes ? elMes.value.trim() : '';
    const anoSelecionado = elAno ? elAno.value.trim() : '';
    
    const receita = parseFloat(document.getElementById('receita_empresa')?.value) || 0;
    let totalBruto = 0, totalDescontos = 0, totalLiquido = 0, custoTotalCorporativo = 0;
    let totalFuncionariosMes = 0;
    
    funcionarios.forEach(f => {
        // Normalização das strings para garantir que '7' e '07' coincidam perfeitamente
        const fMes = f.mes_ref ? String(f.mes_ref).trim() : '';
        const fAno = f.ano_ref ? String(f.ano_ref).trim() : '';
        
        // Aplica o filtro de competência de mês e ano antes de somar as métricas
        if ((fMes === mesSelecionado || parseInt(fMes) === parseInt(mesSelecionado)) && fAno === anoSelecionado) {
            totalFuncionariosMes++;
            totalBruto += f.salario + (f.total_he_ganho || 0) + (f.insalubridade || 0) + (f.adicional_noturno || 0);
            totalDescontos += (f.total_descontos || 0);
            totalLiquido += (f.liquido || 0);
            custoTotalCorporativo += f.salario + (f.beneficios || 0) + (f.total_he_ganho || 0) + (f.adicional_noturno || 0);
        }
    });

    let saldoFinal = receita - custoTotalCorporativo;
    const elTotal = document.getElementById('dash_total_func');
    const elLim = document.getElementById('limite_func');
    if (elTotal && elLim) elTotal.innerText = totalFuncionariosMes + ' / ' + elLim.value;
    
    if (document.getElementById('dash_custo_bruto')) document.getElementById('dash_custo_bruto').innerText = formatarMoeda(totalBruto);
    if (document.getElementById('dash_total_descontos')) document.getElementById('dash_total_descontos').innerText = formatarMoeda(totalDescontos);
    if (document.getElementById('dash_folha_liquida')) document.getElementById('dash_folha_liquida').innerText = formatarMoeda(totalLiquido);
    if (document.getElementById('dash_saldo_empresa')) document.getElementById('dash_saldo_empresa').innerText = formatarMoeda(saldoFinal);
    if (document.getElementById('card_balanco')) document.getElementById('card_balanco').className = saldoFinal < 0 ? 'metric negative' : 'metric';
    
    renderizarGraficosNativos(totalLiquido, totalDescontos);
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela_corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    
    const elMes = document.getElementById('mes_referencia');
    const elAno = document.getElementById('ano_referencia');
    const mesSelecionado = elMes ? elMes.value.trim() : '';
    const anoSelecionado = elAno ? elAno.value.trim() : '';
    
    funcionarios.forEach(f => {
        const fMes = f.mes_ref ? String(f.mes_ref).trim() : '';
        const fAno = f.ano_ref ? String(f.ano_ref).trim() : '';
        
        // Renderiza apenas os colaboradores que pertencem ao mês e ano selecionados
        if ((fMes === mesSelecionado || parseInt(fMes) === parseInt(mesSelecionado)) && fAno === anoSelecionado) {
            const dataFormatada = f.data_admissao ? f.data_admissao.split('-').reverse().join('/') : '---';
            const turnoRotulo = f.turno === 'noturno' ? '🌙 Noturno' : '☀️ Diurno';
            const jTexto = f.banco_horas > 0 ? f.horas_comp + 'h (+' + f.banco_horas + 'h BH)' : f.horas_comp + 'h';
            const deptoRotulo = f.departamento ? f.departamento : 'Administrativo';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><a id="lnk_${f.id}" style="cursor:pointer; color:var(--primary); text-decoration:underline;"><strong>${f.nome}</strong></a><br><small>Admissão: ${dataFormatada}</small></td>
            <td>${f.cargo}<br><small style="color:#64748b">Dep: ${deptoRotulo}</small></td>
            <td><small>Jornada: ${jTexto}</small><br><strong>${turnoRotulo}</strong></td>
            <td style="color:#16a34a"><strong>${formatarMoeda(f.liquido)}</strong></td>
            <td class="actions-cell" style="display: flex; gap: 4px; align-items: center; justify-content: flex-start; wrap: nowrap;">
                <a onclick="abrirContracheque(${f.id})" class="btn-link" title="Holerite Mensal">📄 Mês</a>
                <a onclick="abrirFerias(${f.id})" class="btn-link" style="color:#16a34a" title="Recibo de Férias">🌴 Férias</a>
                <a onclick="calcularDecimoTerceiroIndividual(${f.id})" class="btn-link" style="color:#0284c7" title="13º Individual">🎄 13º</a>
                <button class="btn-delete" style="background:#dc2626; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="dispararRescisaoImediata(${f.id}, 'demissao_sem_justa')" title="Dispensa">⚠️ Dispensa</button>
                <button class="btn-delete" style="background:#f97316; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="dispararRescisaoImediata(${f.id}, 'pedido_demissao')" title="Pedido">🚪 Pedido</button>
                <button class="btn-delete" style="background:#7f1d1d; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="deletarFuncionario(${f.id})" title="Demitir Profissional">❌ Demitir</button>
            </td>`;
            corpo.appendChild(tr);
            document.getElementById(`lnk_${f.id}`)?.addEventListener('click', () => carregarFuncionarioParaEdicao(f));
        }
    });
}
async function adicionarFuncionario() {
    const pegarValor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    const nome = pegarValor('nome').trim();
    if (!nome) { alert('Insira o nome do profissional.'); return; }
    
    const dados = {
        id: pegarValor('func_id_edicao'),
        nome: nome,
        cargo: pegarValor('cargo'),
        salario: parseFloat(pegarValor('salario')) || 0,
        horasComp: parseFloat(pegarValor('horas_comp')) || 220,
        beneficios: parseFloat(pegarValor('beneficios')) || 0,
        heSemana: parseFloat(pegarValor('he_semana')) || 0,
        heSabado: parseFloat(pegarValor('he_sabado')) || 0,
        heDomingo: parseFloat(pegarValor('he_domingo')) || 0,
        planoSaude: parseFloat(pegarValor('plano_saude')) || 0,
        planoOdonto: parseFloat(pegarValor('plano_odontologico')) || 0,
        valeFarmacia: parseFloat(pegarValor('vale_farmacia')) || 0,
        sindicato: parseFloat(pegarValor('sindicato')) || 0,
        valeRefeicao: parseFloat(pegarValor('vale_refeicao')) || 0,
        valeMercado: parseFloat(pegarValor('vale_mercado')) || 0,
        adiantamento: pegarValor('adiantamento'),
        vt: pegarValor('vt_desconto'),
        qtdFilhos: parseInt(pegarValor('qtd_filhos')) || 0,
        mesRef: pegarValor('mes_referencia'),
        anoRef: pegarValor('ano_referencia') || '2026',
        regimeHe: pegarValor('regime_he'),
        turno: pegarValor('turno'),
        horaEntrada: pegarValor('hora_entrada'),
        departamento: pegarValor('departamento'),
        observacoes: pegarValor('observacoes'),
        dataAdmissao: pegarValor('data_admissao')
    };

    try {
        const resposta = await fetch('/api/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        if (resposta.ok) {
            limparCamposTela();
            await carregarDadosBanco();
        } else {
            const erro = await resposta.json();
            alert(erro.message || "Erro no cálculo.");
        }
    } catch(e) { console.error("Erro ao enviar funcionário para API"); }
}

function limparCamposTela() {
    const padroes = {
        'func_id_edicao': '', 'nome': '', 'salario': '3500', 'horas_comp': '220',
        'regime_he': 'pagar', 'beneficios': '500', 'qtd_filhos': '0', 'observacoes': '',
        'he_semana': '0', 'he_sabado': '0', 'he_domingo': '0', 'turno': 'diurno',
        'hora_entrada': '08:00', 'adiantamento': 'nao', 'vt_desconto': 'nao',
        'vale_farmacia': '0', 'sindicato': '0', 'plano_saude': '0', 'plano_odontologico': '0',
        'novo_aumento_salarial': '0', 'vale_refeicao': '0', 'vale_mercado': '0'
    };
    Object.keys(padroes).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = padroes[id];
    });
    const btn = document.getElementById('btn_contratar');
    if (btn) btn.innerText = 'Contratar Profissional';
}

function carregarFuncionarioParaEdicao(f) {
    const mapeamento = {
        'func_id_edicao': f.id, 'nome': f.nome, 'cargo': f.cargo, 'salario': f.salario,
        'horas_comp': f.horas_comp, 'regime_he': f.regime_he, 'beneficios': f.beneficios,
        'qtd_filhos': f.qtd_filhos, 'observacoes': f.observacoes || '', 'data_admissao': f.data_admissao,
        'turno': f.turno, 'hora_entrada': f.hora_entrada, 'departamento': f.departamento,
        'vale_farmacia': f.vale_farmacia || 0, 'sindicato': f.sindicato || 0,
        'plano_saude': f.plano_saude || 0, 'plano_odontologico': f.plano_odontologico || 0,
        'vale_refeicao': f.vale_refeicao || 0, 'vale_mercado': f.vale_mercado || 0
    };
    Object.keys(mapeamento).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = mapeamento[id];
    });
    const btn = document.getElementById('btn_contratar');
    if (btn) btn.innerText = 'Modo Edição Ativo';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function salvarAlteracoesFuncionario() {
    const id = document.getElementById('func_id_edicao')?.value;
    if (!id) { alert('Selecione um funcionário clicando no nome dele primeiro.'); return; }
    const valorPromocao = parseFloat(document.getElementById('novo_aumento_salarial')?.value) || 0;
    if (valorPromocao > 0 && document.getElementById('salario')) { 
        document.getElementById('salario').value = valorPromocao; 
    }
    await adicionarFuncionario(); 
}
function actualizarDashboard() {
    const elMes = document.getElementById('mes_referencia');
    const elAno = document.getElementById('ano_referencia');
    const mesSelecionado = elMes ? elMes.value.trim() : '';
    const anoSelecionado = elAno ? elAno.value.trim() : '';
    
    const receita = parseFloat(document.getElementById('receita_empresa')?.value) || 0;
    let totalBruto = 0, totalDescontos = 0, totalLiquido = 0, custoTotalCorporativo = 0;
    let totalFuncionariosMes = 0;
    
    funcionarios.forEach(f => {
        const fMes = f.mes_ref ? String(f.mes_ref).trim() : '';
        const fAno = f.ano_ref ? String(f.ano_ref).trim() : '';
        
        if ((fMes === mesSelecionado || parseInt(fMes) === parseInt(mesSelecionado)) && fAno === anoSelecionado) {
            totalFuncionariosMes++;
            totalBruto += f.salario + (f.total_he_ganho || 0) + (f.insalubridade || 0) + (f.adicional_noturno || 0);
            totalDescontos += (f.total_descontos || 0);
            totalLiquido += (f.liquido || 0);
            custoTotalCorporativo += f.salario + (f.beneficios || 0) + (f.total_he_ganho || 0) + (f.adicional_noturno || 0);
        }
    });

    let saldoFinal = receita - custoTotalCorporativo;
    const elTotal = document.getElementById('dash_total_func');
    const elLim = document.getElementById('limite_func');
    if (elTotal && elLim) elTotal.innerText = totalFuncionariosMes + ' / ' + elLim.value;
    
    if (document.getElementById('dash_custo_bruto')) document.getElementById('dash_custo_bruto').innerText = formatarMoeda(totalBruto);
    if (document.getElementById('dash_total_descontos')) document.getElementById('dash_total_descontos').innerText = formatarMoeda(totalDescontos);
    if (document.getElementById('dash_folha_liquida')) document.getElementById('dash_folha_liquida').innerText = formatarMoeda(totalLiquido);
    if (document.getElementById('dash_saldo_empresa')) document.getElementById('dash_saldo_empresa').innerText = formatarMoeda(saldoFinal);
    if (document.getElementById('card_balanco')) document.getElementById('card_balanco').className = saldoFinal < 0 ? 'metric negative' : 'metric';
    
    renderizarGraficosNativos(totalLiquido, totalDescontos);
}

function renderizarGraficosNativos(liquido, descontos) {
    const total = liquido + descontos;
    const pizza = document.getElementById('nativePizza');
    if (pizza) {
        const perc = total > 0 ? ((descontos / total) * 100).toFixed(1) : 0;
        pizza.style.background = `conic-gradient(#dc2626 0% ${perc}%, #16a34a ${perc}% 100%)`;
    }
    const custosCargo = {};
    funcionarios.forEach(f => custosCargo[f.cargo] = (custosCargo[f.cargo] || 0) + f.salario);
    const cargos = Object.keys(custosCargo).sort((a,b) => custosCargo[b] - custosCargo[a]);
    const maxCusto = cargos.length > 0 ? custosCargo[cargos[0]] : 1;
    const containerPareto = document.getElementById('nativePareto');
    if (containerPareto) {
        containerPareto.innerHTML = '';
        cargos.slice(0, 4).forEach(c => {
            const pct = maxCusto > 0 ? (custosCargo[c] / maxCusto) * 100 : 0;
            containerPareto.innerHTML += `<div class="bar-wrapper"><div class="bar-native" style="height: ${pct}%">${pct.toFixed(0)}%</div><div class="bar-label">${c}</div></div>`;
        });
    }
    const containerLinear = document.getElementById('nativeLinear');
    if (containerLinear) {
        containerLinear.innerHTML = '';
        const maxBruto = funcionarios.length > 0 ? Math.max(...funcionarios.map(f => f.salario)) : 1;
        funcionarios.slice(-4).forEach(f => {
            const pct = maxBruto > 0 ? (f.salario / maxBruto) * 100 : 0;
            containerLinear.innerHTML += `<div class="linear-row"><div class="linear-name">${f.nome}</div><div class="linear-bar-bg"><div class="linear-bar-fill" style="width: ${pct}%"></div></div><div class="linear-value" style="color:#1e3a8a">${formatarMoeda(f.salario)}</div></div>`;
        });
    }
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela_corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    
    const elMes = document.getElementById('mes_referencia');
    const elAno = document.getElementById('ano_referencia');
    const mesSelecionado = elMes ? elMes.value.trim() : '';
    const anoSelecionado = elAno ? elAno.value.trim() : '';
    
    funcionarios.forEach(f => {
        const fMes = f.mes_ref ? String(f.mes_ref).trim() : '';
        const fAno = f.ano_ref ? String(f.ano_ref).trim() : '';
        
        if ((fMes === mesSelecionado || parseInt(fMes) === parseInt(mesSelecionado)) && fAno === anoSelecionado) {
            const dataFormatada = f.data_admissao ? f.data_admissao.split('-').reverse().join('/') : '---';
            const turnoRotulo = f.turno === 'noturno' ? '🌙 Noturno' : '☀️ Diurno';
            const jTexto = f.banco_horas > 0 ? f.horas_comp + 'h (+' + f.banco_horas + 'h BH)' : f.horas_comp + 'h';
            const deptoRotulo = f.departamento ? f.departamento : 'Administrativo';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><a id="lnk_${f.id}" style="cursor:pointer; color:var(--primary); text-decoration:underline;"><strong>${f.nome}</strong></a><br><small>Admissão: ${dataFormatada}</small></td>
            <td>${f.cargo}<br><small style="color:#64748b">Dep: ${deptoRotulo}</small></td>
            <td><small>Jornada: ${jTexto}</small><br><strong>${turnoRotulo}</strong></td>
            <td style="color:#16a34a"><strong>${formatarMoeda(f.liquido)}</strong></td>
            <td class="actions-cell" style="display: flex; gap: 4px; align-items: center; justify-content: flex-start; wrap: nowrap;">
                <a onclick="abrirContracheque(${f.id})" class="btn-link" title="Holerite Mensal">📄 Mês</a>
                <a onclick="abrirFerias(${f.id})" class="btn-link" style="color:#16a34a" title="Recibo de Férias">🌴 Férias</a>
                <a onclick="calcularDecimoTerceiroIndividual(${f.id})" class="btn-link" style="color:#0284c7" title="13º Individual">🎄 13º</a>
                <button class="btn-delete" style="background:#dc2626; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="dispararRescisaoImediata(${f.id}, 'demissao_sem_justa')" title="Dispensa">⚠️ Dispensa</button>
                <button class="btn-delete" style="background:#f97316; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="dispararRescisaoImediata(${f.id}, 'pedido_demissao')" title="Pedido">🚪 Pedido</button>
                <button class="btn-delete" style="background:#7f1d1d; color:white; border:none; padding:3px 6px; font-size:0.65rem; border-radius:4px; cursor:pointer;" onclick="deletarFuncionario(${f.id})" title="Demitir Profissional">❌ Demitir</button>
            </td>`;
            corpo.appendChild(tr);
            document.getElementById(`lnk_${f.id}`)?.addEventListener('click', () => carregarFuncionarioParaEdicao(f));
        }
    });
}
function imprimirBalanco() {
    const receita = parseFloat(document.getElementById('receita_empresa')?.value) || 0;
    let totalBruto = 0; funcionarios.forEach(f => { totalBruto += (f.salario + (f.total_he_ganho || 0)); });
    const area = document.getElementById('print-area');
    if (area) {
        area.innerHTML = "<div style='padding:40px; font-family:sans-serif; text-align:center;'><div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem; font-family: Arial, sans-serif; margin-bottom:15px;'>📊TERADMAS📈</div><h2>TERCEIRO ADM ASSOCIADOS - BALANÇO DE CAIXA</h2><hr><br><p style='text-align:left;'><strong>Receita Operacional Bruta:</strong> " + formatarMoeda(receita) + "</p><p style='text-align:left;'><strong>Custo de Salários/Reflexos:</strong> " + formatarMoeda(totalBruto) + "</p><br><h3 style='text-align:left;'>Saldo Final de Caixa: " + formatarMoeda(receita - totalBruto) + "</h3></div>";
    }
    document.body.classList.add('imprimindo-balanco'); window.print();
    setTimeout(() => { document.body.classList.remove('imprimindo-balanco'); }, 1000);
}

function dispararRescisaoImediata(id, tipo) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;
    const msg = tipo === 'demissao_sem_justa' ? 'Calcular DISPENSA SEM JUSTA CAUSA de ' : 'Calcular PEDIDO DE DEMISSÃO de ';
    if (confirm(msg + f.nome + "?")) { emitirRescisaoExecutiva(f, tipo); }
}

function calcularDecimoTerceiroIndividual(id) {
    fetch(`/api/decimo_individual/${id}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.status === 'erro') { alert(dados.message); return; }
            const janela = window.open('', '_blank', 'width=800,height=900'); if (!janela) return;
            let html = "<html><head><title>13º Individual</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
            html += "<div class='header-holerite'><div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem;'>📊TERADMAS📈</div><div style='text-align: left;'><h2 style='margin: 0; font-size: 1.3rem; color: #1e3a8a;'>TERCEIRO ADM</h2><h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b;'>ASSOCIADOS</h3></div></div>";
            html += "<h2 style='text-align:center; font-size:1.2rem; margin: 15px 0 5px 0;'>DEMONSTRATIVO DE 13º SALÁRIO INDIVIDUAL</h2><hr>";
            html += "<div class='info-colaborador'><p><strong>Colaborador:</strong> " + dados.nome + " | <strong>Meses Proporcionais:</strong> " + dados.meses_proporcionais + "/12</p></div>";
            html += "<h4 class='section-title proventos-title'>CRÉDITOS</h4><table class='table-holerite'><tr><td>(+) Gratificação Natalina Bruta (Com Média H.E.)</td><td class='text-right'>" + formatarMoeda(dados.bruto) + "</td></tr><tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(dados.bruto) + "</td></tr></table>";
            html += "<h4 class='section-title descontos-title'>RETENÇÕES</h4><table class='table-holerite'><tr><td>(-) INSS sobre 13º</td><td class='text-right'>" + formatarMoeda(dados.inss) + "</td></tr><tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(dados.inss) + "</td></tr></table>";
            html += "<div class='liquido-box'><span>LÍQUIDO A RECEBER:</span><span class='liquido-value'>" + formatarMoeda(dados.liquido) + "</span></div></div></body></html>";
            janela.document.write(html); janela.document.close();
        }).catch(err => console.error(err));
}

async function emitirRescisaoExecutiva(f, tipo) {
    let liq = f.salario * 1.4; let proventos = f.salario * 1.5; let descontos = f.salario * 0.1;
    try {
        const resposta = await fetch('/api/rescisao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salario: f.salario, admissao: f.data_admissao, tipoRescisao: tipo }) });
        const r = await resposta.json(); liq = r.liquido; proventos = r.totalProventos; descontos = proventos - liq;
    } catch(e) {}
    const janela = window.open('', '_blank', 'width=800,height=900'); if (!janela) return;
    let htmlRescisao = "<html><head><title>Rescisão</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    htmlRescisao += "<div class='header-holerite'><div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem;'>📊TERADMAS📈</div><div style='text-align: left;'><h2 style='margin: 0; font-size: 1.3rem; color: #1e3a8a;'>TERCEIRO ADM</h2><h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b;'>ASSOCIADOS</h3></div></div>";
    htmlRescisao += "<h2 style='text-align:center; font-size:1.2rem;'>TERMO DE QUITAÇÃO DE RESCISÃO CONTRATUAL</h2><hr>";
    htmlRescisao += "<div class='info-colaborador'><p><strong>Colaborador:</strong> " + f.nome + "</p><p><strong>Motivo:</strong> " + (tipo === 'pedido_demissao' ? 'Pedido de Demissão' : 'Dispensa sem Justa Causa') + "</p></div>";
    htmlRescisao += "<h4 class='section-title proventos-title'>CRÉDITOS RESCISÓRIOS</h4><table class='table-holerite'><tr><td>(+) Saldo Salarial, Férias e 13º Proporcionais</td><td class='text-right'>" + formatarMoeda(proventos) + "</td></tr><tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(proventos) + "</td></tr></table>";
    htmlRescisao += "<h4 class='section-title descontos-title'>DEDUÇÕES</h4><table class='table-holerite'><tr><td>(-) Deduções e Descontos Legais</td><td class='text-right'>" + formatarMoeda(descontos) + "</td></tr><tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(descontos) + "</td></tr></table>";
    htmlRescisao += "<div class='liquido-box'><span>VALOR LÍQUIDO DA QUITAÇÃO:</span><span class='liquido-value'>" + formatarMoeda(liq) + "</span></div></div></body></html>";
    janela.document.write(htmlRescisao); janela.document.close();
}

function abrirDecimoTerceiroGeral() {
    if (funcionarios.length === 0) { alert("Nenhum funcionário ativo."); return; }
    let totalProventos = 0; funcionarios.forEach(f => { totalProventos += f.salario + (f.total_he_ganho || 0); });
    let totalDescontos = totalProventos * 0.09;
    const janela = window.open('', '_blank', 'width=800,height=900'); if (!janela) return;
    let html13 = "<html><head><title>Folha de 13º</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    html13 += "<div class='header-holerite'><div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem;'>📊TERADMAS📈</div><div style='text-align: left;'><h2 style='margin: 0; font-size: 1.3rem; color: #1e3a8a;'>TERCEIRO ADM</h2><h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b;'>ASSOCIADOS</h3></div></div>";
    html13 += "<h2 style='text-align:center; font-size:1.2rem;'>FOLHA DE DÉCIMO TERCEIRO INTEGRAL GERAL</h2><hr>";
    html13 += "<div class='liquido-box'><span>TOTAL LÍQUIDO A PAGAR GLOBAL:</span><span class='liquido-value'>" + formatarMoeda(totalProventos - totalDescontos) + "</span></div></div></body></html>";
    janela.document.write(html13); janela.document.close();
}

async function deletarFuncionario(id) {
    if (!confirm("Tem certeza que deseja remover este registro do sistema?")) return;
    try { await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' }); } catch(e) {}
    await carregarDadosBanco();
}
function obterEstiloHolerite() {
    return `body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #000; } .holerite-box { border: 2px solid #000; padding: 20px; max-width: 750px; margin: 0 auto; background: #fff; } .header-holerite { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 15px; } hr { border: 0; border-top: 1px solid #000; margin: 10px 0; } .info-colaborador p { margin: 5px 0; font-size: 0.9rem; } .section-title { font-size: 0.95rem; margin: 20px 0 5px 0; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; } .proventos-title { color: #1e3a8a; } .descontos-title { color: #dc2626; } .table-holerite { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 15px; } .table-holerite td { padding: 5px; border-bottom: 1px solid #eee; } .text-right { text-align: right; font-weight: bold; } .row-total td { font-weight: bold; border-top: 2px solid #000; padding-top: 8px; border-bottom: none; } .liquido-box { border: 2px solid #000; padding: 12px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; margin-top: 20px; font-weight: bold; font-size: 1rem; } .liquido-value { font-size: 1.15rem; color: #16a34a; } .assinatura-container { margin-top: 40px; display: flex; justify-content: space-between; font-size: 0.85rem; } .linha-assinatura { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 5px; margin-top: 30px; }`;
}

let tamanhoFonteAtual = 16;
function mudarFonte(direcao) {
    tamanhoFonteAtual += direcao;
    if (tamanhoFonteAtual < 12) tamanhoFonteAtual = 12;
    if (tamanhoFonteAtual > 22) tamanhoFonteAtual = 22;
    document.documentElement.style.fontSize = tamanhoFonteAtual + "px";
}

function alternarAltoContraste() {
    document.body.classList.toggle('alto-contraste');
    if (document.body.classList.contains('alto-contraste')) document.body.classList.remove('dark-mode');
}

function alternarTema() {
    const body = document.body; body.classList.toggle('dark-mode');
    const botao = document.getElementById('btn_tema');
    if (body.classList.contains('dark-mode')) {
        if (botao) botao.innerHTML = '☀️ Modo Claro'; localStorage.setItem('tema', 'escuro');
    } else {
        if (botao) botao.innerHTML = '🌙 Modo Escuro'; localStorage.setItem('tema', 'claro');
    }
}

let leitorAtivo = false;
function alternarLeitorAudio() {
    leitorAtivo = !leitorAtivo; const btn = document.getElementById('btn-leitor-audio');
    if (leitorAtivo) {
        if (btn) btn.innerHTML = "🛑 Desativar Leitor"; alert("Leitor ativo. Passe o mouse sobre o texto."); window.speechSynthesis.cancel();
    } else {
        if (btn) btn.innerHTML = "🔊 Ativar Leitor"; window.speechSynthesis.cancel();
    }
}

document.addEventListener('mouseover', (evento) => {
    if (!leitorAtivo) return;
    const tagsParaLer = ['H1', 'H2', 'H3', 'H4', 'LABEL', 'TH', 'TD', 'P', 'SPAN', 'STRONG'];
    if (tagsParaLer.includes(evento.target.tagName) && evento.target.innerText.trim() !== '') {
        window.speechSynthesis.cancel(); 
        const fala = new SpeechSynthesisUtterance(evento.target.innerText);
        fala.lang = 'pt-BR'; fala.rate = 1.25; window.speechSynthesis.speak(fala);
    }
});
