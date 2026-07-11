/**
 * BANCO DE DADOS DE CURSOS (Parametrizado conforme planilhas institucionais)
 * Baseado em: Custo Semestral Base / Horas Matriz Semestre
 */
const cursos = {
    odontologia: {
        nome: "Odontologia",
        mensalidade: 5044.11, // Valor Integral como base
        horasSemestre: 400,   // Horas padrão do semestre
        bolsaIncentivo: 40.0, // 0.4 na planilha (40%)
        pontualidade: 10.0    // 10% padrão de DP
    },
    enfermagem: {
        nome: "Enfermagem",
        mensalidade: 3500.00,
        horasSemestre: 400,
        bolsaIncentivo: 30.0,
        pontualidade: 10.0
    },
    fonoaudiologia: {
        nome: "Fonoaudiologia",
        mensalidade: 3800.00,
        horasSemestre: 360,
        bolsaIncentivo: 20.0,
        pontualidade: 10.0
    },
    psicologia: {
        nome: "Psicologia",
        mensalidade: 4100.00,
        horasSemestre: 400,
        bolsaIncentivo: 25.0,
        pontualidade: 10.0
    },
    medicinaVeterinaria: {
        nome: "Medicina Veterinária",
        mensalidade: 5800.00,
        horasSemestre: 440,
        bolsaIncentivo: 15.0,
        pontualidade: 10.0
    },
    nutricao: {
        nome: "Nutrição",
        mensalidade: 3200.00,
        horasSemestre: 380,
        bolsaIncentivo: 30.0,
        pontualidade: 10.0
    }
};

// Captura de Elementos do DOM
const selectCurso = document.getElementById('selectCurso');
const inputMensalidadeIntegral = document.getElementById('mensalidadeIntegral');
const inputChTotalCurso = document.getElementById('chTotalCurso');
const inputBolsaIncentivo = document.getElementById('bolsaIncentivo');
const inputChDisciplina = document.getElementById('chDisciplina');
const selectBolsaParceira = document.getElementById('selectBolsaParceira');
const inputDescontoPontualidade = document.getElementById('descontoPontualidade');
const inputQtdParcelas = document.getElementById('qtdParcelas');

// Botões e Visuais
const btnCalcular = document.getElementById('btnCalcular');
const btnLimpar = document.getElementById('btnLimpar');
const btnImprimir = document.getElementById('btnImprimir');
const btnPDF = document.getElementById('btnPDF');
const btnExcel = document.getElementById('btnExcel');
const cardResultado = document.getElementById('cardResultado');
const badgeStatus = document.getElementById('badgeStatus');
const spinnerLoading = document.getElementById('spinnerLoading');
const iconCalcular = document.getElementById('iconCalcular');

// Elementos do Painel de Saída
const resCurso = document.getElementById('resCurso');
const resMensalidadeBase = document.getElementById('resMensalidadeBase');
const resValorHora = document.getElementById('resValorHora');
const resHoraComBI = document.getElementById('resHoraComBI');
const resHorasCursar = document.getElementById('resHorasCursar');
const resSubtotalBI = document.getElementById('resSubtotalBI');
const resDescontoParceira = document.getElementById('resDescontoParceira');
const resValorDP = document.getElementById('resValorDP');
const resVlLiquido = document.getElementById('resVlLiquido');
const resNumParcelas = document.getElementById('resNumParcelas');
const resValorPorParcela = document.getElementById('resValorPorParcela');

document.addEventListener('DOMContentLoaded', () => {
    selectCurso.addEventListener('change', carregarDadosCurso);
    btnCalcular.addEventListener('click', iniciarFluxoCalculo);
    btnLimpar.addEventListener('click', limparFormulario);
    btnImprimir.addEventListener('click', () => window.print());
    btnPDF.addEventListener('click', exportarPDF);
    btnExcel.addEventListener('click', exportarExcel);

    // Ouvinte em tempo real para recálculo automático se mudar dados na tela
    const inputsRealtime = [inputMensalidadeIntegral, inputChTotalCurso, inputBolsaIncentivo, inputChDisciplina, selectBolsaParceira, inputDescontoPontualidade, inputQtdParcelas];
    inputsRealtime.forEach(input => {
        input.addEventListener('input', () => {
            if (formCalculadora.checkValidity()) calcularDiferenciais();
        });
    });
});

/**
 * Alimenta o formulário com as constantes do curso selecionado
 */
function carregarDadosCurso() {
    const dados = cursos[selectCurso.value];
    if (!dados) return;

    inputMensalidadeIntegral.value = dados.mensalidade;
    inputChTotalCurso.value = dados.horasSemestre;
    inputBolsaIncentivo.value = dados.bolsaIncentivo;
    inputDescontoPontualidade.value = dados.pontualidade;
    
    // Libera os campos para edição livre
    [inputMensalidadeIntegral, inputChTotalCurso, inputBolsaIncentivo, inputChDisciplina, selectBolsaParceira, inputDescontoPontualidade, inputQtdParcelas, btnCalcular].forEach(el => el.disabled = false);

    resetarPainelVisual();
    inputChDisciplina.focus();
}

/**
 * Aciona o feedback de loading exigido
 */
function iniciarFluxoCalculo() {
    if (!formCalculadora.checkValidity()) {
        formCalculadora.classList.add('was-validated');
        return;
    }
    formCalculadora.classList.remove('was-validated');

    spinnerLoading.classList.remove('d-none');
    iconCalcular.classList.add('d-none');
    btnCalcular.disabled = true;

    setTimeout(() => {
        calcularDiferenciais();
        
        spinnerLoading.classList.add('d-none');
        iconCalcular.classList.remove('d-none');
        btnCalcular.disabled = false;

        cardResultado.classList.add('ativo');
        cardResultado.classList.remove('opacity-75');
        badgeStatus.textContent = "Calculado";
        badgeStatus.className = "badge bg-success px-2 py-1";
        [btnImprimir, btnPDF, btnExcel].forEach(btn => btn.disabled = false);
    }, 400);
}

