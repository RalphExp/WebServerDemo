import asyncio
import tornado
import tornado.httpclient
import financial.db as db
import financial.util as util

import config

async def getRawData(symbol:str):
    """ fetch the raw finanical data directly from the AlphaVantage
    and save it to database

    @param symbol: IBM/AAPL are the only two symbol supported    
    """

    internal_symbol = symbol
    httpClient = tornado.httpclient.AsyncHTTPClient()   
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol={internal_symbol}&outputsize=full&apikey={config.AVANTAGE_KEY}"

    rsp = await httpClient.fetch(url)

    if rsp.code == 200:
        db.updateFinancialData(symbol, util.loadJson(rsp.body))
        return 0
    
    return -1


if __name__ == '__main__':
    db.initDatabase()
    loop = asyncio.get_event_loop()
    taskGroup = asyncio.gather(getRawData('IBM'), getRawData('AAPL'))
    loop.run_until_complete(taskGroup)

