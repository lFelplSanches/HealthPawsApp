document.addEventListener("DOMContentLoaded", () => {
    // Função principal de cálculo
    async function processarCalculo() {
        try {
            // Captura os valores do formulário
            const tipoPet = document.getElementById("tipo-pet")?.value.toLowerCase();
            const peso = parseFloat(document.getElementById("peso")?.value);
            const idade = parseFloat(document.getElementById("idade")?.value);
            const atividade = parseFloat(document.getElementById("atividade")?.value);
            const pesoPacoteSelecionado = parseFloat(document.getElementById("peso-pacote")?.value);

            // Logs para depuração
            console.log("Valores capturados:", { tipoPet, peso, idade, atividade, pesoPacoteSelecionado });

            // Validação dos campos
            if (!tipoPet || peso <= 0 || isNaN(peso) || idade < 0 || isNaN(idade) || atividade <= 0 || isNaN(atividade) || pesoPacoteSelecionado <= 0 || isNaN(pesoPacoteSelecionado)) {
                alert("Preencha todos os campos corretamente.");
                return;
            }

            // Lógica de cálculo
            const consumoDiarioKcal = calcularConsumoDiario(peso, atividade, idade);
            const racoesFiltradas = await carregarRacoesPorTipo(tipoPet, pesoPacoteSelecionado);
            const resultados = calcularProdutos(consumoDiarioKcal, racoesFiltradas, pesoPacoteSelecionado);

            if (resultados.length === 0) {
                alert("Nenhuma ração disponível para o tipo de pet selecionado.");
                return;
            }

            const resultsContainer = document.getElementById("results");
            if (resultsContainer) {
                resultsContainer.style.display = "block"; // Mostra os resultados
            } else {
                console.error("Elemento 'results' não encontrado no DOM.");
            }
        } catch (error) {
            console.error("Erro ao processar o cálculo:", error);
        }
    }

    // Associar o evento de clique ao botão
    const calcularButton = document.getElementById("calcular");
    if (calcularButton) {
        calcularButton.addEventListener("click", processarCalculo);
    } else {
        console.error("Botão calcular não encontrado no DOM.");
    }
});

// Função para carregar os dados das rações
async function carregarRacoesPorTipo(tipoPet, pesoPacote) {
    const baseUrl = window.location.origin; // Detecta a URL base automaticamente
    try {
        const response = await fetch(`${baseUrl}/filter-racoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoPet, pesoPacote })
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados do servidor.");
        }

        return await response.json();
    } catch (error) {
        console.error("Erro ao carregar as rações:", error);
        return [];
    }
}

// Função para calcular o consumo diário em calorias
function calcularConsumoDiario(peso, atividade, idade) {
    let fatorIdade = 1;
    if (idade < 1) {
        fatorIdade = 1.5; // Filhotes
    } else if (idade > 7) {
        fatorIdade = 0.8; // Idosos
    }

    const consumoDiarioKcal = 70 * Math.pow(peso, 0.75) * atividade * fatorIdade;
    console.log(`Consumo diário (kcal): ${consumoDiarioKcal.toFixed(2)} (Idade: ${idade}, Fator Idade: ${fatorIdade})`);
    return consumoDiarioKcal;
}

// Função para calcular os produtos e exibi-los na tabela
function calcularProdutos(consumoDiarioKcal, racoesFiltradas, pesoPacoteSelecionado) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) {
        console.error("Elemento 'tableBody' não encontrado no DOM.");
        return [];
    }

    tableBody.innerHTML = ""; // Limpa os resultados anteriores

    return racoesFiltradas.map(racao => {
        const precoPorKg = racao.preco / racao.pesoPacote;
        const precoAtualizado = precoPorKg * pesoPacoteSelecionado;

        const consumoDiarioGramas = (consumoDiarioKcal / racao.densidade) * 1000;
        const custoDiario = (consumoDiarioGramas / 1000) * precoPorKg;
        const duracaoPacote = (pesoPacoteSelecionado * 1000) / consumoDiarioGramas;

        // Adiciona os dados à tabela
        tableBody.innerHTML += `
          <tr>
            <td>${racao.nome}</td>
            <td>R$ ${precoAtualizado.toFixed(2)}</td>
            <td>${consumoDiarioGramas.toFixed(2)} g</td>
            <td>R$ ${custoDiario.toFixed(2)}</td>
            <td>${Math.floor(duracaoPacote)} dias</td>
            <td>${racao.compra ? `<a href="${racao.compra}" target="_blank" title="Comprar"><i class="fas fa-shopping-cart"></i></a>` : "Não disponível"}</td>
          </tr>
        `;

        return {
            ...racao,
            consumoDiarioGramas,
            custoDiario,
            duracaoPacote
        };
    });
}
