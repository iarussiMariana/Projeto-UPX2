const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

async function getWeatherData() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Substitua pela URL do site que você deseja fazer o scraping
    const siteURL = 'https://www.tempo.com/sorocaba.htm';

    try {
        await page.goto(siteURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('Dados recebidos da API:', data);

        // Ajuste os seletores de acordo com a inspeção do site
        const temperatura = await page.$eval('.max.changeUnitT', element => element.textContent.trim());
        const chuva = await page.$eval('.txt-strng.probabilidad.center', element => element.textContent.trim());
        const qtde = await page.$eval('.changeUnitR', element => element.textContent.trim());
        const lastUpdated = new Date().toISOString();

        await browser.close();

        const dataToMockAPI = {
            temperatura: parseFloat(temperatura),
            chuva: parseInt(chuva, 10),
            qtde: qtde,
            lastUpdated: lastUpdated
        };

        const mockAPIUrl = 'https://67365087aafa2ef222302dfc.mockapi.io/climaUpx/clima';

        const response = await fetch(`${mockAPIUrl}/ID_DO_REGISTRO`, {
            method: 'PUT', // ou 'POST' conforme necessidade
            headers: {
                'Content-Type': 'application/json'
            },
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

setInterval(getWeatherData, 300000);

