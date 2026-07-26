from flask import Flask, render_template, request, jsonify
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)
DB_FILE = 'folha_v4.db'  # Banco atualizado para suportar os novos campos

def iniciar_banco():
    conexao = sqlite3.connect(DB_FILE)
    cursor = conexao.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS funcionarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL, cargo TEXT, salario REAL, horas_comp REAL, insalubridade REAL,
            beneficios REAL, qtd_filhos INTEGER, observacoes TEXT, data_admissao TEXT, mes_ref TEXT,
            v_he_semana REAL, v_he_sabado REAL, v_he_domingo REAL, total_he_ganho REAL,
            reflexo_13_ferias REAL, salario_familia REAL, inss REAL, irrf REAL, vt REAL,
            adiantamento_valor REAL, total_descontos REAL, liquido REAL,
            banco_horas REAL, turno TEXT, hora_entrada TEXT, adicional_noturno REAL, regime_he TEXT,
            departamento TEXT,
            plano_saude REAL DEFAULT 0, plano_odontologico REAL DEFAULT 0, 
            sindicato REAL DEFAULT 0, vale_farmacia REAL DEFAULT 0, ano_ref TEXT DEFAULT '2026'
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cargos_custom (
            id INTEGER PRIMARY KEY AUTOINCREMENT, nome_cargo TEXT UNIQUE
        )
    ''')
    cursor.execute("SELECT COUNT(*) FROM cargos_custom")
    if cursor.fetchone() == 0:
        cargos = [("Diretoria",), ("Gerência",), ("Analista",), ("Operacional",)]
        cursor.executemany("INSERT INTO cargos_custom (nome_cargo) VALUES (?)", cargos)
    conexao.commit()
    conexao.close()

def calcular_inss(salario_contribuicao):
    if salario_contribuicao <= 1412: return salario_contribuicao * 0.075
    if salario_contribuicao <= 2666.68: return (salario_contribuicao * 0.09) - 21.18
    if salario_contribuicao <= 4000.03: return (salario_contribuicao * 0.12) - 101.18
    if salario_contribuicao <= 7786.02: return (salario_contribuicao * 0.14) - 181.18
    return 908.86

def calcular_irrf(salario_contribuicao, desconto_inss):
    base = salario_contribuicao - desconto_inss
    if base <= 2259.20: return 0
    if base <= 2826.65: return (base * 0.075) - 169.44
    if base <= 3751.05: return (base * 0.15) - 381.44
    if base <= 4664.68: return (base * 0.225) - 662.77
    return (base * 0.275) - 896.00

# Inicializa o banco de dados antes do servidor subir
iniciar_banco()
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cargos', methods=['GET', 'POST'])
def gerenciar_cargos():
    conexao = sqlite3.connect(DB_FILE)
    cursor = conexao.cursor()
    if request.method == 'POST':
        dados = request.json
        novo = dados.get('nome_cargo', '').strip()
        if novo:
            try:
                cursor.execute('INSERT INTO cargos_custom (nome_cargo) VALUES (?)', (novo,))
                conexao.commit()
            except sqlite3.IntegrityError: pass
        conexao.close()
        return jsonify({'status': 'sucesso'})
    else:
        cursor.execute('SELECT nome_cargo FROM cargos_custom ORDER BY nome_cargo')
        cargos = [linha[0] for linha in cursor.fetchall()]
        conexao.close()
        return jsonify(cargos)

@app.route('/api/funcionarios', methods=['GET'])
def listar_funcionarios():
    conexao = sqlite3.connect(DB_FILE)
    conexao.row_factory = sqlite3.Row
    cursor = conexao.cursor()
    cursor.execute('SELECT * FROM funcionarios')
    linhas = cursor.fetchall()
    conexao.close()
    return jsonify([dict(linha) for linha in linhas])

@app.route('/api/funcionarios/<int:id_func>', methods=['DELETE'])
def demitir_funcionario(id_func):
    conexao = sqlite3.connect(DB_FILE)
    cursor = conexao.cursor()
    cursor.execute('DELETE FROM funcionarios WHERE id = ?', (id_func,))
    conexao.commit()
    conexao.close()
    return jsonify({'status': 'removido'})
@app.route('/api/calcular', methods=['POST'])
def calcular_e_salvar():
    dados = request.json
    id_func = dados.get('id')
    salario_base = float(dados.get('salario', 0))
    horas_comp = float(dados.get('horasComp', 220)) or 220
    beneficios = float(dados.get('beneficios', 0))
    insalubridade = float(dados.get('insalubridade', 0))
    qtd_filhos = int(dados.get('qtdFilhos', 0))
    nome = dados.get('nome', '').strip()
    cargo = dados.get('cargo', '')
    observacoes = dados.get('observacoes', '')
    data_admissao = dados.get('dataAdmissao', '')
    mes_ref = dados.get('mesRef', '7')
    ano_ref = dados.get('anoRef', '2026')
    turno = dados.get('turno', 'diurno')
    hora_entrada = dados.get('horaEntrada', '08:00')
    regime_he = dados.get('regimeHe', 'pagar')
    departamento = dados.get('departamento', 'Administrativo')
    
    he_semana = float(dados.get('heSemana', 0))
    he_sabado = float(dados.get('heSabado', 0))
    he_domingo = float(dados.get('heDomingo', 0))
    sindicato = float(dados.get('sindicato', 0))
    plano_saude = float(dados.get('planoSaude', 0))
    plano_odonto = float(dados.get('planoOdonto', 0))
    vale_farmacia = float(dados.get('valeFarmacia', 0))
    aplicar_adiantamento = dados.get('adiantamento', 'nao') == 'sim'
    descontar_vt = dados.get('vt', 'nao') == 'sim'
    
    # Validação automática da Data de Admissão em relação à folha corrente
    if data_admissao and mes_ref and ano_ref:
        try:
            adm_dt = datetime.strptime(data_admissao, "%Y-%m-%d")
            ref_dt = datetime(int(ano_ref), int(mes_ref), 1)
            if ref_dt < datetime(adm_dt.year, adm_dt.month, 1):
                return jsonify({'status': 'erro', 'message': 'Referência anterior à admissão!'}), 400
        except Exception: pass

    valor_hora = salario_base / horas_comp
    adicional_noturno = salario_base * 0.20 if turno == 'noturno' else 0
    
    v_he_semana = he_semana * (valor_hora * 1.25)
    v_he_sabado = he_sabado * (valor_hora * 1.50)
    v_he_domingo = he_domingo * (valor_hora * 2.00)
    
    banco_horas = 0
    if regime_he == 'pagar':
        total_he_ganho = v_he_semana + v_he_sabado + v_he_domingo
        reflexo_13_ferias = total_he_ganho * (2.0 / 12.0)
    else:
        banco_horas = he_semana + he_sabado + he_domingo
        total_he_ganho, reflexo_13_ferias, v_he_semana, v_he_sabado, v_he_domingo = 0, 0, 0, 0, 0
        
    total_salario_familia = qtd_filhos * 62.04 if (salario_base + adicional_noturno) <= 1819.26 and qtd_filhos > 0 else 0
    salario_contribuicao = salario_base + total_he_ganho + insalubridade + reflexo_13_ferias + adicional_noturno
    inss = calcular_inss(salario_contribuicao)
    irrf = calcular_irrf(salario_contribuicao, inss)
    vt = salario_base * 0.06 if descontar_vt else 0
    
    proventos_totais = salario_base + beneficios + total_he_ganho + insalubridade + reflexo_13_ferias + total_salario_familia + adicional_noturno
    descontos_totais = inss + irrf + vt + sindicato + plano_saude + plano_odonto + vale_farmacia
    valor_adiantamento = (proventos_totais - descontos_totais) * 0.40 if aplicar_adiantamento else 0
    total_descontos_final = descontos_totais + valor_adiantamento
    liquido_final = proventos_totais - total_descontos_final
    conexao = sqlite3.connect(DB_FILE)
    cursor = conexao.cursor()
    if id_func:
        cursor.execute('''
            UPDATE funcionarios SET nome=?, cargo=?, salario=?, horas_comp=?, insalubridade=?, beneficios=?, qtd_filhos=?, 
            observacoes=?, data_admissao=?, mes_ref=?, v_he_semana=?, v_he_sabado=?, v_he_domingo=?, total_he_ganho=?, 
            reflexo_13_ferias=?, salario_familia=?, inss=?, irrf=?, vt=?, adiantamento_valor=?, total_descontos=?, liquido=?,
            banco_horas=?, turno=?, hora_entrada=?, adicional_noturno=?, regime_he=?, departamento=?,
            plano_saude=?, plano_odontologico=?, sindicato=?, vale_farmacia=?, ano_ref=? WHERE id=?
        ''', (nome, cargo, salario_base, horas_comp, insalubridade, beneficios, qtd_filhos, observacoes, data_admissao, mes_ref, 
              v_he_semana, v_he_sabado, v_he_domingo, total_he_ganho, reflexo_13_ferias, total_salario_familia, inss, irrf, vt, 
              valor_adiantamento, total_descontos_final, liquido_final, banco_horas, turno, hora_entrada, adicional_noturno, regime_he, departamento,
              plano_saude, plano_odonto, sindicato, vale_farmacia, ano_ref, id_func))
    else:
        cursor.execute('''
            INSERT INTO funcionarios (nome, cargo, salario, horas_comp, insalubridade, beneficios, qtd_filhos, 
            observacoes, data_admissao, mes_ref, v_he_semana, v_he_sabado, v_he_domingo, total_he_ganho, 
            reflexo_13_ferias, salario_familia, inss, irrf, vt, adiantamento_valor, total_descontos, liquido,
            banco_horas, turno, hora_entrada, adicional_noturno, regime_he, departamento,
            plano_saude, plano_odontologico, sindicato, vale_farmacia, ano_ref)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (nome, cargo, salario_base, horas_comp, insalubridade, beneficios, qtd_filhos, observacoes, data_admissao, mes_ref, 
              v_he_semana, v_he_sabado, v_he_domingo, total_he_ganho, reflexo_13_ferias, total_salario_familia, inss, irrf, vt, 
              valor_adiantamento, total_descontos_final, liquido_final, banco_horas, turno, hora_entrada, adicional_noturno, regime_he, departamento,
              plano_saude, plano_odonto, sindicato, vale_farmacia, ano_ref))
    conexao.commit()
    conexao.close()
    return jsonify({'status': 'sucesso'})

if __name__ == '__main__':
    # Configurado para rodar localmente na porta 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
