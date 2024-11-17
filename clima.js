const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function getWeatherData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const siteURL = 'https://www.tempo.com/sorocaba.htm';

    try {
        // Obtém os dados mais recentes do MockAPI
        const mockAPIUrl = 'https://67365087aafa2ef222302dfc.mockapi.io/climaUpx/clima2';
        const response = await fetch(mockAPIUrl);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados existentes do MockAPI');
        }
        const data = await response.json();

        // Ordena os dados por `lastUpdated` e pega o mais recente
        const lastEntry = data.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))[0];
        const lastUpdatedFromAPI = lastEntry ? new Date(lastEntry.lastUpdated) : new Date(0); // Data mínima se não houver registros

        await page.goto(siteURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Iniciando a coleta de dados do clima...');

        // Coleta os dados do site
        const chuva = await page.$eval('.txt-strng.probabilidad.center', element => element.textContent.trim());
        const temperatura = await page.$eval('.max.changeUnitT', element => element.textContent.trim());
        const qtde = await page.$eval('.changeUnitR', element => element.textContent.trim());
        const currentUpdate = new Date().toISOString();

        console.log(`Dados coletados: Chuva: ${chuva}, Temperatura: ${temperatura}, Quantidade de Chuva: ${qtde}, Última Atualização: ${currentUpdate}`);

        await browser.close();

        if (!temperatura || !chuva || !qtde) {
            throw new Error("Dados inválidos ou ausentes do site.");
        }

        // Formata os dados para envio
        const dataToMockAPI = {
            chuva: parseInt(chuva, 10),
            temperatura: parseFloat(temperatura),
            qtde: parseFloat(qtde.replace(/[^\d.-]/g, '')),
            lastUpdated: currentUpdate
        };

        // Verifica se a nova coleta é mais recente do que a última entrada
        if (new Date(currentUpdate) > lastUpdatedFromAPI) {
            console.log('Enviando dados para o MockAPI...', dataToMockAPI);

            const response = await fetch(mockAPIUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToMockAPI)
            });

            if (!response.ok) {
                throw new Error('Erro ao enviar dados para o MockAPI');
            }

            console.log('Dados enviados com sucesso para o MockAPI');
        } else {
            console.log('Os dados coletados não são mais recentes do que a última atualização. Nenhuma ação foi tomada.');
        }
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        await browser.close();
    }
}

// Define o intervalo de execução a cada 1 minuto (60.000 ms)
setInterval(getWeatherData, 60000); // Atualiza a cada 1 minuto
