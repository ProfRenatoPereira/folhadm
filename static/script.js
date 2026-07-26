let funcionarios = [];

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

window.addEventListener('DOMContentLoaded', async () => {
    await carregarCargosBanco();
    await carregarDadosBanco();
    
    document.getElementById('btn_add_cargo')?.addEventListener('click', adicionarCargoNovo);
    document.getElementById('btn_contratar')?.addEventListener('click', adicionarFuncionario);
    document.getElementById('btn_salvar')?.addEventListener('click', salvarAlteracoesFuncionario);
    document.getElementById('btn_limpar')?.addEventListener('click', limparCamposTela);
    document.getElementById('btn_balanco')?.addEventListener('click', imprimirBalanco);
    document.getElementById('btn_13')?.addEventListener('click', abrirDecimoTerceiroGeral);
    document.getElementById('btn_print_list')?.addEventListener('click', () => window.print());
    document.getElementById('receita_empresa')?.addEventListener('change', actualizarDashboard);
    document.getElementById('limite_func')?.addEventListener('change', actualizarDashboard);
});



async function carregarCargosBanco() {
    try {
        const resposta = await fetch('/api/cargos');
        if (!resposta.ok) throw new Error();
        const cargos = await resposta.json();
        const selectCargo = document.getElementById('cargo');
        if (selectCargo) {
            selectCargo.innerHTML = '';
            cargos.forEach(c => {
                const cargoNome = Array.isArray(c) ? c : c;
                const opt = document.createElement('option');
                opt.value = cargoNome; opt.innerText = cargoNome;
                selectCargo.appendChild(opt);
            });
        }
    } catch (error) {
        console.warn("API de cargos offline. Inserindo cargos padrão.");
        const selectCargo = document.getElementById('cargo');
        if (selectCargo && selectCargo.children.length === 0) {
            const padroes = ["Diretoria", "Gerência", "Analista", "Operacional"];
            selectCargo.innerHTML = '';
            padroes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.innerText = c;
                selectCargo.appendChild(opt);
            });
        }
    }
}

async function carregarDadosBanco() {
    try {
        const resposta = await fetch('/api/funcionarios');
        if (!resposta.ok) throw new Error();
        funcionarios = await resposta.json();
    } catch (error) {
        console.warn("API de funcionários offline. Rodando local.");
    }
    renderizarTabela();
    actualizarDashboard();
}

async function adicionarCargoNovo() {
    const inputCargo = document.getElementById('novo_cargo_input');
    const nomeCargo = inputCargo ? inputCargo.value.trim() : '';
    if (!nomeCargo) { alert('Digite o nome do novo cargo.'); return; }
    try {
        await fetch('/api/cargos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_cargo: nomeCargo })
        });
    } catch(e) { console.error("Erro ao salvar cargo na API"); }
    if (inputCargo) inputCargo.value = '';
    await carregarCargosBanco();
}



async function adicionarFuncionario() {
    const pegarValor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    const nome = pegarValor('nome').trim();
    if (!nome) { alert('Insira o nome do profissional.'); return; }
    
    const dados = {
        id: pegarValor('func_id_edicao') || pegarValor('funcIdEdicao'),
        nome: nome,
        cargo: pegarValor('cargo'),
        salario: parseFloat(pegarValor('salario')) || 0,
        horasComp: parseFloat(pegarValor('horas_comp')) || parseFloat(pegarValor('horasComp')) || 220,
        insalubridade: parseFloat(pegarValor('insalubridade')) || 0,
        beneficios: parseFloat(pegarValor('beneficios')) || 0,
        heSemana: parseFloat(pegarValor('he_semana')) || parseFloat(pegarValor('heSemana')) || 0,
        heSabado: parseFloat(pegarValor('he_sabado')) || parseFloat(pegarValor('heSabado')) || 0,
        heDomingo: parseFloat(pegarValor('he_domingo')) || parseFloat(pegarValor('heDomingo')) || 0,
        planoSaude: parseFloat(pegarValor('plano_saude')) || parseFloat(pegarValor('planoSaude')) || 0,
        planoOdonto: parseFloat(pegarValor('plano_odonto')) || parseFloat(pegarValor('planoOdonto')) || 0,
        valeFarmacia: parseFloat(pegarValor('vale_farmacia')) || parseFloat(pegarValor('valeFarmacia')) || 0,
        sindicato: parseFloat(pegarValor('sindicato')) || 0,
        adiantamento: pegarValor('adiantamento'),
        vt: pegarValor('vt_desconto') || pegarValor('vtDesconto') || pegarValor('vt'),
        qtdFilhos: parseInt(pegarValor('qtd_filhos')) || parseInt(pegarValor('qtdFilhos')) || 0,
        mesRef: pegarValor('mes_referencia') || pegarValor('mesReferencia') || pegarValor('mes_ref'),
        regimeHe: pegarValor('regime_he') || pegarValor('regimeHe'),
        turno: pegarValor('turno'),
        horaEntrada: pegarValor('hora_entrada') || pegarValor('horaEntrada'),
        departamento: pegarValor('departamento'),
        observacoes: pegarValor('observacoes'),
        dataAdmissao: pegarValor('data_admissao') || pegarValor('dataAdmissao')
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
        }
    } catch(e) { console.error("Erro ao enviar funcionário para API"); }
}



