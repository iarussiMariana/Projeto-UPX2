const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function getWeatherData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const siteURL = 'https://www.tempo.com/sorocaba.htm';

    try {
        await page.goto(siteURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Iniciando a coleta de dados do clima...');

        // Coleta os dados do site
        const chuva = await page.$eval('.txt-strng.probabilidad.center', element => element.textContent.trim());
        const temperatura = await page.$eval('.max.changeUnitT', element => element.textContent.trim());
        const qtde = await page.$eval('.changeUnitR', element => element.textContent.trim());
        const lastUpdated = new Date().toISOString();

        console.log(`Dados coletados: Chuva: ${chuva}, Temperatura: ${temperatura}, Quantidade de Chuva: ${qtde}, Última Atualização: ${lastUpdated}`);

        await browser.close();

        // Verifique se os dados coletados são válidos
        if (!temperatura || !chuva || !qtde) {
            throw new Error("Dados inválidos ou ausentes do site.");
        }

        // Formata os dados para envio
        const dataToMockAPI = {
            chuva: parseInt(chuva, 10),
            temperatura: parseFloat(temperatura),
            qtde: parseFloat(qtde.replace(/[^\d.-]/g, '')),
            lastUpdated: lastUpdated
        };

        console.log('Enviando dados para o MockAPI...', dataToMockAPI);

        // URL alterada para o novo recurso "clima2"
        const mockAPIUrl = 'https://67365087aafa2ef222302dfc.mockapi.io/climaUpx/clima2';
        const response = await fetch(mockAPIUrl, {
            method: 'POST', // Usando POST para enviar os dados
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToMockAPI)
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar dados para o MockAPI');
        }

        console.log('Dados enviados com sucesso para o MockAPI');
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        await browser.close();
    }
}

// Define o intervalo de execução a cada 1 minuto (60.000 ms)
setInterval(getWeatherFromAPI, 14400000);  // Atualiza a cada 1 minuto