/**
 * MOTOR DE REGRA DE TRÊS PROPORCIONAL DA PLANILHA
 */
function calcularDiferenciais() {
    const vM_Base = parseFloat(inputMensalidadeIntegral.value) || 0;
    const h_Semestre = parseFloat(inputChTotalCurso.value) || 1; 
    const p_BI = parseFloat(inputBolsaIncentivo.value) || 0;
    const h_A_Cursar = parseFloat(inputChDisciplina.value) || 0;
    const p_Parceira = parseFloat(selectBolsaParceira.value) || 0;
    const p_DP = parseFloat(inputDescontoPontualidade.value) || 0;
    const n_Parcelas = parseInt(inputQtdParcelas.value) || 1;

    // 1. Vl. Hora Aula (Regra de três com base na Mensalidade Integral)
    const vlHoraAula = vM_Base / h_Semestre;

    // 2. Hr Aula Com B.I
    const hrAulaComBI = vlHoraAula * (1 - (p_BI / 100));

    // 3. Valor Subtotal com B.I baseado nas Horas a Cursar informadas
    const subtotalBI = hrAulaComBI * h_A_Cursar;

    // 4. Desconto Bolsa Parceira (15% ou 60% aplicado sobre o subtotal com B.I)
    const descontoParceira = subtotalBI * (p_Parceira / 100);
    const subtotalAposParceira = subtotalBI - descontoParceira;

    // 5. Valor DP (Desconto Pontualidade aplicado após a dedução da parceira)
    const valorDP = subtotalAposParceira * (p_DP / 100);

    // 6. Valor Líquido Final do período
    const vlLiquido = subtotalAposParceira - valorDP;

    // 7. Valor por Parcela
    const vlPorParcela = vlLiquido / n_Parcelas;

    // Renderização na Tela
    resCurso.textContent = selectCurso.options[selectCurso.selectedIndex].text;
    resMensalidadeBase.textContent = formatarMoeda(vM_Base);
    resValorHora.textContent = formatarMoeda(vlHoraAula) + " /h";
    resHoraComBI.textContent = formatarMoeda(hrAulaComBI) + " /h";
    resHorasCursar.textContent = h_A_Cursar + " hrs";
    resSubtotalBI.textContent = formatarMoeda(subtotalBI);
    resDescontoParceira.textContent = `-${formatarMoeda(descontoParceira)} (${p_Parceira}%)`;
    resValorDP.textContent = `-${formatarMoeda(valorDP)} (${p_DP}%)`;
    resVlLiquido.textContent = formatarMoeda(vlLiquido);
    resNumParcelas.textContent = n_Parcelas;
    resValorPorParcela.textContent = formatarMoeda(vlPorParcela);
}

function formatarMoeda(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function resetarPainelVisual() {
    cardResultado.classList.remove('ativo');
    cardResultado.classList.add('opacity-75');
    badgeStatus.textContent = "Aguardando Parâmetros";
    badgeStatus.className = "badge bg-secondary-subtle text-secondary px-2 py-1";
    [resCurso, resMensalidadeBase, resValorHora, resHoraComBI, resHorasCursar, resSubtotalBI, resDescontoParceira, resValorDP, resVlLiquido, resNumParcelas, resValorPorParcela].forEach(el => el.textContent = "-");
    [btnImprimir, btnPDF, btnExcel].forEach(btn => btn.disabled = true);
}

function limparFormulario() {
    formCalculadora.reset();
    formCalculadora.classList.remove('was-validated');
    [inputMensalidadeIntegral, inputChTotalCurso, inputBolsaIncentivo, inputChDisciplina, selectBolsaParceira, inputDescontoPontualidade, inputQtdParcelas, btnCalcular].forEach(el => el.disabled = true);
    resetarPainelVisual();
}

function exportarPDF() {
    const element = document.getElementById('areaImpressao');
    const nome = selectCurso.options[selectCurso.selectedIndex].text;
    html2pdf().set({
        margin: 12,
        filename: `Calculo_Academico_${nome}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
}

function exportarExcel() {
    const nome = selectCurso.options[selectCurso.selectedIndex].text;
    const dados = [
        ["Relatório de Mensalidade Acadêmica por Disciplina"],
        [],
        ["Curso", nome],
        ["Mensalidade Integral Base", resMensalidadeBase.textContent],
        ["Carga Horária Matriz Semestre", inputChTotalCurso.value + " horas"],
        ["Valor Unitário da Hora Aula", resValorHora.textContent],
        ["Valor Hora com Bolsa Incentivo (B.I)", resHoraComBI.textContent],
        ["Horas a Cursar Digitadas", resHorasCursar.textContent],
        ["Subtotal Bruto com B.I", resSubtotalBI.textContent],
        ["Dedução Bolsa Parceira", resDescontoParceira.textContent],
        ["Valor Desconto de Pontualidade (DP)", resValorDP.textContent],
        ["Valor Líquido Total do Período", resVlLiquido.textContent],
        ["Número de Parcelas de Rateio", resNumParcelas.textContent],
        ["Valor Final por Parcela", resValorPorParcela.textContent]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch: 38 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, "Cálculo");
    XLSX.writeFile(wb, `Planilha_Calculo_${nome}.xlsx`);
}