function limparCamposTela() {
    if (document.getElementById('func_id_edicao')) document.getElementById('func_id_edicao').value = '';
    if (document.getElementById('nome')) document.getElementById('nome').value = '';
    if (document.getElementById('salario')) document.getElementById('salario').value = '3500';
    if (document.getElementById('horas_comp')) document.getElementById('horas_comp').value = '220';
    if (document.getElementById('regime_he')) document.getElementById('regime_he').value = 'pagar';
    if (document.getElementById('beneficios')) document.getElementById('beneficios').value = '500';
    if (document.getElementById('qtd_filhos')) document.getElementById('qtd_filhos').value = '0';
    if (document.getElementById('observacoes')) document.getElementById('observacoes').value = '';
    if (document.getElementById('he_semana')) document.getElementById('he_semana').value = '0';
    if (document.getElementById('he_sabado')) document.getElementById('he_sabado').value = '0';
    if (document.getElementById('he_domingo')) document.getElementById('he_domingo').value = '0';
    if (document.getElementById('turno')) document.getElementById('turno').value = 'diurno';
    if (document.getElementById('hora_entrada')) document.getElementById('hora_entrada').value = '08:00';
    if (document.getElementById('adiantamento')) document.getElementById('adiantamento').value = 'nao';
    if (document.getElementById('vt_desconto')) document.getElementById('vt_desconto').value = 'nao';
    if (document.getElementById('novo_aumento_salarial')) document.getElementById('novo_aumento_salarial').value = '0';
    const btn = document.getElementById('btn_contratar');
    if (btn) btn.innerText = 'Contratar Profissional';
}

function carregarFuncionarioParaEdicao(id, nome, cargo, salario, horas, regime, insal, benef, filhos, obs, data, turno, entrada, depto) {
    if (document.getElementById('func_id_edicao')) document.getElementById('func_id_edicao').value = id;
    if (document.getElementById('nome')) document.getElementById('nome').value = nome;
    if (document.getElementById('cargo')) document.getElementById('cargo').value = cargo;
    if (document.getElementById('salario')) document.getElementById('salario').value = salario;
    if (document.getElementById('horas_comp')) document.getElementById('horas_comp').value = horas;
    if (document.getElementById('regime_he')) document.getElementById('regime_he').value = regime;
    if (document.getElementById('beneficios')) document.getElementById('beneficios').value = benef;
    if (document.getElementById('qtd_filhos')) document.getElementById('qtd_filhos').value = filhos;
    if (document.getElementById('observacoes')) document.getElementById('observacoes').value = obs;
    if (document.getElementById('data_admissao')) document.getElementById('data_admissao').value = data;
    if (document.getElementById('turno')) document.getElementById('turno').value = turno;
    if (document.getElementById('hora_entrada')) document.getElementById('hora_entrada').value = entrada;
    if (document.getElementById('departamento')) document.getElementById('departamento').value = depto;
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
    const receita = parseFloat(document.getElementById('receita_empresa')?.value) || 0;
    let totalBruto = 0, totalDescontos = 0, totalLiquido = 0;
    funcionarios.forEach(f => {
        totalBruto += f.salario + (f.total_he_ganho || 0) + (f.insalubridade || 0) + (f.reflexo_13_ferias || 0) + (f.adicional_noturno || 0);
        totalDescontos += (f.total_descontos || 0);
        totalLiquido += (f.liquido || 0);
    });
    let custoTotal = funcionarios.reduce((acc, f) => acc + f.salario + (f.beneficios || 0) + (f.total_he_ganho || 0) + (f.adicional_noturno || 0), 0);
    let saldoFinal = receita - custoTotal;
    
    const elTotal = document.getElementById('dash_total_func');
    const elLim = document.getElementById('limite_func');
    if (elTotal && elLim) elTotal.innerText = funcionarios.length + ' / ' + elLim.value;
    
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
        pizza.style.background = "conic-gradient(#dc2626 0% " + perc + "%, #16a34a " + perc + "% 100%)";
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
            containerPareto.innerHTML += '<div class="bar-wrapper"><div class="bar-native" style="height: ' + pct + '%">' + pct.toFixed(0) + '%</div><div class="bar-label">' + c + '</div></div>';
        });
    }
    const containerLinear = document.getElementById('nativeLinear');
    if (containerLinear) {
        containerLinear.innerHTML = '';
        const maxBruto = funcionarios.length > 0 ? Math.max(...funcionarios.map(f => f.salario)) : 1;
        funcionarios.slice(-4).forEach(f => {
            const pct = maxBruto > 0 ? (f.salario / maxBruto) * 100 : 0;
            containerLinear.innerHTML += '<div class="linear-row"><div class="linear-name">' + f.nome + '</div><div class="linear-bar-bg"><div class="linear-bar-fill" style="width: ' + pct + '%"></div></div><div class="linear-value" style="color:#1e3a8a">' + formatarMoeda(f.salario) + '</div></div>';
        });
    }
}


