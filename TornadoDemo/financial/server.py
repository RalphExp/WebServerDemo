####################################
# An HttpServer demo using tornado #
####################################

import sys
sys.path.append('..')

import asyncio
import datetime
import tornado
import tornado.web
import tornado.httpserver

import db
import util
import config

class FinancialHandler(tornado.web.RequestHandler):
    
    async def get(self):
        """ get financial data from Database
        @param startDate: default to be the current date
        @param endDate: default to be the  
        @param page: must be >= 1
        @param limit: must be 1 <= limit <= 100
        """
        startDate = self.get_argument('start_date', None)
        endDate = self.get_argument('end_date', None)
        symbol = self.get_argument('symbol', 'IBM')
        page = self.get_argument('page', '1')
        limit = self.get_argument('limit', '5')

        now = datetime.datetime.now()
        try:
            if startDate == None:
                startDate = now.strftime('%Y-%m-%d')
            else:
                util.validateDate(startDate)

            if endDate == None:
                endDate = now.strftime('%Y-%m-%d')
            else: 
                util.validateDate(endDate)
            
            if startDate > endDate:
                raise util.ParameterError('startDate can not be greater than endDate')
            
            if symbol not in ('IBM', 'AAPL'):
                raise util.ParameterError(f'symbol {symbol} not support')
            
            # validate page, limit and transform them into integer
            page = util.validatePage(page)
            limit = util.validateLimit(limit)
   
            # data is json
            data = db.getFinancialData(symbol, startDate, endDate, page, limit)
            pagination = db.getPaginationData(symbol, startDate, endDate, page, limit)
            self.write(util.dumpFinancialJson(data, pagination))

        except util.ParameterError as e:
            self.set_status(400)
            self.write(util.dumpFinancialError(str(e)))

        except Exception as e:
            # print the error to the console
            # and throws the exception again 500
            print(str(e))
            raise


class StatisticsHandler(tornado.web.RequestHandler):

    async def get(self):
        """ get statistics from a given peroid of time
        """
        startDate = self.get_argument('start_date', None)
        endDate = self.get_argument('end_date', None)
        symbol = self.get_argument('symbol', 'IBM')

        now = datetime.datetime.now()
        try:
            if startDate == None:
                startDate = now.strftime('%Y-%m-%d')
            else:
                util.validateDate(startDate)

            if endDate == None:
                endDate = now.strftime('%Y-%m-%d')
            else: 
                util.validateDate(endDate)
            
            if startDate > endDate:
                raise util.ParameterError('startDate can not be greater than endDate')
            
            if symbol not in ('IBM', 'AAPL'):
                raise util.ParameterError(f'symbol {symbol} not support')

            data = db.getStatisticsData(symbol, startDate, endDate)
            self.write(util.dumpStatisticsJson(data, startDate, endDate))

        except util.ParameterError as e:
            self.set_status(400)
            self.write(util.dumpStatisticsError(str(e)))

        except Exception as e:
            # print the error to the console
            # and throws the exception again 500
            print(str(e))
            raise


async def main():
    app = tornado.web.Application([
        (r'/v1/financial', FinancialHandler),
        (r'/v1/statistics', StatisticsHandler)
    ])
    app.listen(config.HTTP_PORT)
    await asyncio.Event().wait()


async def asyncUpdate():
    """ a timer function for updating the latest data 
    from the website every 5mins
    """
    import get_raw_data

    db.initDatabase()    
    while True:
        try:
            print('update data...')
            await get_raw_data.getRawData('IBM')
            await get_raw_data.getRawData('AAPL')
            print('update done ...')
        except Exception as e:
            print(str(e))
        finally:
            await asyncio.sleep(300)

    
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(asyncio.gather(asyncUpdate(), main()))
