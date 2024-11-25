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

// New functionality: Comparative analysis of pet food
function calcularMelhoresRacoes(resultados) {
    // Separar por categorias de qualidade
    const categorias = ["Standard", "Premium", "super premium"];
    const analise = { economia: null, qualidadeEconomica: null };

    // Ração de menor custo diário
    analise.economia = resultados.reduce((prev, curr) => 
        curr.custoDiario < prev.custoDiario ? curr : prev, resultados[0]);

    // Melhor ração em qualidade e economia
    for (let categoria of categorias.reverse()) { // Priorizar categorias superiores
        const filtradas = resultados.filter(r => r.categoria === categoria);
        if (filtradas.length > 0) {
            analise.qualidadeEconomica = filtradas.reduce((prev, curr) => 
                curr.custoDiario < prev.custoDiario ? curr : prev, filtradas[0]);
            break;
        }
    }

    return analise;
}

// Função para exibir as análises
function exibirAnalise(analise) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    tableBody.innerHTML += `
        <tr class="highlight">
            <td colspan="6"><strong>Análise Comparativa</strong></td>
        </tr>
        <tr>
            <td><strong>Mais Econômica:</strong> ${analise.economia.nome}</td>
            <td colspan="5">Custo Diário: R$ ${analise.economia.custoDiario.toFixed(2)}</td>
        </tr>
        <tr>
            <td><strong>Melhor Qualidade/Economia:</strong> ${analise.qualidadeEconomica.nome}</td>
            <td colspan="5">Categoria: ${analise.qualidadeEconomica.categoria} | Custo Diário: R$ ${analise.qualidadeEconomica.custoDiario.toFixed(2)}</td>
        </tr>
    `;
}

// Integrating the new functionality into the results display
document.addEventListener("DOMContentLoaded", () => {
    async function processarCalculo() {
        try {
            // Original calculation logic remains unchanged

            // After calculating products, add the new functionality
            const analise = calcularMelhoresRacoes(resultados);
            exibirAnalise(analise);
        } catch (error) {
            console.error("Erro ao processar o cálculo:", error);
        }
    }
});

// New logic for CSV handling based on user-provided structure

// Load pet food data from CSV and parse it
async function carregarRacoesPorTipo(tipoPet, pesoPacote) {
    const baseUrl = window.location.origin; // Detects the base URL automatically
    try {
        const response = await fetch(`${baseUrl}/filter-racoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipoPet, pesoPacote })
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar os dados do servidor.");
        }

        const racoes = await response.json();
        return racoes.map(racao => ({
            nome: racao.nome,
            preco: parseFloat(racao.preco),
            densidade: parseFloat(racao.densidade), // kcal/kg
            pesoPacote: parseFloat(racao.pesoPacote), // kg
            tipo: racao.tipo.toLowerCase(), // cão ou gato
            categoria: racao.categoria, // Standard, Premium ou Super Premium
            compra: racao.compra // URL for purchase
        }));
    } catch (error) {
        console.error("Erro ao carregar as rações:", error);
        return [];
    }
}

// Adjusting calculation of products to align with the new structure
function calcularProdutos(consumoDiarioKcal, racoesFiltradas, pesoPacoteSelecionado) {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) {
        console.error("Elemento 'tableBody' não encontrado no DOM.");
        return [];
    }

    tableBody.innerHTML = ""; // Clears previous results

    return racoesFiltradas.map(racao => {
        const precoPorKg = racao.preco / racao.pesoPacote;
        const precoAtualizado = precoPorKg * pesoPacoteSelecionado;

        const consumoDiarioGramas = (consumoDiarioKcal / racao.densidade) * 1000;
        const custoDiario = (consumoDiarioGramas / 1000) * precoPorKg;
        const duracaoPacote = (pesoPacoteSelecionado * 1000) / consumoDiarioGramas;

        // Adds data to the table
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

// Updated integration with comparative analysis
document.addEventListener("DOMContentLoaded", () => {
    async function processarCalculo() {
        try {
            // Original logic for capturing form inputs
            const tipoPet = document.getElementById("tipo-pet")?.value.toLowerCase();
            const peso = parseFloat(document.getElementById("peso")?.value);
            const idade = parseFloat(document.getElementById("idade")?.value);
            const atividade = parseFloat(document.getElementById("atividade")?.value);
            const pesoPacoteSelecionado = parseFloat(document.getElementById("peso-pacote")?.value);

            if (!tipoPet || peso <= 0 || isNaN(peso) || idade < 0 || isNaN(idade) || atividade <= 0 || isNaN(atividade) || pesoPacoteSelecionado <= 0 || isNaN(pesoPacoteSelecionado)) {
                alert("Preencha todos os campos corretamente.");
                return;
            }

            // Logic for calculating daily consumption
            const consumoDiarioKcal = calcularConsumoDiario(peso, atividade, idade);
            const racoesFiltradas = await carregarRacoesPorTipo(tipoPet, pesoPacoteSelecionado);
            const resultados = calcularProdutos(consumoDiarioKcal, racoesFiltradas, pesoPacoteSelecionado);

            if (resultados.length === 0) {
                alert("Nenhuma ração disponível para o tipo de pet selecionado.");
                return;
            }

            // Perform comparative analysis and display it
            const analise = calcularMelhoresRacoes(resultados);
            exibirAnalise(analise);
        } catch (error) {
            console.error("Erro ao processar o cálculo:", error);
        }
    }

    const calcularButton = document.getElementById("calcular");
    if (calcularButton) {
        calcularButton.addEventListener("click", processarCalculo);
    }
});

// Function to display analysis in an attractive card format
function exibirAnalise(analise) {
    const resultsContainer = document.getElementById("results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML += `
        <div class="highlight-analysis">
            <h3><i class="fas fa-coins"></i> Mais Econômica</h3>
            <p><strong>${analise.economia.nome}</strong></p>
            <p>Custo Diário: R$ ${analise.economia.custoDiario.toFixed(2)}</p>
        </div>
        <div class="highlight-analysis">
            <h3><i class="fas fa-trophy"></i> Melhor Qualidade/Economia</h3>
            <p><strong>${analise.qualidadeEconomica.nome}</strong></p>
            <p>Categoria: ${analise.qualidadeEconomica.categoria}</p>
            <p>Custo Diário: R$ ${analise.qualidadeEconomica.custoDiario.toFixed(2)}</p>
        </div>
    `;
}