function renderizarTabela() {
    const corpo = document.getElementById('tabela_corpo');
    if (!corpo) return;
    corpo.innerHTML = '';
    funcionarios.forEach(f => {
        const dataFormatada = f.data_admissao ? f.data_admissao.split('-').reverse().join('/') : '---';
        const turnoRotulo = f.turno === 'noturno' ? '🌙 Noturno' : '☀️ Diurno';
        const jTexto = f.banco_horas > 0 ? f.horas_comp + 'h (+' + f.banco_horas + 'h BH)' : f.horas_comp + 'h';
        const deptoRotulo = f.departamento ? f.departamento : 'Administrativo';
        
        const tr = document.createElement('tr');
        tr.innerHTML = '<td><a id="lnk_' + f.id + '" style="cursor:pointer; color:var(--primary); text-decoration:underline;"><strong>' + f.nome + '</strong></a><br><small>Admissão: ' + dataFormatada + '</small></td><td>' + f.cargo + '<br><small style="color:#64748b">Dep: ' + deptoRotulo + '</small></td><td><small>Jornada: ' + jTexto + '</small><br><strong>' + turnoRotulo + '</strong></td><td style="color:#16a34a"><strong>' + formatarMoeda(f.liquido) + '</strong></td><td class="actions-cell"><a onclick="abrirContracheque(' + f.id + ')" class="btn-link">📄 Mensal</a><a onclick="abrirFerias(' + f.id + ')" class="btn-link" style="color:#16a34a">🌴 Férias</a><button class="btn-delete" style="background:#dc2626; color:white; border:none; padding:4px 6px; margin-right:4px; font-size:0.7rem;" onclick="dispararRescisaoImediata(' + f.id + ', \'demissao_sem_justa\')">⚠️ Sem Justa</button><button class="btn-delete" style="background:#f97316; color:white; border:none; padding:4px 6px; margin-right:4px; font-size:0.7rem;" onclick="dispararRescisaoImediata(' + f.id + ', \'pedido_demissao\')">🚪 Pedido</button><button class="btn-delete" style="padding:4px 6px; font-size:0.7rem;" onclick="deletarFuncionario(' + f.id + ')">Demitir</button></td>';
        corpo.appendChild(tr);

        document.getElementById('lnk_' + f.id)?.addEventListener('click', () => {
            carregarFuncionarioParaEdicao(f.id, f.nome, f.cargo, f.salario, f.horas_comp, f.regime_he, f.insalubridade, f.beneficios, f.qtd_filhos, f.observacoes, f.data_admissao, f.turno, f.hora_entrada, deptoRotulo);
        });
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


function abrirContracheque(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;
    const proventos = f.salario + (f.total_he_ganho || 0) + (f.insalubridade || 0) + (f.adicional_noturno || 0) + (f.beneficios || 0) + (f.salario_familia || 0);
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado!"); return; }

    let html = "<html><head><title>Holerite Oficial</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    html += "<div class='header-holerite' style='display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;'>";
    html += "  <div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem; font-family: Arial, sans-serif;'>📊TERADMAS📈</div>";
    html += "  <div style='text-align: left;'>";
    html += "    <h2 style='margin: 0; font-size: 1.3rem; letter-spacing: 1px; color: #1e3a8a; font-family: Arial, sans-serif;'>TERCEIRO ADM</h2>";
    html += "    <h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b; font-family: Arial, sans-serif; font-weight: 600;'>ASSOCIADOS</h3>";
    html += "  </div></div>";
    html += "<h2 style='text-align:center; font-size:1.2rem; margin: 15px 0 5px 0;'>RECIBO DE PAGAMENTO MENSAL</h2><hr>";
    html += "<div class='info-colaborador'><p><strong>Colaborador:</strong> " + f.nome + " | <strong>Cargo:</strong> " + f.cargo + "</p><p><strong>Mês de Referência:</strong> " + f.mes_ref + "</p></div>";
    html += "<h4 class='section-title proventos-title'>PROVENTOS (CRÉDITOS)</h4><table class='table-holerite'>";
    html += "<tr><td>(+) Salário Base</td><td class='text-right'>" + formatarMoeda(f.salario) + "</td></tr>";
    if (f.total_he_ganho > 0) html += "<tr><td>(+) Horas Extras Acumuladas</td><td class='text-right'>" + formatarMoeda(f.total_he_ganho) + "</td></tr>";
    if (f.insalubridade > 0) html += "<tr><td>(+) Adicional Insalubridade</td><td class='text-right'>" + formatarMoeda(f.insalubridade) + "</td></tr>";
    if (f.adicional_noturno > 0) html += "<tr><td>(+) Adicional Noturno</td><td class='text-right'>" + formatarMoeda(f.adicional_noturno) + "</td></tr>";
    if (f.beneficios > 0) html += "<tr><td>(+) Auxílios/Benefícios</td><td class='text-right'>" + formatarMoeda(f.beneficios) + "</td></tr>";
    html += "<tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(proventos) + "</td></tr></table>";
    html += "<h4 class='section-title descontos-title'>DESCONTOS (RETENÇÕES)</h4><table class='table-holerite'>";
    if (f.inss > 0) html += "<tr><td>(-) INSS Progressivo</td><td class='text-right'>" + formatarMoeda(f.inss) + "</td></tr>";
    if (f.irrf > 0) html += "<tr><td>(-) Imposto de Renda (IRRF)</td><td class='text-right'>" + formatarMoeda(f.irrf) + "</td></tr>";
    if (f.vt > 0) html += "<tr><td>(-) Vale Transporte (6%)</td><td class='text-right'>" + formatarMoeda(f.vt) + "</td></tr>";
    html += "<tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(f.total_descontos) + "</td></tr></table>";
    html += "<div class='liquido-box'><span class='liquido-label'>VALOR LÍQUIDO A RECEBER:</span><span class='liquido-value'>" + formatarMoeda(f.liquido) + "</span></div>";
    html += "<div class='assinatura-container'><div class='linha-assinatura'></div><p>Assinatura do Colaborador</p></div></div></body></html>";
    janela.document.write(html); janela.document.close();
}

function abrirFerias(id) {
    const f = funcionarios.find(emp => emp.id === id);
    if (!f) return;
    const base = f.salario + (f.insalubridade || 0);
    const terco = base / 3;
    const totalBruto = base + terco;
    const totalDescontos = totalBruto * 0.09;
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado!"); return; }

    let html = "<html><head><title>Recibo de Férias</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    html += "<div class='header-holerite' style='display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;'>";
    html += "  <div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem; font-family: Arial, sans-serif;'>📊TERADMAS📈</div>";
    html += "  <div style='text-align: left;'>";
    html += "    <h2 style='margin: 0; font-size: 1.3rem; letter-spacing: 1px; color: #1e3a8a; font-family: Arial, sans-serif;'>TERCEIRO ADM</h2>";
    html += "    <h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b; font-family: Arial, sans-serif; font-weight: 600;'>ASSOCIADOS</h3>";
    html += "  </div></div>";
    html += "<h2 style='text-align:center; font-size:1.2rem; margin: 15px 0 5px 0;'>RECIBO DE AVISO E GOZO DE FÉRIAS</h2><hr>";
    html += "<div class='info-colaborador'><p><strong>Colaborador:</strong> " + f.nome + " | <strong>Cargo:</strong> " + f.cargo + "</p></div>";
    html += "<h4 class='section-title proventos-title'>VERBAS REFEITAS (CRÉDITOS)</h4><table class='table-holerite'>";
    html += "<tr><td>(+) Valor Bruto das Férias (30 dias)</td><td class='text-right'>" + formatarMoeda(base) + "</td></tr>";
    html += "<tr><td>(+) Terço Constitucional de Férias (1/3)</td><td class='text-right'>" + formatarMoeda(terco) + "</td></tr>";
    html += "<tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(totalBruto) + "</td></tr></table>";
    html += "<h4 class='section-title descontos-title'>DEDUÇÕES LEGAIS</h4><table class='table-holerite'>";
    html += "<tr><td>(-) Retenções Previdenciárias/Fiscais</td><td class='text-right'>" + formatarMoeda(totalDescontos) + "</td></tr>";
    html += "<tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(totalDescontos) + "</td></tr></table>";
    html += "<div class='liquido-box'><span class='liquido-label'>VALOR LÍQUIDO DAS FÉRIAS:</span><span class='liquido-value'>" + formatarMoeda(totalBruto - totalDescontos) + "</span></div>";
    html += "<div class='assinatura-container'><div class='linha-assinatura'></div><p>Assinatura do Colaborador</p></div></div></body></html>";
    janela.document.write(html); janela.document.close();
}




async function emitirRescisaoExecutiva(f, tipo) {
    let liq = f.salario * 1.4; let proventos = f.salario * 1.5; let descontos = f.salario * 0.1;
    try {
        const resposta = await fetch('/api/rescisao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salario: f.salario, admissao: f.data_admissao, tipoRescisao: tipo }) });
        const r = await resposta.json(); liq = r.liquido; proventos = r.totalProventos; descontos = proventos - liq;
    } catch(e) {}
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado!"); return; }

    let htmlRescisao = "<html><head><title>Rescisão Contratual</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    htmlRescisao += "<div class='header-holerite' style='display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;'>";
    htmlRescisao += "  <div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem; font-family: Arial, sans-serif;'>📊TERADMAS📈</div>";
    htmlRescisao += "  <div style='text-align: left;'>";
    htmlRescisao += "    <h2 style='margin: 0; font-size: 1.3rem; letter-spacing: 1px; color: #1e3a8a; font-family: Arial, sans-serif;'>TERCEIRO ADM</h2>";
    htmlRescisao += "    <h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b; font-family: Arial, sans-serif; font-weight: 600;'>ASSOCIADOS</h3>";
    htmlRescisao += "  </div></div>";
    htmlRescisao += "<h2 style='text-align:center; font-size:1.2rem; margin: 15px 0 5px 0;'>TERMO DE RESCISÃO CONTRATUAL</h2><hr>";
    htmlRescisao += "<div class='info-colaborador'><p><strong>Colaborador:</strong> " + f.nome + "</p><p><strong>Causa do Afastamento:</strong> " + (tipo === 'pedido_demissao' ? 'Pedido de Demissão' : 'Dispensa sem Justa Causa') + "</p></div>";
    htmlRescisao += "<h4 class='section-title proventos-title'>VERBAS RESCISÓRIAS (CRÉDITOS)</h4><table class='table-holerite'>";
    htmlRescisao += "<tr><td>(+) Saldo de Salário e Reflexos Proporcionais</td><td class='text-right'>" + formatarMoeda(proventos) + "</td></tr>";
    htmlRescisao += "<tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(proventos) + "</td></tr></table>";
    htmlRescisao += "<h4 class='section-title descontos-title'>DEDUÇÕES E DESCONTOS</h4><table class='table-holerite'>";
    htmlRescisao += "<tr><td>(-) Deduções Legais / Aviso Prévio</td><td class='text-right'>" + formatarMoeda(descontos) + "</td></tr>";
    htmlRescisao += "<tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(descontos) + "</td></tr></table>";
    htmlRescisao += "<div class='liquido-box'><span class='liquido-label'>VALOR LÍQUIDO DA QUITAÇÃO:</span><span class='liquido-value'>" + formatarMoeda(liq) + "</span></div>";
    htmlRescisao += "<div class='assinatura-container'><div class='linha-assinatura'></div><p>Quitação do Contrato de Trabalho</p></div></div></body></html>";
    janela.document.write(htmlRescisao); janela.document.close();
}

function abrirDecimoTerceiroGeral() {
    if (funcionarios.length === 0) { alert("Nenhum funcionário ativo."); return; }
    let totalProventos = 0; funcionarios.forEach(f => { totalProventos += f.salario; });
    let totalDescontos = totalProventos * 0.09;
    const janela = window.open('', '_blank', 'width=800,height=900');
    if (!janela) { alert("Pop-up bloqueado!"); return; }

    let html13 = "<html><head><title>Folha de 13º</title><style>" + obterEstiloHolerite() + "</style></head><body><div class='holerite-box'>";
    html13 += "<div class='header-holerite' style='display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;'>";
    html13 += "  <div style='padding: 0 10px; height: 45px; background: #1e3a8a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.1rem; font-family: Arial, sans-serif;'>📊TERADMAS📈</div>";
    html13 += "  <div style='text-align: left;'>";
    html13 += "    <h2 style='margin: 0; font-size: 1.3rem; letter-spacing: 1px; color: #1e3a8a; font-family: Arial, sans-serif;'>TERCEIRO ADM</h2>";
    html13 += "    <h3 style='margin: 2px 0 0 0; font-size: 0.9rem; color: #64748b; font-family: Arial, sans-serif; font-weight: 600;'>ASSOCIADOS</h3>";
    html13 += "  </div></div>";
    html13 += "<h2 style='text-align:center; font-size:1.2rem; margin: 15px 0 5px 0;'>FOLHA DE DÉCIMO TERCEIRO SALÁRIO INTEGRAL</h2><hr>";
    html13 += "<h4 class='section-title proventos-title'>CRÉDITOS DA FOLHA INTEGRAL</h4><table class='table-holerite'>";
    html13 += "<tr><td>(+) Valor Bruto Global Prorrogado</td><td class='text-right'>" + formatarMoeda(totalProventos) + "</td></tr>";
    html13 += "<tr class='row-total'><td>TOTAL PROVENTOS:</td><td class='text-right'>" + formatarMoeda(totalProventos) + "</td></tr></table>";
    html13 += "<h4 class='section-title descontos-title'>RETENÇÕES COMPENSATÓRIAS</h4><table class='table-holerite'>";
    html13 += "<tr><td>(-) Descontos Previdenciários Globais</td><td class='text-right'>" + formatarMoeda(totalDescontos) + "</td></tr>";
    html13 += "<tr class='row-total'><td>TOTAL DESCONTOS:</td><td class='text-right'>" + formatarMoeda(totalDescontos) + "</td></tr></table>";
    html13 += "<div class='liquido-box'><span class='liquido-label'>TOTAL LÍQUIDO GERAL A PAGAR:</span><span class='liquido-value'>" + formatarMoeda(totalProventos - totalDescontos) + "</span></div>";
    html13 += "<div class='assinatura-container'><div class='linha-assinatura'></div><p>Assinatura de Fechamento de Exercício</p></div></div></body></html>";
    janela.document.write(html13); janela.document.close();
}

async function deletarFuncionario(id) {
    if (!confirm("Tem certeza que deseja remover este registro do sistema?")) return;
    try { await fetch(`/api/funcionarios/${id}`, { method: 'DELETE' }); } catch(e) {}
    await carregarDadosBanco();
}

function obterEstiloHolerite() {
    return `
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; background: #fff; color: #000; }
        .holerite-box { border: 2px solid #000; padding: 30px; max-width: 700px; margin: 0 auto; background: #fff; }
        .header-holerite { text-align: center; margin-bottom: 10px; }
        hr { border: 0; border-top: 1px solid #000; margin: 15px 0; }
        .info-colaborador p { margin: 6px 0; font-size: 0.95rem; }
        .section-title { font-size: 1rem; margin: 25px 0 8px 0; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 3px; }
        .proventos-title { color: #1e3a8a; } .descontos-title { color: #dc2626; }
        .table-holerite { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 0.95rem; }
        .table-holerite td { padding: 6px 0; } .text-right { text-align: right; font-weight: bold; }
        .row-total td { font-weight: bold; padding-top: 12px; border-top: 1px solid #000; }
        .liquido-box { border: 2px solid #000; margin-top: 35px; padding: 15px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
        .liquido-label { font-weight: bold; font-size: 1.1rem; } .liquido-value { font-weight: bold; font-size: 1.2rem; color: #16a34a; }
        .assinatura-container { margin-top: 60px; text-align: center; } .linha-assinatura { width: 60%; border-bottom: 1px solid #000; margin: 0 auto 8px auto; }
    `;
}

