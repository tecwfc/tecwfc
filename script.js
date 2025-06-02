// =================== TOAST (Notificações) ===================
function mostrarToast(mensagem, tipo = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeout 0.4s forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// =================== DADOS E CONFIGURAÇÕES ===================
let funcionarios = JSON.parse(localStorage.getItem('funcionarios')) || [];

let escala = JSON.parse(localStorage.getItem('escala')) || {};

const status = ["T", "Fol", "Fér"];

// =================== ELEMENTOS HTML ===================
const calendarioDiv = document.getElementById('calendario');
const inputMes = document.getElementById('mes');
const btnGerar = document.getElementById('btnGerar');
const btnReset = document.getElementById('btnReset');
const btnImprimir = document.getElementById('btnImprimir');
const btnAdicionarFuncionario = document.getElementById('btnAdicionarFuncionario');
const inputNovoFuncionario = document.getElementById('novoFuncionario');

// =================== EVENTOS ===================
btnGerar.addEventListener('click', () => {
  gerarCalendario();
  mostrarToast("Escala gerada com sucesso!", "success");
});
btnReset.addEventListener('click', resetarEscala);
btnImprimir.addEventListener('click', () => window.print());
btnAdicionarFuncionario.addEventListener('click', adicionarFuncionario);

// =================== GERAR CALENDÁRIO ===================
function gerarCalendario() {
  const mesInput = inputMes.value;
  if (!mesInput) {
    mostrarToast("Selecione um mês!", "error");
    return;
  }

  const [ano, mes] = mesInput.split('-').map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`;

  if (!escala[chaveMes]) escala[chaveMes] = {};

  // Alterado: agora usa apenas a primeira letra do nome do dia
  const diasDaSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  let tabela = `<table class="tabela"><thead><tr><th>Funcionário</th>`;

  // Cabeçalho dos dias
  for (let d = 1; d <= diasNoMes; d++) {
    const data = new Date(ano, mes - 1, d);
    const nomeDia = diasDaSemana[data.getDay()];
    const classeDia = data.getDay() === 0 ? 'domingo' : data.getDay() === 6 ? 'sabado' : '';
    tabela += `<th class="${classeDia}">${nomeDia}<br>${d}</th>`;
  }

  tabela += `</tr></thead><tbody>`;

  funcionarios.forEach((funcionario, index) => {
    tabela += gerarLinhaFuncionario(funcionario, diasNoMes, chaveMes, index);
  });

  tabela += `</tbody></table>`;
  calendarioDiv.innerHTML = tabela;
}

// =================== GERAR LINHA DE FUNCIONÁRIO ===================
function gerarLinhaFuncionario(funcionario, diasNoMes, chaveMes, index) {
  if (!escala[chaveMes][funcionario]) {
    escala[chaveMes][funcionario] = Array(diasNoMes).fill("T");
  }

  const folgasCount = escala[chaveMes][funcionario].filter(e => e === "Fol").length;
  const nomeComFolgas = `${funcionario} (${folgasCount})`;

  let linha = `<tr><th>
    <div class="funcionario-cell" style="display:flex; align-items:center; gap:8px;">
      <button class="btn-ferias" ondblclick="marcarFeriasParaFuncionario(${index})"
        style="font-size:0.75em; padding: 2px 6px; background:#4CAF50; color:#fff; border:none; border-radius:3px; cursor:pointer;">
        F
      </button>
      <span>${nomeComFolgas}</span>
      <button class="btn-deletar" onclick="removerFuncionario(${index})"
        style="margin-left:auto; background:none; border:none; cursor:pointer; color:#900;">
        ❌
      </button>
    </div>
  </th>`;

  for (let d = 0; d < diasNoMes; d++) {
    const valor = escala[chaveMes][funcionario][d] || "T";
    const classeStatus = getClasse(valor);
    const data = new Date(parseInt(chaveMes.split('-')[0]), parseInt(chaveMes.split('-')[1]) - 1, d + 1);
    const classeDia = data.getDay() === 0 ? 'domingo' : data.getDay() === 6 ? 'sabado' : '';
    linha += `<td class="${classeStatus} ${classeDia}" 
      onclick="alterarStatus(this, '${chaveMes}', '${funcionario}', ${d})"
      ondblclick="definirTrabalhando(this, '${chaveMes}', '${funcionario}', ${d})">
      ${valor}
    </td>`;
  }

  linha += `</tr>`;
  return linha;
}

// =================== OBTÉM CLASSE DE STATUS ===================
function getClasse(valor) {
  if (valor === "T") return "t";
  if (valor === "Fol") return "fol";
  if (valor === "Fér") return "fer";
  return "";
}

// =================== ALTERAR STATUS DO DIA ===================
function alterarStatus(celula, chaveMes, funcionario, dia) {
  const ordem = ["T", "Fol", "Fér"];
  const atual = escala[chaveMes][funcionario][dia] || "T";
  const index = ordem.indexOf(atual);
  const proximo = ordem[(index + 1) % ordem.length];

  escala[chaveMes][funcionario][dia] = proximo;
  mostrarToast(`Dia ${dia + 1} alterado para "${proximo}" para ${funcionario}`, "info");
  salvarDados();
  gerarCalendario();
}

// =================== DEFINIR COMO TRABALHANDO COM DOBLE CLICK ===================
function definirTrabalhando(celula, chaveMes, funcionario, dia) {
  escala[chaveMes][funcionario][dia] = "T";
  mostrarToast(`Dia ${dia + 1} definido como "T" (Trabalhando) para ${funcionario}`, "info");
  salvarDados();
  gerarCalendario();
}

// =================== MARCAR FÉRIAS ===================
const estadosAnteriores = {};

function marcarFeriasParaFuncionario(index) {
  const mesInput = inputMes.value;
  if (!mesInput) {
    mostrarToast("Selecione um mês antes de marcar férias!", "error");
    return;
  }

  const funcionario = funcionarios[index];
  const [ano, mes] = mesInput.split('-').map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const chaveMes = `${ano}-${String(mes).padStart(2, '0')}`;

  if (!escala[chaveMes]) escala[chaveMes] = {};

  const chaveEstado = `${chaveMes}_${funcionario}`;
  const escalaAtual = escala[chaveMes][funcionario] || Array(diasNoMes).fill("T");
  const todasFerias = escalaAtual.every(status => status === "Fér");

  if (todasFerias) {
    if (estadosAnteriores[chaveEstado]) {
      escala[chaveMes][funcionario] = estadosAnteriores[chaveEstado];
      delete estadosAnteriores[chaveEstado];
      mostrarToast(`Férias desmarcadas para ${funcionario}`, "info");
    } else {
      escala[chaveMes][funcionario] = Array(diasNoMes).fill("T");
      mostrarToast(`Férias desmarcadas para ${funcionario}`, "info");
    }
  } else {
    estadosAnteriores[chaveEstado] = [...escalaAtual];
    escala[chaveMes][funcionario] = Array(diasNoMes).fill("Fér");
    mostrarToast(`Férias marcadas para ${funcionario}`, "success");
  }

  salvarDados();
  gerarCalendario();
}

// =================== ADICIONAR FUNCIONÁRIO ===================
function adicionarFuncionario() {
  const nome = inputNovoFuncionario.value.trim();
  if (!nome) {
    mostrarToast("Informe o nome do funcionário!", "error");
    return;
  }

  if (funcionarios.includes(nome)) {
    mostrarToast("Funcionário já existe!", "error");
    return;
  }

  funcionarios.push(nome);
  salvarDados();
  gerarCalendario();
   inputNovoFuncionario.value = '';

   inputNovoFuncionario.focus();
  mostrarToast("Funcionário adicionado!", "success");
}

// =================== REMOVER FUNCIONÁRIO ===================
window.removerFuncionario = function (index) {
  const nome = funcionarios[index];
  const senhaCorreta = "1234";

  const senha = prompt(`Digite a senha para excluir "${nome}":`);

  if (senha === senhaCorreta) {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      for (const mes in escala) {
        if (escala[mes][nome]) {
          delete escala[mes][nome];
        }
      }
      funcionarios.splice(index, 1);
      salvarDados();
      gerarCalendario();
      mostrarToast("Funcionário removido!", "success");
    }
  } else {
    mostrarToast("Senha incorreta. Exclusão cancelada.", "error");
  }
};

// =================== SALVAR NO LOCALSTORAGE ===================
function salvarDados() {
  localStorage.setItem('funcionarios', JSON.stringify(funcionarios));
  localStorage.setItem('escala', JSON.stringify(escala));
}

// =================== RESETAR ESCALA ===================
function resetarEscala() {
  const senhaCorreta = "12345";

  if (!inputMes.value) {
    mostrarToast("Selecione um mês para resetar.", "error");
    return;
  }

  const senha = prompt("Digite a senha para resetar:");

  if (senha === senhaCorreta) {
    if (confirm("Deseja realmente resetar a escala deste mês?")) {
      const chaveMes = inputMes.value;
      escala[chaveMes] = {};
      salvarDados();
      gerarCalendario();
      mostrarToast("Escala resetada!", "success");
    }
  } else {
    mostrarToast("Senha incorreta. Reset cancelado.", "error");
  }
}

// =================== AO CARREGAR A PÁGINA ===================
window.onload = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  inputMes.value = `${ano}-${mes}`;
  gerarCalendario();
};

